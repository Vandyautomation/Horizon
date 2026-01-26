import { Hono } from 'hono';
import { addCoois, addRouting, attachPo, editProcess, editTopScrap, getCoois, getRejectLists, submitOrangeTicket, updateComment, updateCVT, getTickets,getUsers,editScrap,editRework,updateHourlyOperator, getAssignUsers } from '../controllers/countboardController';
//import { addCoois, addRouting, attachPo, editProcess, editTopScrap, getCoois, getRejectLists, updateComment, updateCVT } from '../controllers/countboardController';

const countboardRoutes = new Hono();
countboardRoutes.get('/rejects', async (c) => {


  try {
    const data = await getRejectLists();
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});
//menambahkan tiket 
countboardRoutes.get('/tickets', async (c) => {
  try {
    const data = await getTickets();
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

countboardRoutes.get('/coois', async (c) => {
  const poName = c.req.query('poName');
  const type = c.req.query('type');
  try {
    const data = await getCoois(poName, type);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

countboardRoutes.put('/topscrap', async (c) => {
  const data  = await c.req.json() as ({hourlyId : number, reject_a : number, reject_b : number, reject_c : number, reject_d : number});

  try {
    const res = await editTopScrap(data.hourlyId, data.reject_a, data.reject_b, data.reject_c, data.reject_d);
    return c.json(res);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

countboardRoutes.put('/process', async (c) => {
  const data  = await c.req.json() as ({hourlyId : number, process: string});

  try {
    const res = await editProcess(data.hourlyId, data.process);
    return c.json(res);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

countboardRoutes.post('/coois', async (c) => {
  const data  = await c.req.json();
  // console.log(data)
  try {
    const res = await addCoois(data);

    await fetch("http://dmksrv02:443/upload/api/coois_sync")

    return c.json(res);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});



countboardRoutes.post('/routing', async (c) => {
  const data  = await c.req.json();
  // console.log(data)
  try {
    const res = await addRouting(data);

    await fetch("http://dmksrv02:443/upload/api/routing_sync")

    return c.json(res);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});


countboardRoutes.post('/utility', async (c) => {
  const data = await c.req.json();

  try {

    const res = await fetch("http://dmksrv02:443/ems/api/utility", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return c.json(res);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

countboardRoutes.post('/task', async (c) => {
  const { poNumber, machineName } = await c.req.json();
  if (!poNumber || !machineName) {
    return c.json({ error: 'PO number and machine name are required' }, 400);
  }
  try {
    await attachPo(poNumber, machineName);
    if (process.env.NODE_ENV === "development") {
      await fetch("http://localhost:1880/api/task_sync?sync=true")
    } else if (process.env.NODE_ENV === "production") {
      await fetch("http://dmksrv02:443/upload/api/task_sync?sync=true")
    }
    return c.json({ message: 'PO attached successfully' });
  } catch (error) {
    console.error("Error attaching PO:", error);
    return c.json({ error: (error as Error).message }, 500);
  }
});

countboardRoutes.put('/cvt', async (c) => {
  const { taskId, newCvt } = await c.req.json();
  try {
    await updateCVT(taskId, newCvt);
    return c.json({ message: 'CVT updated successfully' });
  } catch (error) {
    console.error("Error updating CVT:", error);
    return c.json({ error: (error as Error).message }, 500);
  }
});

countboardRoutes.put('/comment', async (c) => {
  const { hourlyId, type, content, uap } = await c.req.json();
  try {
    await updateComment(hourlyId, type, content, uap);
    return c.json({ message: 'Content updated successfully' });
  } catch (error) {
    console.error("Error updating content:", error);
    return c.json({ error: (error as Error).message }, 500);
  }
});

countboardRoutes.post('/ticket', async (c) => {
  const {
    machineId,
    ticketDate,
    problem,
    actionPlan,
    assignToId,
    assignById,
    eskalasiFlag,
    eskalasiDept,
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
      problem,
      actionPlan,
      assignToId,
      assignById,
      eskalasiFlag,
      eskalasiDept
    )

    if (!result.affected) {
      return c.json(
        { message: 'No matching TicketTRX found for given machine and ticket date' },
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



//get user
countboardRoutes.get('/users', async (c) => {
  try {
    const data = await getUsers();
    return c.json(data);
  } catch (error) {
    console.error('Error fetching users:', error);
    return c.json({ error: (error as Error).message }, 500);
  }
});
countboardRoutes.post('/update-operator', async (c) => {
  try {
    // Ambil data dari body request
    const { machine_id, date, shift, operator } = await c.req.json();

    // Validasi sederhana jika diperlukan
    if (!machine_id || !date || !shift || !operator) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const result = await updateHourlyOperator(machine_id, date, shift, operator);
    
    return c.json({ 
      success: true, 
      message: 'Operator updated successfully',
      data: result 
    });
  } catch (error) {
    console.error('Error updating operator:', error);
    return c.json({ error: (error as Error).message }, 500);
  }
});
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
    const { hourlyId, scrap } = await c.req.json();

    await editScrap(hourlyId, scrap);

    return c.json({ success: true });
  } catch (error) {
    return c.json(
      { error: (error as Error).message },
      500
    );
  }
});
//update rework
countboardRoutes.put('/rework', async (c) => {
  try {
    const { hourlyId, rework } = await c.req.json();

    await editRework(hourlyId, rework);
    return c.json({ success: true });
  } catch (error) {
    return c.json(
      { error: (error as Error).message },
      500
    );
  }
});

export default countboardRoutes;
