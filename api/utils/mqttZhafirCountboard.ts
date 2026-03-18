import mqtt from 'mqtt'

type ZhafirCountboardValues = {
  InjectScrewPosition: number | null
  VPPositionText: number | null
  InjPeakPressure: number | null
  Thickness: number | null
  VPTimeText: number | null
}

type ZhafirCountboardCache = {
  topic: string
  actualDate: string
  receivedAt: number
  values: ZhafirCountboardValues
}

const TOPIC_WILDCARD = 'sparameter/building/#'
const cacheByTopic = new Map<string, ZhafirCountboardCache>()
let client: mqtt.MqttClient | null = null

function parseFiniteNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

function mapPayloadValues(input: Record<string, unknown>): ZhafirCountboardValues {
  return {
    InjectScrewPosition: parseFiniteNumber(input.Note_InjStartPos),
    VPPositionText: parseFiniteNumber(input.VP_Position),
    InjPeakPressure: parseFiniteNumber(input.InjPeakPressure),
    Thickness: parseFiniteNumber(input.Note_Cushion),
    VPTimeText: parseFiniteNumber(input.Note_ActInjtTime ?? input.Note_ActInjTime),
  }
}

function connectZhafirCountboardMqtt() {
  if (client) return

  const url = (process.env.MQTT_URL_COUNTBOARD || '').trim()
  if (!url) {
    throw new Error('MQTT_URL_COUNTBOARD is not configured.')
  }

  client = mqtt.connect(url)

  client.on('connect', () => {
    client?.subscribe(TOPIC_WILDCARD)
  })

  client.on('message', (topic, message) => {
    if (!topic.startsWith('sparameter/building/')) return
    try {
      const payload = JSON.parse(message.toString()) as {
        timestamp?: string
        data?: Record<string, unknown>
      }
      const values = mapPayloadValues(payload?.data || {})
      const receivedAt = Date.now()
      const actualDate =
        payload?.timestamp && !Number.isNaN(new Date(payload.timestamp).getTime())
          ? new Date(payload.timestamp).toISOString()
          : new Date(receivedAt).toISOString()

      cacheByTopic.set(topic, {
        topic,
        actualDate,
        receivedAt,
        values,
      })
    } catch (error) {
      console.error('MQTT zhafircountboard parse error:', error)
    }
  })

  client.on('error', (error) => {
    console.error('MQTT zhafircountboard error:', error)
  })
}

export function getLatestZhafirCountboardByTopic(topic: string, maxAgeMs = 120000) {
  connectZhafirCountboardMqtt()
  const entry = cacheByTopic.get(topic)
  if (!entry) return null
  if (Date.now() - entry.receivedAt > Math.max(1000, maxAgeMs)) return null
  return entry
}

export function getZhafirCountboardMqttStatus() {
  connectZhafirCountboardMqtt()
  return {
    connected: Boolean(client?.connected),
    subscribedTopic: TOPIC_WILDCARD,
    cachedTopics: cacheByTopic.size,
  }
}
