import { Hono } from 'hono';

import { getParameterSetting } from '../controllers/parameterSettingController';




const parameterSettingDataRouter = new Hono();

parameterSettingDataRouter.get('/', async (c) => {
  try {
    const name = c.req.query('name');
    const page = parseInt(c.req.query('page') || '1');

    const data = await getParameterSetting(name, page);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});


export default parameterSettingDataRouter;
