import { Hono } from 'hono';
import { createTask, deleteTask, getTasks, getTasksByUuid, notifyTask, summary, updateTask } from '@/api/controllers/qco/taskController';

const taskRoutes = new Hono();

taskRoutes.get('/', async (c) => {
  try {
    const page = c.req.query('page') ? parseInt(c.req.query('page') || '1') : 1;
    const limit = c.req.query('limit') ? parseInt(c.req.query('limit') || '30') : 30;
    const start_at = c.req.query('start_at') ? c.req.query('start_at') : new Date().toISOString();
    const week_start_at = c.req.query('week_start_at') ? c.req.query('week_start_at') : undefined;


    const tasks = await getTasks(limit, page, start_at, week_start_at);
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
    process.stdout.write('=== Summary Endpoint Called ===\n');
    process.stdout.write('Query params: ' + JSON.stringify(c.req.query()) + '\n');
    const start_at = c.req.query('start_at') || new Date().toISOString();
    process.stdout.write("start_at value: " + start_at + '\n');
    process.stdout.write("start_at type: " + typeof start_at + '\n');

    const result = await summary(start_at);
    process.stdout.write("Summary result: " + JSON.stringify(result) + '\n');

    return c.json(result);
    // return c.text('hello', 200)
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
});

taskRoutes.post('/', async (c) => {
  try {
    // Extract query parameters
    // const body = {
    //   machine_id: c.req.query('machine_id'),
    //   category_id: c.req.query('category_id'),
    //   start_at: c.req.query('start_at'),
    //   pro: c.req.query('pro')
    // };
    const body = await c.req.json() as {
      machine_id: string;
      category_id: string;
      start_at: string;
      pro: string;
    }

    // Validate required fields
    if (!body.machine_id || !body.category_id || !body.start_at || !body.pro) {
      return c.json({ success: false, message: 'Missing required body' }, 400);
    }

    const newTask = await createTask(body);

    return c.json({ success: true, message: 'Task created successfully', data: newTask }, 201);
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
});

taskRoutes.put('/:id', async (c) => {
  try {
    const uuid = c.req.param('uuid');

    if (!uuid) {
      return c.json({ success: false, message: 'Task UUID is required' }, 400);
    }

    // Extract query parameters for update
    const updateData = {
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
    const updatedTask = await updateTask(uuid, filteredData);

    return c.json({
      success: true,
      message: 'Task updated successfully',
      data: { uuid, ...filteredData }
    }, 200);
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
});

taskRoutes.delete('/:uuid', async (c) => {
  try {
    const id = c.req.param('uuid');
    if (!id) {
      return c.json({ success: false, message: 'Task ID is required' }, 400);
    }


    const deletedTask = await deleteTask(id);

    if (!deletedTask) {
      return c.json({ success: false, message: 'Task not found' }, 404);
    }

    return c.json({ success: true, message: 'Task deleted successfully' }, 200);
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
      user_sub_task_id: c.req.query('user_sub_task_id'),
      notify_at: c.req.query('notify_at'),
      additional_time: c.req.query('additional_time'),
    };
    // console.log(body);

    // Validate required fields
    if (!body.notif_type || !body.role_id || !body.user_sub_task_id || !body.notify_at) {
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
