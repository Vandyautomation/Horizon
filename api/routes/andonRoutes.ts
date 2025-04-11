import { Hono } from 'hono';
import { fetchUsers } from '../controllers/userController';
import { getBuildings } from '../controllers/andonController';

const andonRoutes = new Hono();

andonRoutes.get('/buildings/:type', async (c) => {
  try {
    const type = c.req.param('type');
    const result = await getBuildings(type);
    return c.json(result, 200);
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
});

export default andonRoutes;
