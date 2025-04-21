import { Hono } from 'hono';
import { createUser, deleteUser, fetchUserById, fetchUserByUsername, fetchUsers, updateUser } from '../controllers/userController';

const userRoutes = new Hono();

userRoutes.get('/', async (c) => {
  try {
    const users = await fetchUsers();
    return c.json({ success: true, message: 'Success fetch user data', data: users }, 200);
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
});

userRoutes.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    if (!id) {
      return c.json({ success: false, message: 'User ID is required' }, 400);
    }
    const user = await fetchUserById(id);
    if (!user) {
      return c.json({ success: false, message: 'User not found' }, 404);
    }
    return c.json(user, 200);
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
});
userRoutes.post('/', async (c) => {
  try {
    const body = {
      username: c.req.query('username'),
      password: c.req.query('password'),
      email: c.req.query('email'),
      role: c.req.query('role'),
    };
    if (!body.username || !body.password || !body.email || !body.role) {
      return c.json({ success: false, message: 'Username, password, email, and role are required' }, 400);
    }
    const existingUser = await fetchUserByUsername(body.username);
    if (existingUser) {
      return c.json({ success: false, message: 'User already exists' }, 400);
    }
    const result = await createUser(body.username, body.password, body.email, body.role);
    return c.json({
      success: true,
      message: 'User created successfully',
      data: result
    }, 200);
  } catch (error) {
    return c.json({
      success: false,
      message: (error as Error).message
    }, 500);
  }
});
userRoutes.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    if (!id) {
      return c.json({ success: false, message: 'User ID is required' }, 400);
    }
    const body = {
      username: c.req.query('username'),
      password: c.req.query('password'),
      email: c.req.query('email'),
      role: c.req.query('role'),
    };
    if (!body.username || !body.password || !body.email || !body.role) {
      return c.json({ success: false, message: 'Username, password, email, and role are required' }, 400);
    }
    const result = await updateUser(id, body.username, body.password, body.email, body.role);
    return c.json({
      success: true,
      message: 'User updated successfully',
      data: result
    }, 200);
  } catch (error) {
    return c.json({
      success: false,
      message: (error as Error).message
    }, 500);
  }
});
userRoutes.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    if (!id) {
      return c.json({ success: false, message: 'User ID is required' }, 400);
    }
    const result = await deleteUser(id);
    if (!result) {
      return c.json({ success: false, message: 'User not found' }, 404);
    }
    return c.json({
      success: true,
      message: 'User deleted successfully'
    }, 200);
  } catch (error) {
    return c.json({
      success: false,
      message: (error as Error).message
    }, 500);
  }
});

export default userRoutes;
