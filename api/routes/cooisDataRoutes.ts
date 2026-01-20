import { Hono } from 'hono';

import { getCoois, getCooisComplete } from '../controllers/countboardController';
import { createCoois } from "../controllers/cooisController"




const cooisDataRouter = new Hono();

cooisDataRouter.get('/', async (c) => {
  try {
    const poName = c.req.query('poName');
    const uploadedAt = c.req.query('uploadedAt') || null;
    const page = parseInt(c.req.query('page') || '1');
    const data = await getCooisComplete(poName, uploadedAt, page);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});
cooisDataRouter.post("/", async (c) => {
  try {
    const body = await c.req.json()

    const result = await createCoois(body)

    return c.json(result, 201)
  } catch (error) {
    return c.json(
      { error: (error as Error).message },
      400
    )
  }
})

export default cooisDataRouter;
