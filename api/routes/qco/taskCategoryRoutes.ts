import { createTaskCategory, deleteTaskCategory, getTaskCategories, getTaskCategoryById, updateTaskCategory } from '@/api/controllers/qco/taskCategoryController';
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
    const body = await c.req.json() as { name: string };

    // Call the createTask function with the extracted parameters
    const result = await createTaskCategory(body.name);
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
      return c.json({ success: false, message: 'Task category UUID is required' }, 400);
    }

    const body = await c.req.json();

    // This function needs to be implemented in your controller
    const updatedTask = await updateTaskCategory(id, body.name);

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
      return c.json({ success: false, message: 'Task Category ID is required' }, 400);
    }

    // This function needs to be implemented in your controller
    const result = await deleteTaskCategory(id);

    return c.json({
      success: true,
      message: 'Task category deleted successfully'
    }, 200);
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
});



export default taskCategoryRoutes;
