import { Hono } from 'hono';
import { createTask, getTasks, getTasksByUuid, notifyTask, summary, updateTask } from '@/api/controllers/qco/taskController';

const taskRoutes = new Hono();

taskRoutes.get('/', async (c) => {
  try {
    const limit = c.req.query('limit') ? parseInt(c.req.query('limit') || '10') : 10;
    const offset = c.req.query('offset') ? parseInt(c.req.query('offset') || '0') : 0;
    const start_at = c.req.query('start_at') ? c.req.query('start_at') || '' : new Date().toISOString();


    const tasks = await getTasks(limit, offset, start_at);
    return c.json(tasks, 200);
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
});

taskRoutes.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');

    if (!id) {
      return c.json({ success: false, message: 'Task ID is required' }, 400);
    }

    const task = await getTasksByUuid(id);

    if (!task) {
      return c.json({ success: false, message: 'Task not found' }, 404);
    }

    return c.json(task, 200);
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
});

taskRoutes.get('/summary', async (c) => {
  try {
    const start_at = c.req.query('start_at') ? c.req.query('start_at') || '' : new Date().toISOString();


    const tasks = await summary(start_at);
    return c.json(tasks, 200);
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
});

taskRoutes.post('/', async (c) => {
  try {
    // Extract query parameters
    const body = {
      mold_id: c.req.query('mold_id'),
      item_id: c.req.query('item_id'),
      machine_id: c.req.query('machine_id'),
      category_id: c.req.query('category_id'),
      start_at: c.req.query('start_at'),
      pro: c.req.query('pro')
    };

    // Validate required fields
    if (!body.mold_id || !body.item_id || !body.machine_id || !body.category_id) {
      return c.json({ success: false, message: 'Missing required parameters' }, 400);
    }

    // TODO: Implement createTask function in your controller
    const newTask = await createTask(body);

    return c.json({ success: true, message: 'Task created successfully', data: body }, 201);
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
});

taskRoutes.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');

    if (!id) {
      return c.json({ success: false, message: 'Task ID is required' }, 400);
    }

    // Extract query parameters for update
    const updateData = {
      mold_id: c.req.query('mold_id'),
      item_id: c.req.query('item_id'),
      machine_id: c.req.query('machine_id'),
      category_id: c.req.query('category_id'),
      start_at: c.req.query('start_at'),
      pro: c.req.query('pro')
    };

    // Filter out undefined values
    const filteredData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    if (Object.keys(filteredData).length === 0) {
      return c.json({ success: false, message: 'No update data provided' }, 400);
    }

    // TODO: Implement updateTask function in your controller
    const updatedTask = await updateTask(id, filteredData);

    return c.json({
      success: true,
      message: 'Task updated successfully',
      data: { id, ...filteredData }
    }, 200);
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
});


taskRoutes.post('/notify', async (c) => {
  try {
    // Extract query parameters
    const body = {
      notif_type: c.req.query('notif_type'),
      role_id: c.req.query('role_id'),
      user_sub_tasks_id: c.req.query('user_sub_tasks_id'),
      notify_at: c.req.query('notify_at'),
      additional_time: c.req.query('additional_time'),
    };

    // Validate required fields
    if (!body.notif_type || !body.role_id || !body.user_sub_tasks_id || !body.notify_at) {
      return c.json({ success: false, message: 'Missing required parameters' }, 400);
    }

    // TODO: Implement createTask function in your controller
    const newTask = await notifyTask(body);

    return c.json({ success: true, message: 'Task created successfully', data: body }, 201);
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
});

export default taskRoutes;
