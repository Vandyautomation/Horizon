import { Hono } from 'hono';

import { getProblem, getProblemGroup, getTodo } from '../controllers/problemMasterController';




const problemMasterDataRouter = new Hono();

problemMasterDataRouter.get('/problem-group', async (c) => {
  try {
    const name = c.req.query('name');
    const page = parseInt(c.req.query('page') || '1');

    const data = await getProblemGroup(name, page);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

problemMasterDataRouter.get('/problem', async (c) => {
  try {
    const name = c.req.query('name');
    const groupId = c.req.query('groupId');
    const page = parseInt(c.req.query('page') || '1');

    const data = await getProblem(name, groupId, page);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

problemMasterDataRouter.get('/todo', async (c) => {
  try {
    const name = c.req.query('name');
    const problemId = c.req.query('problemId');
    const page = parseInt(c.req.query('page') || '1');

    const data = await getTodo(name, problemId, page);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});



export default problemMasterDataRouter;
