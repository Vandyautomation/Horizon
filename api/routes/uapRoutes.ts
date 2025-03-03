import { Hono } from 'hono';
import { addUap, getUap } from '../controllers/uapController';




const equipmentRoutes = new Hono();

equipmentRoutes.get('/', async (c) => {
  try {
    const data = await getUap();
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});


equipmentRoutes.post('/', async (c) => {
  const { name } = await c.req.json();
  try {
    await addUap(name);
    return c.json({ message: 'Data added successfully' });
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

export default equipmentRoutes;
