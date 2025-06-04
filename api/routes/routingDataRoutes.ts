import { Hono } from 'hono';

import { getCoois, getRouting } from '../controllers/countboardController';




const routingDataRouter = new Hono();

routingDataRouter.get('/', async (c) => {
  try {
    const materialId = c.req.query('materialId');
    const uploadedAt = c.req.query('uploadedAt') || null;
    const page = parseInt(c.req.query('page') || '1');

    const data = await getRouting(materialId, uploadedAt, page);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});


export default routingDataRouter;
