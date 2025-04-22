import { Hono } from 'hono';
import { getRoles } from '@/api/controllers/qco/roleController';

const roleRoutes = new Hono();

roleRoutes.get('/', async (c) => {
  try {
    const users = await getRoles();
    return c.json({ success: true, message: 'Successfully fetched user data', data: users }, 200);
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
});

export default roleRoutes;
