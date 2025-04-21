import { deleteTaskCategory, getTaskCategories, getTaskCategoryById, updateTaskCategory } from '@/api/controllers/qco/taskCategoryController';
import { createTask } from '@/api/controllers/qco/taskController';
import { Hono } from 'hono';


const taskCategoryRoutes = new Hono();

taskCategoryRoutes.get('/', async (c) => {
  try {
    const users = await getTaskCategories();
    return c.json({ success: true, message: 'Success fetch task category data', data: users }, 200);
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
});

taskCategoryRoutes.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');

    if (!id) {
      return c.json({ success: false, message: 'Task ID is required' }, 400);
    }

    const task = await getTaskCategoryById(id);

    if (!task) {
      return c.json({ success: false, message: 'Task not found' }, 404);
    }

    return c.json(task, 200);
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
});
taskCategoryRoutes.post('/', async (c) => {
  try {
    // Extract query parameters
    const body = {
      machine_id: c.req.query('machine_id'),
      category_id: c.req.query('category_id'),
      start_at: c.req.query('start_at'),
      pro: c.req.query('pro')
    };
    // Call the createTask function with the extracted parameters
    const result = await createTask(body);
    // For now returning a simple success response
    return c.json({
      success: true,
      message: 'Task created successfully',
      data: result
    }, 200);
  } catch (error) {
    return c.json({
      success: false,
      message: (error as Error).message
    }, 500);
  }
});

taskCategoryRoutes.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');

    if (!id) {
      return c.json({ success: false, message: 'Task ID is required' }, 400);
    }

    const body = await c.req.json();
    const description = body.description;

    // This function needs to be implemented in your controller
    const updatedTask = await updateTaskCategory(id, body.name, description);

    if (!updatedTask) {
      return c.json({ success: false, message: 'Task not found' }, 404);
    }

    return c.json({
      success: true,
      message: 'Task category updated successfully',
      data: updatedTask
    }, 200);
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
});

taskCategoryRoutes.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');

    if (!id) {
      return c.json({ success: false, message: 'Task ID is required' }, 400);
    }

    // This function needs to be implemented in your controller
    const result = await deleteTaskCategory(id);

    if (!result) {
      return c.json({ success: false, message: 'Task not found' }, 404);
    }

    return c.json({
      success: true,
      message: 'Task category deleted successfully'
    }, 200);
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
});



export default taskCategoryRoutes;
