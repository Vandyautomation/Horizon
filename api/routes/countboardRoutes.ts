import { Hono } from 'hono';
import { addCoois, addRouting, attachPo, editTopScrap, getCoois, getRejectLists, updateComment, updateCVT } from '../controllers/countboardController';

const countboardRoutes = new Hono();


countboardRoutes.get('/rejects', async (c) => {


  try {
    const data = await getRejectLists();
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

countboardRoutes.get('/coois', async (c) => {
  const poName = c.req.query('poName');

  try {
    const data = await getCoois(poName);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

countboardRoutes.put('/topscrap', async (c) => {
  const data  = await c.req.json() as ({hourlyId : number, reject_a : number, reject_b : number, reject_c : number, reject_d : number});

  try {
    const res = await editTopScrap(data.hourlyId, data.reject_a, data.reject_b, data.reject_c, data.reject_d);
    return c.json(res);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

countboardRoutes.post('/coois', async (c) => {
  const data  = await c.req.json();
  console.log(data)
  try {
    const res = await addCoois(data);
    return c.json(res);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

countboardRoutes.post('/routing', async (c) => {
  const data  = await c.req.json();
  console.log(data)
  try {
    const res = await addRouting(data);
    return c.json(res);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

countboardRoutes.post('/task', async (c) => {
  const { poNumber, machineName } = await c.req.json();
  try {
    await attachPo(poNumber, machineName);
    return c.json({ message: 'PO attached successfully' });
  } catch (error) {
    console.error("Error attaching PO:", error);
    return c.json({ error: (error as Error).message }, 500);
  }
});

countboardRoutes.put('/cvt', async (c) => {
  const { taskId, newCvt } = await c.req.json();
  try {
    await updateCVT(taskId, newCvt);
    return c.json({ message: 'CVT updated successfully' });
  } catch (error) {
    console.error("Error updating CVT:", error);
    return c.json({ error: (error as Error).message }, 500);
  }
});

countboardRoutes.put('/comment', async (c) => {
  const { hourlyId, type, content } = await c.req.json();
  try {
    await updateComment(hourlyId, type, content);
    return c.json({ message: 'Content updated successfully' });
  } catch (error) {
    console.error("Error updating content:", error);
    return c.json({ error: (error as Error).message }, 500);
  }
});



export default countboardRoutes;
