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
  getLostTime,
  getLatestMachineStatus,
} from '../controllers/countboardController'
//import { addCoois, addRouting, attachPo, editProcess, editTopScrap, getCoois, getRejectLists, updateComment, updateCVT } from '../controllers/countboardController';

const countboardRoutes = new Hono()
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

    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500)
  }
})
countboardRoutes.get('/machine-status', async (c) => {
  const mchId = c.req.query('mchId')

  if (!mchId) {
    return c.json({ error: 'mchId is required' }, 400)
  }

  const status = await getLatestMachineStatus(mchId)

  return c.json({ statusLight: status })
})
countboardRoutes.get('/lost-time', async (c) => {
  try {
    const data = await getLostTime()
    return c.json(data)
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500)
  }
})
countboardRoutes.get('/problem', async (c) => {
  try {
    const data = await getProblem()
    return c.json(data)
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500)
  }
})
export default countboardRoutes
