import { Hono } from 'hono';
import { createSubTask, deleteSubTask, getSubTask, updateSubTask } from '@/api/controllers/qco/subTaskController';


const subTaskRoutes = new Hono();

subTaskRoutes.get('/', async (c) => {
  try {
    const users = await getSubTask()
    return c.json({ success: true, message: 'Success fetch subtask data', data: users }, 200);
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
});

subTaskRoutes.post('/:id', async (c) => {
  try {
    const categoryId = c.req.param('id');
    const body = await c.req.json() as { name: string; index: number; role_id: number; standard_time: number; is_parallel: boolean; is_preparation: boolean };

    if (!body.name || !body.role_id || !body.standard_time || body.is_parallel === undefined || body.is_preparation === undefined) {
      const missingFields = [];
      if (!body.name) missingFields.push('name');
      if (!body.role_id || body.role_id < 0) missingFields.push('role_id');
      if (!body.standard_time) missingFields.push('standard_time');
      if (body.is_parallel === undefined) missingFields.push('is_parallel');
      if (body.is_preparation === undefined) missingFields.push('is_preparation');
      if (body.is_preparation && !body.index) missingFields.push('index');


      return c.json({
        success: false,
        message: `SubTask data is incomplete. Missing fields: ${missingFields.join(', ')}`
      }, 400);
    }

    const task = await createSubTask(body, Number(categoryId));
    return c.json({ success: true, message: 'SubTask created successfully', data: task }, 201);
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
});

subTaskRoutes.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    if (!id) {
      return c.json({ success: false, message: 'SubTask ID is required' }, 400);
    }
    const body = await c.req.json() as { name: string; index: number; role_id: number; standard_time: number; is_parallel: boolean; is_preparation: boolean };
    if (!body.name || !body.role_id || !body.standard_time || body.is_parallel === undefined || body.is_preparation === undefined) {
      const missingFields = [];
      if (!body.name) missingFields.push('name');
      if (!body.role_id || body.role_id < 0) missingFields.push('role_id');
      if (!body.standard_time) missingFields.push('standard_time');
      if (body.is_parallel === undefined) missingFields.push('is_parallel');
      if (body.is_preparation === undefined) missingFields.push('is_preparation');
      if (body.is_preparation && !body.index) missingFields.push('index');



      return c.json({
        success: false,
        message: `SubTask data is incomplete. Missing fields: ${missingFields.join(', ')}`
      }, 400);
    }
    const updatedTask = await updateSubTask(id, body);
    return c.json({ success: true, message: 'SubTask updated successfully', data: updatedTask }, 200);
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
});

subTaskRoutes.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await deleteSubTask(Number(id));
    return c.json({ success: true, message: 'SubTask deleted successfully' }, 200);
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
});

export default subTaskRoutes;
