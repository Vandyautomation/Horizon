import { Hono } from 'hono';
import { getTasks, summary } from '@/api/controllers/qco/taskController';

const taskRoutes = new Hono();

taskRoutes.get('/', async (c) => {
  try {
    const limit = c.req.query('limit') ? parseInt(c.req.query('limit') || '10') : 10;
    const offset = c.req.query('offset') ? parseInt(c.req.query('offset') || '0') : 0;

    const tasks = await getTasks(limit, offset);
    return c.json(tasks, 200);
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
});

taskRoutes.get('/summary', async (c) => {
  try {
    const start_at = c.req.query('start_at') ? c.req.query('start_at') || '' : new Date().toISOString();


    const tasks = await summary(start_at);
    return c.json(tasks, 200);
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
});

export default taskRoutes;
