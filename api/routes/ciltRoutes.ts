import { Hono } from 'hono'
import { completeCiltStatus, getCiltMonitoring, getCiltTrx, updateCiltStatus } from '../controllers/ciltMonitoring'

const ciltRoutes = new Hono()

ciltRoutes.get('/cilt-monitoring', async (c) => {
  try {
    const data = await getCiltMonitoring();
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});
ciltRoutes.post('/update-status', async (c) => {
  try {
    const body = await c.req.json();
    const { MchId, statusCILT, note, CILTLvl } = body;

    if (!MchId) {
      return c.json({ error: 'MchId is required' }, 400);
    }

    await updateCiltStatus(MchId, statusCILT, note, CILTLvl);
    
    return c.json({ 
      success: true, 
      message: `Status machine ${MchId} updated to ${statusCILT}` 
    });
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});
ciltRoutes.post('/complete-status', async (c) => {
  try {
    const { MchId } = await c.req.json();
    if (!MchId) return c.json({ error: 'MchId is required' }, 400);

    await completeCiltStatus(MchId);
    
    return c.json({ success: true, message: 'Maintenance completed and archived' });
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
}); 
ciltRoutes.get('/cilt-trx', async (c) => {
  try {
    const data = await getCiltTrx();
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});
export default ciltRoutes;