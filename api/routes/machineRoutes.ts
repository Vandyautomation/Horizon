import { Hono } from 'hono';
import { addMachine, getEnergyMachineDaily, getHourlyMachine, getMachine, getNooeMachine, getOeeMachine, getSpindle, getTaskMachine } from '../controllers/machineController';
import { getTask } from '../controllers/scaleTaskController';


const machineRoutes = new Hono();

machineRoutes.get('/', async (c) => {
  try {
    const type = c.req.query('type') || null;
    const data = await getMachine(type);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

machineRoutes.get('/spindle/:machineId', async (c) => {
  try {
    const machine_id = c.req.param('machineId'); 
    const date = c.req.query('date') || null; 
    const shift = c.req.query('shift') || null; 
    const data = await getSpindle(machine_id, date, shift);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

machineRoutes.get('/hourly/:machineId', async (c) => {
  try {
    const machine_id = c.req.param('machineId'); 
    const type = c.req.query('type') || null;
    const date = c.req.query('date') || null; 
    const shift = c.req.query('shift') || null; 
    const data = await getHourlyMachine(machine_id, date, shift, type);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

machineRoutes.get('/oee/:machineId', async (c) => {
  try {
    const machine_id = c.req.param('machineId'); 
    const date = c.req.query('date') || null; 
    const shift = c.req.query('shift') || null; 
    const data = await getOeeMachine(machine_id, date, shift);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

machineRoutes.get('/noee/:machineId', async (c) => {
  try {
    const machine_id = c.req.param('machineId'); 
    const date = c.req.query('date') || null; 
    const shift = c.req.query('shift') || null; 
    const data = await getNooeMachine(machine_id, date, shift);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

machineRoutes.get('/tasks/:machineName', async (c) => {
  try {
    const machineName = c.req.param('machineName'); 
    const date = c.req.query('date') || null; 
    const shift = c.req.query('shift') || null; 
    const data = await getTaskMachine(machineName, date, shift);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

machineRoutes.get('/energy/:machineId', async (c) => {
  try {
    const machine_id = c.req.param('machineId'); 
    const date = c.req.query('date') || null; 
    const data = await getEnergyMachineDaily(machine_id, date);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

machineRoutes.post('/', async (c) => {
  const { name, description } = await c.req.json();
  try {
    await addMachine(name, description);
    return c.json({ message: 'Data added successfully' });
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

export default machineRoutes;
