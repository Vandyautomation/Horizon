import { Hono } from 'hono';

import { getCoois, getRouting } from '../controllers/countboardController';
import { createRouting } from "../controllers/routingController"



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

routingDataRouter.post("/", async (c) => {
  try {
    const body = await c.req.json()

    const result = await createRouting(body)

    return c.json(result, 201)
  } catch (error) {
    return c.json(
      { error: (error as Error).message },
      400
    )
  }
})
export default routingDataRouter;
