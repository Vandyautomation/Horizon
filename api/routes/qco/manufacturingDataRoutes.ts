import { Hono } from 'hono';
import { getTasks } from '@/api/controllers/qco/taskController';
import { getManufacturingData } from '@/api/controllers/qco/manufacturingDataController';


const manufacturingDataRoutes = new Hono();

manufacturingDataRoutes.get('/', async (c) => {
  try {
    const date = c.req.query('date');
    // const data = await getManufacturingData();
    const data = await fetch(`https://login.dzuliot.my.id/api/manufacturing-data?date=${date}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${c.req.header('Authorization')}`,
        'Access-Control-Allow-Origin': '*',
      }
    }).then(res => res.json());
    // console.log(data)
    return c.json(data);
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
});

export default manufacturingDataRoutes;
