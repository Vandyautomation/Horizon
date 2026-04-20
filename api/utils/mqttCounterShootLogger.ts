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

let client: mqtt.MqttClient | null = null
let lastError: string | null = null
let lastMessageAt: string | null = null
let latestPayload: CounterShootPayload | null = null
let activeBrokerUrl: string | null = null
let sequence = 0
const memoryLogs: CounterShootLogEntry[] = []
const subscribers = new Set<(entry: CounterShootLogEntry) => void>()

function toSafeString(value: unknown) {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

function toFiniteNumberOrNull(value: unknown) {
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

function mapPayload(input: Record<string, unknown>): CounterShootPayload {
  return {
    id: toSafeString(input.id),
    loc: toSafeString(input.loc),
    number: toSafeString(input.number),
    shoot: toFiniteNumberOrNull(input.shoot),
    status: toSafeString(input.status),
  }
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
    const parsed = JSON.parse(message.toString()) as Record<string, unknown>
    const payload = mapPayload(parsed || {})
    latestPayload = payload
    pushMemoryLog(topic, payload)
  } catch (error) {
    lastError = (error as Error)?.message || 'Failed processing MQTT message'
    console.error('MQTT counter shoot logger error:', error)
  }
}

export async function startCounterShootLogger() {
  if (client) return

  const url =
    (process.env.MQTT_URL_DMKSRV02 || '').trim() ||
    (process.env.MQTT_URL_COUNTER_SHOOT || '').trim() ||
    (process.env.MQTT_URL_DMKSRV02_WS || '').trim() ||
    (process.env.MQTT_URL_COUNTER_SHOOT_WS || '').trim() ||
    (process.env.MQTT_URL_COUNTBOARD || '').trim() ||
    (process.env.NEXT_PUBLIC_MQTT_WS || '').trim() ||
    (process.env.MQTT_URL || '').trim() ||
    DEFAULT_DMKSRV02_MQTT_URL

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
  }
}
