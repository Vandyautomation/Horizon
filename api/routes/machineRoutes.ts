import { Hono } from 'hono';
import { addMachine, getHourlyMachine, getMachine, getNooeMachine, getOeeMachine, getTaskMachine } from '../controllers/machineController';
import { getTask } from '../controllers/scaleTaskController';


const machineRoutes = new Hono();

machineRoutes.get('/', async (c) => {
  try {
    const data = await getMachine();
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

machineRoutes.get('/hourly/:machineId', async (c) => {
  try {
    const machine_id = c.req.param('machineId'); 
    const data = await getHourlyMachine(machine_id);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

machineRoutes.get('/oee/:machineId', async (c) => {
  try {
    const machine_id = c.req.param('machineId'); 
    const data = await getOeeMachine(machine_id);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

machineRoutes.get('/noee/:machineId', async (c) => {
  try {
    const machine_id = c.req.param('machineId'); 
    const data = await getNooeMachine(machine_id);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

machineRoutes.get('/tasks/:machineName', async (c) => {
  try {
    const machineName = c.req.param('machineName'); 
    const data = await getTaskMachine(machineName);
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
