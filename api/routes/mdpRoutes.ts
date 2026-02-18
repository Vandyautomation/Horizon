import { Hono } from 'hono';
import { getMdpHistory, getMdpPositions, getMdpSummary } from '../controllers/mdpController';

const mdpRoutes = new Hono();

mdpRoutes.get('/positions', async (c) => {
  try {
    const mdpId = Number(c.req.query('mdpId') || 1);
    const data = await getMdpPositions(mdpId);
    return c.json({ mdpId, data });
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

mdpRoutes.get('/history', async (c) => {
  try {
    const mdpId = Number(c.req.query('mdpId') || 1);
    const date = c.req.query('date') || new Date().toISOString().slice(0, 10);
    const intervalMinutes = Number(c.req.query('intervalMinutes') || 5);
    const shift = c.req.query('shift') || undefined;
    const data = await getMdpHistory({ mdpId, date, intervalMinutes, shift });
    return c.json({ mdpId, date, intervalMinutes, shift, data });
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

mdpRoutes.get('/summary', async (c) => {
  try {
    const mdpId = Number(c.req.query('mdpId') || 1);
    const date = c.req.query('date') || new Date().toISOString().slice(0, 10);
    const shift = c.req.query('shift') || undefined;
    const data = await getMdpSummary({ mdpId, date, shift });
    return c.json({ mdpId, date, shift, data });
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

export default mdpRoutes;
