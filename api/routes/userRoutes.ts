import { Hono } from 'hono';
import { fetchUsers } from '../controllers/userController';

const userRoutes = new Hono();

userRoutes.get('/', async (c) => {
  try {
    const users = await fetchUsers();
    return c.json({ success: true, message: 'Success fetch user data', data: users }, 200);
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
});

export default userRoutes;
