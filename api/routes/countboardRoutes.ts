import { Hono } from 'hono'
import {
  addCoois,
  addRouting,
  attachPo,
  editProcess,
  editTopScrap,
  getCoois,
  getRejectLists,
  submitOrangeTicket,
  updateComment,
  updateCVT,
  getTickets,
  getUsers,
  editScrap,
  editRework,
  getAssignUsers,
  getTicketByEskalasi,
  updateTicketEskalasi,
  getProblem,
  getProblemStatusCount,
  getLostTime,
} from '../controllers/countboardController'
//import { addCoois, addRouting, attachPo, editProcess, editTopScrap, getCoois, getRejectLists, updateComment, updateCVT } from '../controllers/countboardController';

const countboardRoutes = new Hono()

type CacheSource = 'hit' | 'miss' | 'inflight' | 'stale'

type CacheEntry<T> = {
  data: T | null
  expiresAt: number
  inflight: Promise<T> | null
}

const COUNTBOARD_CACHE_TTL_MS = 10_000

const lostTimeCache = new Map<string, CacheEntry<unknown>>()
const problemCache = new Map<string, CacheEntry<unknown>>()
const problemStatusCountCache = new Map<string, CacheEntry<unknown>>()

const invalidateCountboardCache = () => {
  lostTimeCache.clear()
  problemCache.clear()
  problemStatusCountCache.clear()
}

const readThroughCache = async <T>(
  cacheStore: Map<string, CacheEntry<T>>,
  cacheKey: string,
  loader: () => Promise<T>
): Promise<{ data: T; source: CacheSource }> => {
  const entry =
    cacheStore.get(cacheKey) ??
    ({
      data: null,
      expiresAt: 0,
      inflight: null,
    } as CacheEntry<T>)
  cacheStore.set(cacheKey, entry)

  const now = Date.now()
  if (entry.data !== null && entry.expiresAt > now) {
    return { data: entry.data, source: 'hit' }
  }

  if (entry.inflight) {
    const data = await entry.inflight
    return { data, source: 'inflight' }
  }

  entry.inflight = (async () => {
    const fresh = await loader()
    entry.data = fresh
    entry.expiresAt = Date.now() + COUNTBOARD_CACHE_TTL_MS
    return fresh
  })()

  try {
    const data = await entry.inflight
    return { data, source: 'miss' }
  } catch (error) {
    if (entry.data !== null) {
      return { data: entry.data, source: 'stale' }
    }
    throw error
  } finally {
    entry.inflight = null
  }
}

const getMonthDateRange = () => {
  const now = new Date()
  const fromDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
  const toDate = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0)
  return { fromDate, toDate }
}

const parseRangeFromQuery = (fromRaw?: string, toRaw?: string) => {
  if (!fromRaw || !toRaw) {
    return getMonthDateRange()
  }

  const fromDate = new Date(fromRaw)
  const toDate = new Date(toRaw)

  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    return null
  }

  return { fromDate, toDate }
}

const buildRangeCacheKey = (fromDate: Date, toDate: Date) =>
  `${fromDate.toISOString()}__${toDate.toISOString()}`

countboardRoutes.get('/rejects', async (c) => {
  try {
    const data = await getRejectLists()
    return c.json(data)
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500)
  }
})
//menambahkan tiket
countboardRoutes.get('/tickets', async (c) => {
  try {
    const data = await getTickets()
    return c.json(data)
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500)
  }
})

countboardRoutes.get('/coois', async (c) => {
  const poName = c.req.query('poName')
  const type = c.req.query('type')
  try {
    const data = await getCoois(poName, type)
    return c.json(data)
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500)
  }
})

countboardRoutes.put('/topscrap', async (c) => {
  const data = (await c.req.json()) as {
    hourlyId: number
    reject_a: number
    reject_b: number
    reject_c: number
    reject_d: number
  }

  try {
    const res = await editTopScrap(
      data.hourlyId,
      data.reject_a,
      data.reject_b,
      data.reject_c,
      data.reject_d
    )
    return c.json(res)
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500)
  }
})

countboardRoutes.put('/process', async (c) => {
  const data = (await c.req.json()) as { hourlyId: number; process: string }

  try {
    const res = await editProcess(data.hourlyId, data.process)
    return c.json(res)
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500)
  }
})

countboardRoutes.post('/coois', async (c) => {
  const data = await c.req.json()
  // console.log(data)
  try {
    const res = await addCoois(data)

    await fetch('http://dmksrv02:443/upload/api/coois_sync')

    return c.json(res)
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500)
  }
})

countboardRoutes.post('/routing', async (c) => {
  const data = await c.req.json()
  // console.log(data)
  try {
    const res = await addRouting(data)

    await fetch('http://dmksrv02:443/upload/api/routing_sync')

    return c.json(res)
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500)
  }
})

countboardRoutes.post('/utility', async (c) => {
  const data = await c.req.json()

  try {
    const res = await fetch('http://dmksrv02:443/ems/api/utility', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    return c.json(res)
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500)
  }
})

countboardRoutes.post('/task', async (c) => {
  const { poNumber, machineName } = await c.req.json()
  if (!poNumber || !machineName) {
    return c.json({ error: 'PO number and machine name are required' }, 400)
  }
  try {
    await attachPo(poNumber, machineName)
    if (process.env.NODE_ENV === 'development') {
      await fetch('http://localhost:1880/api/task_sync?sync=true')
    } else if (process.env.NODE_ENV === 'production') {
      await fetch('http://dmksrv02:443/upload/api/task_sync?sync=true')
    }
    return c.json({ message: 'PO attached successfully' })
  } catch (error) {
    console.error('Error attaching PO:', error)
    return c.json({ error: (error as Error).message }, 500)
  }
})

countboardRoutes.put('/cvt', async (c) => {
  const { taskId, newCvt } = await c.req.json()
  try {
    await updateCVT(taskId, newCvt)
    return c.json({ message: 'CVT updated successfully' })
  } catch (error) {
    console.error('Error updating CVT:', error)
    return c.json({ error: (error as Error).message }, 500)
  }
})

countboardRoutes.put('/comment', async (c) => {
  const { hourlyId, type, content, uap } = await c.req.json()
  try {
    await updateComment(hourlyId, type, content, uap)
    return c.json({ message: 'Content updated successfully' })
  } catch (error) {
    console.error('Error updating content:', error)
    return c.json({ error: (error as Error).message }, 500)
  }
})
countboardRoutes.post('/ticket', async (c) => {
  const {
    machineId,
    ticketDate,
    categoryId,
    problem,
    actionPlan,
    assignToId,
    assignById,
    eskalasiFlag,
    eskalasiDept,
    ticketColorId,
  } = await c.req.json()

  if (!machineId || !ticketDate || !problem || !actionPlan) {
    return c.json(
      { error: 'machineId, ticketDate, problem, and actionPlan are required' },
      400
    )
  }

  try {
    const result = await submitOrangeTicket(
      machineId,
      ticketDate,
      categoryId,
      problem,
      actionPlan,
      assignToId,
      assignById,
      eskalasiFlag,
      eskalasiDept,
      ticketColorId
    )

    if (!result.affected) {
      return c.json(
        {
          message:
            'No matching TicketTRX found for given machine and ticket date',
        },
        404
      )
    }

    invalidateCountboardCache()

    return c.json({
      message: 'TicketTRX updated successfully',
      affected: result.affected,
    })
  } catch (error) {
    console.error('Error submitting orange ticket:', error)
    return c.json({ error: (error as Error).message }, 500)
  }
})
// countboardRoutes.post('/ticket', async (c) => {
//   const {
//     machineId,
//     ticketDate,
//     problem,
//     actionPlan,
//     assignToId,
//     assignById,
//     eskalasiFlag,
//     eskalasiDept,
//   } = await c.req.json()

//   if (!machineId || !ticketDate || !problem || !actionPlan) {
//     return c.json(
//       { error: 'machineId, ticketDate, problem, and actionPlan are required' },
//       400
//     )
//   }

//   try {
//     const result = await submitOrangeTicket(
//       machineId,
//       ticketDate,
//       problem,
//       actionPlan,
//       assignToId,
//       assignById,
//       eskalasiFlag,
//       eskalasiDept
//     )

//     if (!result.affected) {
//       return c.json(
//         {
//           message:
//             'No matching TicketTRX found for given machine and ticket date',
//         },
//         404
//       )
//     }

//     return c.json({
//       message: 'TicketTRX updated successfully',
//       affected: result.affected,
//     })
//   } catch (error) {
//     console.error('Error submitting orange ticket:', error)
//     return c.json({ error: (error as Error).message }, 500)
//   }
// })

//get user
countboardRoutes.get('/users', async (c) => {
  try {
    const data = await getUsers()
    return c.json(data)
  } catch (error) {
    console.error('Error fetching users:', error)
    return c.json({ error: (error as Error).message }, 500)
  }
})
// get assign users (Operator, Mechanic, SPV)
countboardRoutes.get('/assign-users', async (c) => {
  try {
    const data = await getAssignUsers()
    return c.json(data)
  } catch (error) {
    console.error('Error fetching assign users:', error)
    return c.json({ error: (error as Error).message }, 500)
  }
})

//update scrap
countboardRoutes.put('/scrap', async (c) => {
  try {
    const { hourlyId, scrap } = await c.req.json()

    await editScrap(hourlyId, scrap)

    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500)
  }
})
//update rework
countboardRoutes.put('/rework', async (c) => {
  try {
    const { hourlyId, rework } = await c.req.json()

    await editRework(hourlyId, rework)
    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500)
  }
})
//get ticket by eskalasi flag
countboardRoutes.get('/eskalasi', async (c) => {
  try {
    const fromDate = c.req.query('fromDate')
    const toDate = c.req.query('toDate')

    const data = await getTicketByEskalasi(fromDate, toDate)

    return c.json(data)
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500)
  }
})
countboardRoutes.put('/eskalasi', async (c) => {
  try {
    const body = await c.req.json()

    const { mchId, ticketDate, message, eskalasiStatus } = body

    await updateTicketEskalasi(mchId, ticketDate, message, eskalasiStatus)
    invalidateCountboardCache()

    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500)
  }
})
countboardRoutes.get('/lost-time', async (c) => {
  const startedAt = Date.now()
  try {
    const range = parseRangeFromQuery(c.req.query('fromDate'), c.req.query('toDate'))
    if (!range) {
      return c.json({ error: 'Invalid fromDate/toDate format' }, 400)
    }

    const cacheKey = buildRangeCacheKey(range.fromDate, range.toDate)
    const { data, source } = await readThroughCache(lostTimeCache, cacheKey, () =>
      getLostTime(range.fromDate, range.toDate)
    )
    c.header('X-Countboard-Cache', source)
    c.header('X-Backend-Time', `${Date.now() - startedAt}ms`)
    c.header('X-Range-From', range.fromDate.toISOString())
    c.header('X-Range-To', range.toDate.toISOString())
    return c.json(data)
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500)
  }
})
countboardRoutes.get('/problem', async (c) => {
  const startedAt = Date.now()
  try {
    const range = parseRangeFromQuery(c.req.query('fromDate'), c.req.query('toDate'))
    if (!range) {
      return c.json({ error: 'Invalid fromDate/toDate format' }, 400)
    }

    const cacheKey = buildRangeCacheKey(range.fromDate, range.toDate)
    const { data, source } = await readThroughCache(problemCache, cacheKey, () =>
      getProblem(range.fromDate, range.toDate)
    )
    c.header('X-Countboard-Cache', source)
    c.header('X-Backend-Time', `${Date.now() - startedAt}ms`)
    c.header('X-Range-From', range.fromDate.toISOString())
    c.header('X-Range-To', range.toDate.toISOString())
    return c.json(data)
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500)
  }
})
countboardRoutes.get('/problem-status-counts', async (c) => {
  const startedAt = Date.now()
  try {
    const range = parseRangeFromQuery(c.req.query('fromDate'), c.req.query('toDate'))
    if (!range) {
      return c.json({ error: 'Invalid fromDate/toDate format' }, 400)
    }

    const cacheKey = buildRangeCacheKey(range.fromDate, range.toDate)
    const { data, source } = await readThroughCache(
      problemStatusCountCache,
      cacheKey,
      () => getProblemStatusCount(range.fromDate, range.toDate)
    )
    c.header('X-Countboard-Cache', source)
    c.header('X-Backend-Time', `${Date.now() - startedAt}ms`)
    c.header('X-Range-From', range.fromDate.toISOString())
    c.header('X-Range-To', range.toDate.toISOString())
    return c.json(data)
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500)
  }
})
export default countboardRoutes
