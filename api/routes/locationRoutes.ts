import { Hono } from 'hono';
import { addLocation, getLocation } from '../controllers/locationController';




const equipmentRoutes = new Hono();

equipmentRoutes.get('/', async (c) => {
  try {
    const data = await getLocation();
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});


equipmentRoutes.post('/', async (c) => {
  const { name } = await c.req.json();
  try {
    await addLocation(name);
    return c.json({ message: 'Data added successfully' });
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

export default equipmentRoutes;
