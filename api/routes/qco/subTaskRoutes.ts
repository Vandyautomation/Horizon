import { Hono } from 'hono';
import { getTasks } from '@/api/controllers/qco/taskController';

const subTaskRoutes = new Hono();

subTaskRoutes.get('/', async (c) => {
  try {
    const users = await getTasks();
    return c.json({ success: true, message: 'Success fetch user data', data: users }, 200);
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
});

export default subTaskRoutes;
