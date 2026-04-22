import mqtt from 'mqtt'
import { queryDatabase } from './queryDatabase'

type CounterShootPayload = {
  id: string
  loc: string
  number: string
  shoot: number | null
  status: string
}

type CounterShootLogEntry = {
  seq: number
  topic: string
  payload: CounterShootPayload
  received_at: string
}

const TOPIC = (process.env.MQTT_COUNTER_SHOOT_TOPIC || 'counter/shoot').trim()
const DEFAULT_DMKSRV02_MQTT_URL = 'mqtt://10.160.50.14:80'
const MAX_MEMORY_LOGS = 200
const FIXED_BUILDINGS = ['G', 'H', 'J', 'Q', 'R', 'S']
const EXPECTED_REFRESH_MS = 5 * 60 * 1000
const FALLBACK_EXPECTED_MACHINE_LIST = `
INJ Bld H	7
INJ Bld J	11
INJ Bld J	10
INJ Bld J	9
INJ Bld J	8
INJ Bld J	6
INJ Bld J	4
INJ Bld J	14
INJ Bld J	13
INJ Bld G	20
INJ Bld G	16
INJ Bld G	21
INJ Bld J	22
INJ Bld J	21
INJ Bld Q	15
INJ Bld H	22
INJ Bld J	12
INJ Bld J	19
INJ Bld J	18
INJ Bld J	15
INJ Bld Q	18
INJ Bld J	20
INJ Bld H	13
INJ Bld H	12
INJ Bld G	10
INJ Bld Q	22
INJ Bld Q	23
INJ Bld Q	24
INJ Bld H	21
INJ Bld H	20
INJ Bld H	14
INJ Bld Q	21
INJ Bld G	11
INJ Bld G	12
INJ Bld G	13
INJ Bld J	17
INJ Bld G	15
INJ Bld H	15
INJ Bld H	24
INJ Bld H	25
INJ Bld J	23
INJ Bld H	10
INJ Bld Q	16
INJ Bld G	17
INJ Bld G	23
INJ Bld G	22
INJ Bld G	19
INJ Bld G	18
INJ Bld H	26
INJ Bld H	11
INJ Bld G	9
INJ Bld H	2
INJ Bld H	23
INJ Bld G	24
INJ Bld G	25
INJ Bld J	2
INJ Bld G	27
INJ Bld G	26
INJ Bld H	1
INJ Bld J	1
INJ Bld H	17
INJ Bld H	16
INJ Bld J	16
INJ Bld J	27
INJ Bld J	28
INJ Bld J	29
INJ Bld J	24
INJ Bld J	25
INJ Bld J	26
INJ Bld H	18
INJ Bld H	9
INJ Bld H	19
INJ Bld H	8
INJ Bld H	3
INJ Bld H	6
INJ Bld Q	17
INJ Bld R	1
INJ Bld H	4
INJ Bld H	5
INJ Bld G	1
INJ Bld G	2
INJ Bld G	3
INJ Bld G	4
INJ Bld G	5
INJ Bld G	6
INJ Bld G	7
INJ Bld G	8
INJ Bld R	2
INJ Bld R	3
INJ Bld R	4
INJ Bld R	5
INJ Bld R	6
INJ Bld R	7
INJ Bld R	8
INJ Bld R	9
INJ Bld R	10
INJ Bld R	11
INJ Bld R	12
INJ Bld R	13
INJ Bld R	14
INJ Bld R	15
INJ Bld S	6
INJ Bld Q	27
INJ Bld Q	26
INJ Bld R	19
INJ Bld R	20
INJ Bld R	21
INJ Bld R	22
INJ Bld R	23
INJ Bld R	24
INJ Bld R	25
INJ Bld R	26
INJ Bld S	1
INJ Bld S	2
INJ Bld S	3
INJ Bld S	4
INJ Bld S	5
INJ Bld S	7
INJ Bld S	8
INJ Bld S	9
INJ Bld S	10
INJ Bld S	11
INJ Bld S	12
INJ Bld R	16
INJ Bld R	17
INJ Bld R	18
`

let client: mqtt.MqttClient | null = null
let lastError: string | null = null
let lastMessageAt: string | null = null
let latestPayload: CounterShootPayload | null = null
let activeBrokerUrl: string | null = null
let sequence = 0
const memoryLogs: CounterShootLogEntry[] = []
const latestByMachine = new Map<string, CounterShootPayload>()
let expectedMachines: CounterShootPayload[] = []
let expectedByKey = new Map<string, CounterShootPayload>()
let expectedById = new Map<string, CounterShootPayload>()
let expectedLoadedAt = 0
const subscribers = new Set<(entry: CounterShootLogEntry) => void>()

function toSafeString(value: unknown) {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

function toFiniteNumberOrNull(value: unknown) {
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

function toRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

function getFirstValue(input: Record<string, unknown>, keys: string[]) {
  const lowered = Object.keys(input).reduce<Record<string, unknown>>((acc, key) => {
    acc[key.toLowerCase()] = input[key]
    return acc
  }, {})

  for (const key of keys) {
    const value = lowered[key.toLowerCase()]
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return value
    }
  }
  return null
}

function mapPayload(rawInput: unknown): CounterShootPayload {
  const input = toRecord(rawInput)
  const nestedData = toRecord(input.data)
  const nestedPayload = toRecord(input.payload)
  const nestedMessage = toRecord(input.message)
  const merged = {
    ...input,
    ...nestedData,
    ...nestedPayload,
    ...nestedMessage,
  }

  return {
    id: toSafeString(
      getFirstValue(merged, ['id', 'mchid', 'mch_id', 'machineid', 'machine_id'])
    ),
    loc: toSafeString(
      getFirstValue(merged, ['loc', 'location', 'mchloc', 'mch_loc', 'building'])
    ),
    number: toSafeString(
      getFirstValue(merged, ['number', 'mchnumber', 'mch_no', 'machine_no', 'machinenumber'])
    ),
    shoot: toFiniteNumberOrNull(
      getFirstValue(merged, ['shoot', 'shot', 'countershoot', 'counter_shoot', 'shoot_count'])
    ),
    status: toSafeString(
      getFirstValue(merged, ['status', 'statuslight', 'state', 'andonstatus'])
    ),
  }
}

function buildMachineKey(payload: CounterShootPayload) {
  const number = normalizeNumber(payload.number)
  const loc = normalizeLoc(payload.loc)
  const id = payload.id.trim()
  if (number && loc) return `loc:${loc}|number:${number}`
  if (id) return `id:${id}`
  if (number) return `number:${number}`
  if (loc) return `loc:${loc}`
  return ''
}

function pickString(current: string, fallback: string) {
  return current.trim() ? current : fallback
}

function normalizeLoc(value: string) {
  return value.trim().toUpperCase()
}

function normalizeNumber(value: string) {
  const raw = value.trim()
  const num = Number(raw)
  if (Number.isFinite(num)) return String(num)
  return raw
}

function mergePayloadWithLatest(payload: CounterShootPayload): CounterShootPayload {
  const key = buildMachineKey(payload)
  if (!key) return payload

  const previous = latestByMachine.get(key)
  const merged: CounterShootPayload = previous
    ? {
        // Keep identity fields stable after first valid record.
        id: pickString(previous.id, payload.id),
        loc: pickString(previous.loc, payload.loc),
        number: pickString(previous.number, payload.number),
        shoot: payload.shoot ?? previous.shoot,
        status: pickString(payload.status, previous.status),
      }
    : payload

  latestByMachine.set(key, merged)
  return merged
}

function buildFallbackExpectedMachines() {
  const result = new Map<string, CounterShootPayload>()
  for (const line of FALLBACK_EXPECTED_MACHINE_LIST.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const match = trimmed.match(/^INJ\s+Bld\s+([A-Za-z]+)\s+(\d+)$/)
    if (!match) continue
    const loc = normalizeLoc(match[1])
    const number = normalizeNumber(match[2])
    const payload: CounterShootPayload = {
      id: '',
      loc,
      number,
      shoot: 0,
      status: 'GREY',
    }
    const key = buildMachineKey(payload)
    if (key) result.set(key, payload)
  }
  return result
}

async function loadExpectedInjectionMachines(force = false) {
  const now = Date.now()
  if (!force && expectedLoadedAt && now - expectedLoadedAt < EXPECTED_REFRESH_MS) return

  const nextByKey = buildFallbackExpectedMachines()
  const nextById = new Map<string, CounterShootPayload>()

  try {
    const rows = await queryDatabase(
      `
      SELECT
        LTRIM(RTRIM(MchID)) AS id,
        UPPER(LTRIM(RTRIM(REPLACE(MchLoc, 'INJ Bld ', '')))) AS loc,
        LTRIM(RTRIM(CAST(MchNumber AS VARCHAR(50)))) AS number
      FROM IoT.dbo.MachineMST WITH (NOLOCK)
      WHERE MchLoc IN ('INJ Bld G', 'INJ Bld H', 'INJ Bld J', 'INJ Bld Q', 'INJ Bld R', 'INJ Bld S')
        AND Active = 1
      ORDER BY MchLoc, TRY_CAST(MchNumber AS INT);
      `
    )

    for (const row of rows as Array<Record<string, unknown>>) {
      const payload: CounterShootPayload = {
        id: toSafeString(row.id),
        loc: normalizeLoc(toSafeString(row.loc)),
        number: normalizeNumber(toSafeString(row.number)),
        shoot: 0,
        status: 'GREY',
      }
      const key = buildMachineKey(payload)
      if (!key) continue
      const previous = nextByKey.get(key)
      nextByKey.set(key, {
        ...payload,
        id: payload.id || previous?.id || '',
      })
    }
  } catch (error) {
    console.warn('Using fallback expected machine list for counter shoot:', (error as Error)?.message || error)
  }

  const nextExpected = Array.from(nextByKey.values())
  for (const payload of nextExpected) {
    if (payload.id) nextById.set(payload.id, payload)
  }

  expectedMachines = nextExpected
  expectedByKey = nextByKey
  expectedById = nextById
  expectedLoadedAt = now
}

function pushMemoryLog(topic: string, payload: CounterShootPayload) {
  sequence += 1
  const entry: CounterShootLogEntry = {
    seq: sequence,
    topic,
    payload,
    received_at: new Date().toISOString(),
  }
  memoryLogs.unshift(entry)
  if (memoryLogs.length > MAX_MEMORY_LOGS) {
    memoryLogs.length = MAX_MEMORY_LOGS
  }
  lastMessageAt = entry.received_at
  for (const listener of subscribers) {
    try {
      listener(entry)
    } catch (error) {
      console.error('MQTT counter shoot subscriber error:', error)
    }
  }
}

async function handleMessage(topic: string, message: Buffer) {
  if (topic !== TOPIC) return
  try {
    const parsed = JSON.parse(message.toString()) as unknown
    const payload = mergePayloadWithLatest(mapPayload(parsed))
    latestPayload = payload
    pushMemoryLog(topic, payload)
  } catch (error) {
    lastError = (error as Error)?.message || 'Failed processing MQTT message'
    console.error('MQTT counter shoot logger error:', error)
  }
}

export async function startCounterShootLogger() {
  await loadExpectedInjectionMachines()
  if (client) return

  const preferredUrls = [
    (process.env.MQTT_URL_DMKSRV02 || '').trim(),
    (process.env.MQTT_URL_COUNTER_SHOOT || '').trim(),
    (process.env.MQTT_URL_COUNTBOARD || '').trim(),
    (process.env.MQTT_URL || '').trim(),
    (process.env.MQTT_URL_DMKSRV02_WS || '').trim(),
    (process.env.MQTT_URL_COUNTER_SHOOT_WS || '').trim(),
    (process.env.NEXT_PUBLIC_MQTT_WS || '').trim(),
  ]
  const url = preferredUrls.find(Boolean) || DEFAULT_DMKSRV02_MQTT_URL

  if (!url) {
    throw new Error('MQTT URL is not configured.')
  }

  activeBrokerUrl = url
  client = mqtt.connect(url)

  client.on('connect', () => {
    client?.subscribe(TOPIC)
  })

  client.on('message', (topic, message) => {
    void handleMessage(topic, message)
  })

  client.on('error', (error) => {
    lastError = (error as Error)?.message || 'MQTT client error'
    console.error('MQTT counter shoot client error:', error)
  })
}

export async function getCounterShootLogs(limit = 20) {
  const safeLimit = Number.isFinite(limit)
    ? Math.min(Math.max(Math.floor(limit), 1), 200)
    : 20
  return memoryLogs.slice(0, safeLimit)
}

export function getCounterShootLatestMachines() {
  const mergedByKey = new Map<string, CounterShootPayload>()

  for (const base of expectedMachines) {
    const key = buildMachineKey(base)
    if (!key) continue
    const fromKey = latestByMachine.get(key)
    const fromId = base.id ? latestByMachine.get(`id:${base.id}`) : null
    const live = fromKey || fromId
    mergedByKey.set(key, {
      id: base.id,
      loc: base.loc,
      number: base.number,
      shoot: live?.shoot ?? base.shoot,
      status: live?.status || base.status,
    })
  }

  for (const [key, payload] of latestByMachine.entries()) {
    if (!mergedByKey.has(key)) {
      mergedByKey.set(key, payload)
    }
  }

  return Array.from(mergedByKey.values()).sort((a, b) => {
    const locCompare = a.loc.localeCompare(b.loc)
    if (locCompare !== 0) return locCompare
    const numA = Number(a.number)
    const numB = Number(b.number)
    if (Number.isFinite(numA) && Number.isFinite(numB)) return numA - numB
    return a.number.localeCompare(b.number)
  })
}

export function getCounterShootByBuildingAndMachine() {
  const grouped: Record<string, Record<string, CounterShootPayload>> = {}
  for (const building of FIXED_BUILDINGS) {
    grouped[building] = {}
  }
  for (const machine of getCounterShootLatestMachines()) {
    const loc = normalizeLoc(machine.loc || 'UNKNOWN')
    const number =
      normalizeNumber(machine.number || '') ||
      machine.id ||
      `UNKNOWN_${Object.keys(grouped).length + 1}`
    if (!grouped[loc]) grouped[loc] = {}
    grouped[loc][number] = machine
  }
  return grouped
}

export function getCounterShootMachine(params: { id?: string; loc?: string; number?: string }) {
  const id = (params.id || '').trim()
  const loc = normalizeLoc(params.loc || '')
  const number = normalizeNumber(params.number || '')

  if (loc && number) {
    const direct = latestByMachine.get(`loc:${loc}|number:${number}`)
    if (direct) return direct

    const machines = getCounterShootLatestMachines()
    return (
      machines.find(
        (m) =>
          normalizeLoc(m.loc) === loc &&
          normalizeNumber(m.number) === number
      ) || null
    )
  }
  if (id) {
    const direct = latestByMachine.get(`id:${id}`)
    if (direct) return direct
    const base = expectedById.get(id)
    if (base) return base
  }

  const machines = getCounterShootLatestMachines()
  return (
    machines.find(
      (m) =>
        (id ? m.id === id : false) ||
        (loc ? normalizeLoc(m.loc) === loc : false) ||
        (number ? normalizeNumber(m.number) === number : false)
    ) ||
    null
  )
}

export function subscribeCounterShootLogs(listener: (entry: CounterShootLogEntry) => void) {
  subscribers.add(listener)
  return () => {
    subscribers.delete(listener)
  }
}

export function getCounterShootLoggerStatus() {
  const machineCount = getCounterShootLatestMachines().length
  return {
    connected: Boolean(client?.connected),
    brokerUrl: activeBrokerUrl,
    topic: TOPIC,
    lastMessageAt,
    lastError,
    latestPayload,
    bufferedLogs: memoryLogs.length,
    machineCount,
  }
}
