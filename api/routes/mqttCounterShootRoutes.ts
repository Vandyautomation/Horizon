import { Hono } from 'hono'
import {
  getCounterShootByBuildingAndMachine,
  getCounterShootLatestMachines,
  getCounterShootMachine,
  getCounterShootLoggerStatus,
  getCounterShootLogs,
  startCounterShootLogger,
  subscribeCounterShootLogs,
} from '../utils/mqttCounterShootLogger'

const mqttCounterShootRoutes = new Hono()

function getStatusWithoutLatestPayload() {
  const status = getCounterShootLoggerStatus()
  const { latestPayload: _latestPayload, ...statusWithoutLatest } = status
  return statusWithoutLatest
}

mqttCounterShootRoutes.get('/', async (c) => {
  try {
    await startCounterShootLogger()
    const limitRaw = Number(c.req.query('limit') || '20')
    const logs = await getCounterShootLogs(limitRaw)
    const machines = getCounterShootLatestMachines()
    const byBuildingMachine = getCounterShootByBuildingAndMachine()
    return c.json({
      status: getCounterShootLoggerStatus(),
      logs,
      machines,
      byBuildingMachine,
    })
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500)
  }
})

mqttCounterShootRoutes.get('/by-building-machine', async (c) => {
  try {
    await startCounterShootLogger()
    return c.json({
      status: getCounterShootLoggerStatus(),
      byBuildingMachine: getCounterShootByBuildingAndMachine(),
    })
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500)
  }
})

mqttCounterShootRoutes.get('/machine', async (c) => {
  try {
    await startCounterShootLogger()
    const id = (c.req.query('id') || '').trim()
    const loc = (c.req.query('loc') || '').trim()
    const number = (c.req.query('number') || '').trim()

    if (!id && !(loc && number)) {
      return c.json(
        { error: "Provide 'id' or both 'loc' and 'number' query params." },
        400
      )
    }

    const machine = getCounterShootMachine({ id, loc, number })
    if (!machine) {
      return c.json({ error: 'Machine not found in current MQTT state.' }, 404)
    }

    return c.json({
      status: getStatusWithoutLatestPayload(),
      machine,
    })
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500)
  }
})

mqttCounterShootRoutes.get('/machine/:loc/:number', async (c) => {
  try {
    await startCounterShootLogger()
    const loc = (c.req.param('loc') || '').trim()
    const number = (c.req.param('number') || '').trim()

    if (!loc || !number) {
      return c.json({ error: "Provide both 'loc' and 'number' path params." }, 400)
    }

    const machine = getCounterShootMachine({ loc, number })
    if (!machine) {
      return c.json({ error: 'Machine not found in current MQTT state.' }, 404)
    }

    return c.json({
      status: getStatusWithoutLatestPayload(),
      machine,
    })
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500)
  }
})

mqttCounterShootRoutes.get('/stream', async (c) => {
  try {
    await startCounterShootLogger()
    const limitRaw = Number(c.req.query('limit') || '20')
    const logs = await getCounterShootLogs(limitRaw)
    const status = getCounterShootLoggerStatus()
    const machines = getCounterShootLatestMachines()
    const byBuildingMachine = getCounterShootByBuildingAndMachine()

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        const write = (data: unknown) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        }

        write({ type: 'connected' })
        write({ type: 'snapshot', status, logs, machines, byBuildingMachine })

        const unsubscribe = subscribeCounterShootLogs((entry) => {
          write({ type: 'log', entry })
          write({
            type: 'state',
            machines: getCounterShootLatestMachines(),
            byBuildingMachine: getCounterShootByBuildingAndMachine(),
          })
        })

        const pingId = setInterval(() => {
          controller.enqueue(encoder.encode('event: ping\ndata: {}\n\n'))
        }, 25000)

        return () => {
          clearInterval(pingId)
          unsubscribe()
          controller.close()
        }
      },
      cancel() {
        return
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500)
  }
})

export default mqttCounterShootRoutes
