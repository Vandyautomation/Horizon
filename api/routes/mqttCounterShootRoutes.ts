import { Hono } from 'hono'
import {
  getCounterShootLoggerStatus,
  getCounterShootLogs,
  startCounterShootLogger,
  subscribeCounterShootLogs,
} from '../utils/mqttCounterShootLogger'

const mqttCounterShootRoutes = new Hono()

mqttCounterShootRoutes.get('/', async (c) => {
  try {
    await startCounterShootLogger()
    const limitRaw = Number(c.req.query('limit') || '20')
    const logs = await getCounterShootLogs(limitRaw)
    return c.json({
      status: getCounterShootLoggerStatus(),
      logs,
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

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        const write = (data: unknown) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        }

        write({ type: 'connected' })
        write({ type: 'snapshot', status, logs })

        const unsubscribe = subscribeCounterShootLogs((entry) => {
          write({ type: 'log', entry })
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
