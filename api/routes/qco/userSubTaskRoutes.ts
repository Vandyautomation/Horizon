import { Hono } from 'hono';
import { getTasks } from '@/api/controllers/qco/taskController';
import { authMiddleware } from '@/api/middleware/authMiddleware';
import { finishUserSubTask, startUserSubTask, updateUserSubTaskNote } from '@/api/controllers/qco/userSubTaskController';

const userSubTaskRoutes = new Hono();

userSubTaskRoutes.get('/', async (c) => {
  try {
    const users = await getTasks();
    return c.json({ success: true, message: 'Success fetch user data', data: users }, 200);
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
});

userSubTaskRoutes.post('/start', authMiddleware, async (c) => {
  try {
    const body = {
      uuid: c.req.query('uuid') || '',
    };
    const result = await startUserSubTask(c, body.uuid)

    // For now returning a simple success response
    return c.json({
      success: true,
      message: 'Task started successfully',
      data: body
    }, 200);
  } catch (error) {
    return c.json({
      success: false,
      message: (error as Error).message
    }, 500);
  }
});
userSubTaskRoutes.post('/end', authMiddleware, async (c) => {
  try {
    const body = {
      uuid: c.req.query('uuid') || '',
    };

    const result = await finishUserSubTask(c, body.uuid);

    return c.json({
      success: true,
      message: 'Task ended successfully',
      data: body
    }, 200);
  } catch (error) {
    return c.json({
      success: false,
      message: (error as Error).message
    }, 500);
  }
});

userSubTaskRoutes.post('/note/:id', authMiddleware, async (c) => {
  try {
    const body = {
      uuid: c.req.query('uuid') || '',
      note: c.req.query('note') || '',
    };

    const result = await updateUserSubTaskNote(c, body.uuid, body.note);

    return c.json({
      success: true,
      message: 'Note added successfully',
      data: body
    }, 200);
  } catch (error) {
    return c.json({
      success: false,
      message: (error as Error).message
    }, 500);
  }
});
export default userSubTaskRoutes;
