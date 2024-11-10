import { Hono } from 'hono';
import { getData, addData } from '../controllers/dataController';

const dataRouter = new Hono();

dataRouter.get('/', async (c) => {
  try {
    const data = await getData();
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

dataRouter.post('/', async (c) => {
  const { name, age } = await c.req.json();
  try {
    await addData(name, age);
    return c.json({ message: 'Data added successfully' });
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

export default dataRouter;
