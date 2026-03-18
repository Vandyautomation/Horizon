import { Hono } from 'hono'
import { getZhafirActualFromView } from '../controllers/zhafirController'
import {
  getLatestZhafirCountboardByTopic,
  getZhafirCountboardMqttStatus,
} from '../utils/mqttZhafirCountboard'
import { queryDatabase } from '../utils/queryDatabase'

const zhafirCountboardRoutes = new Hono()
const COUNTBOARD_FIELDS = [
  'InjectScrewPosition',
  'VPPositionText',
  'InjPeakPressure',
  'Thickness',
  'VPTimeText',
] as const

function toFiniteNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return null
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

function pickCountboardValues(input: Record<string, unknown> | undefined) {
  const source = input || {}
  return {
    InjectScrewPosition: toFiniteNumber(source.InjectScrewPosition),
    VPPositionText: toFiniteNumber(source.VPPositionText),
    InjPeakPressure: toFiniteNumber(source.InjPeakPressure),
    Thickness: toFiniteNumber(source.Thickness),
    VPTimeText: toFiniteNumber(source.VPTimeText),
  }
}

function parseBuildingCode(locationRaw: string) {
  const text = (locationRaw || '').trim().toLowerCase()
  if (!text) return null

  const match = text.match(/inj\s*bld\s*([a-z0-9]+)/i)
  if (match?.[1]) return match[1].charAt(0).toLowerCase()

  if (text.includes('building g') || text.includes('bld g')) return 'g'
  if (text.includes('building f') || text.includes('bld f')) return 'f'
  return null
}

async function resolveTopicByMachine(machineId: string) {
  const rows = await queryDatabase(
    `
      SELECT TOP 1 MchLoc AS locationName, MchNumber AS machineNumber
      FROM IoT.dbo.MachineMST
      WHERE MchID = @MachineID
        AND Active = 1
    `,
    { MachineID: machineId }
  )

  const row = rows?.[0] as
    | { locationName?: string | null; machineNumber?: string | number | null }
    | undefined
  if (!row) return null

  const buildingCode = parseBuildingCode(String(row.locationName || ''))
  const machineNumber = String(row.machineNumber ?? '').trim()
  if (!buildingCode || !machineNumber) return null

  return `sparameter/building/${buildingCode}/${machineNumber}`
}

zhafirCountboardRoutes.get('/live', async (c) => {
  try {
    const paraId = c.req.query('paraId') || undefined
    const machineId = (c.req.query('machine_id') || c.req.query('machineId') || '').trim()
    const topicOverride = (c.req.query('topic') || '').trim()
    const maxAgeMsRaw = Number(c.req.query('maxAgeMs') || '120000')
    const maxAgeMs = Number.isFinite(maxAgeMsRaw)
      ? Math.min(Math.max(maxAgeMsRaw, 1000), 10 * 60 * 1000)
      : 120000

    if (!machineId) {
      return c.json({ error: 'machine_id (or machineId) is required' }, 400)
    }

    const topic = topicOverride || (await resolveTopicByMachine(machineId))
    const mqttStatus = getZhafirCountboardMqttStatus()

    if (topic) {
      const mqttLive = getLatestZhafirCountboardByTopic(topic, maxAgeMs)
      if (mqttLive) {
        return c.json({
          source: 'mqtt',
          fallback: false,
          machineId,
          topic,
          actualDate: mqttLive.actualDate,
          fields: COUNTBOARD_FIELDS,
          values: pickCountboardValues(mqttLive.values as Record<string, unknown>),
          mqttStatus,
        })
      }
    }

    const fallback = await getZhafirActualFromView(paraId, machineId)
    return c.json({
      source: 'zhafir_actual_view',
      fallback: true,
      machineId,
      topic: topic || null,
      actualDate: fallback.actualDate,
      fields: COUNTBOARD_FIELDS,
      values: pickCountboardValues((fallback.values || {}) as Record<string, unknown>),
      mqttStatus,
    })
  } catch (error) {
    return c.json({ error: (error as Error).message }, 400)
  }
})

export default zhafirCountboardRoutes
