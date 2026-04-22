import mqtt from 'mqtt'

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

let client: mqtt.MqttClient | null = null
let lastError: string | null = null
let lastMessageAt: string | null = null
let latestPayload: CounterShootPayload | null = null
let activeBrokerUrl: string | null = null
let sequence = 0
const memoryLogs: CounterShootLogEntry[] = []
const latestByMachine = new Map<string, CounterShootPayload>()
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
  return Array.from(latestByMachine.values()).sort((a, b) => {
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
    return latestByMachine.get(`id:${id}`) || null
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
  return {
    connected: Boolean(client?.connected),
    brokerUrl: activeBrokerUrl,
    topic: TOPIC,
    lastMessageAt,
    lastError,
    latestPayload,
    bufferedLogs: memoryLogs.length,
    machineCount: latestByMachine.size,
  }
}
