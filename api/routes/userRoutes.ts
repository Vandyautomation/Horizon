import { Hono } from 'hono';
import { createUser, deleteUser, fetchUserById, fetchUserByNik, fetchUserByUsername, fetchUsers, updateUser } from '../controllers/userController';
import { getAuthToken } from '../utils/cookieUtils';
import { authMiddleware } from '../middleware/authMiddleware';

const userRoutes = new Hono();

userRoutes.get('/', async (c) => {
  try {
    const users = await fetchUsers();
    return c.json({ success: true, message: 'Success fetch user data', data: users }, 200);
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
});

userRoutes.get('/check', authMiddleware, async (c) => {
  try {
    const user = await c.get('jwtPayload') as any;
    // console.log(user);
    return c.json({ success: true, message: 'Success fetch user data', data: user }, 200);
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
    const body = await c.req.json() as {
      UserGroup: string;
      UserLoc: string;
      UserRFID: string;
      role_id: number;
      UserName: string;
      password: string;
      UserUAP: string;
      UserDept: string;
    }

    if (!body.UserName || !body.password || !body.UserRFID || !body.role_id) {
      return c.json({ success: false, message: 'UserName, password, UserRFID, and role_id are required' }, 400);
    }

    const existingUser = await fetchUserByUsername(body.UserName);

    if (existingUser.length > 0) {
      return c.json({ success: false, message: 'User already exists' }, 400);
    }

    const existingUser2 = await fetchUserByNik(body.UserRFID);

    if (existingUser2.length > 0) {
      return c.json({ success: false, message: 'User already exists with this NIK' }, 400);
    }
    const result = await createUser(body.UserName, body.password, body.UserRFID, body.role_id, body.UserGroup, body.UserLoc, body.UserUAP, body.UserDept);
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
    const body = await c.req.json() as {
      UserRFID: string;
      role_id: number;
      UserName: string;
      UserGroup: string;
      UserLoc: string;
      UserDept: string;
      UserUAP: string;
    };

    const result = await updateUser(id, body.UserName, body.UserRFID, body.role_id, body.UserGroup, body.UserLoc, body.UserDept, body.UserUAP);
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

    // Cek apakah ada row yang terupdate
    if (!result || result.rowsAffected[0] === 0) {
      return c.json({ success: false, message: 'User already deleted' }, 404);
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
