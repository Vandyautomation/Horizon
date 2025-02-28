import { Hono } from 'hono';

import { getTask } from '../controllers/scaleTaskController';
import { addEquipment, getEquipment } from '../controllers/equipmentController';


const equipmentRoutes = new Hono();

equipmentRoutes.get('/', async (c) => {
  try {
    const data = await getEquipment();
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});


equipmentRoutes.post('/', async (c) => {
  const { name, description } = await c.req.json();
  try {
    await addEquipment(name, description);
    return c.json({ message: 'Data added successfully' });
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

export default equipmentRoutes;
