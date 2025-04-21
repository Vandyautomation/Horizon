import { Hono } from 'hono';
import { loginHandler } from '../controllers/authController';
import { loginUser } from '../controllers/authControllerNew';
import { sign } from 'hono/jwt';
import { setAuthToken } from '../utils/cookieUtils';
import bcrypt from 'bcryptjs'

const authRoutes = new Hono();
const secret = process.env.JWT_SECRET;


// authRoutes.post('/login', loginHandler);
authRoutes.post('/login', async (c) => {
  try {
    const { username, password } = await c.req.json();
    if (!username || !password) {
      return c.json({ success: false, message: 'Username and password are required.' }, 400);
    }
    const result = await loginHandler(c);
    
    // console.log(result[0])

    const user = result[0];

    const validPassword = bcrypt.compareSync(password, user.UserHashedPassword);
    if (!validPassword) {
      return c.json({ success: false, message: 'Login failed, wrong username or password.' }, 400);
    }

    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }

    delete user.password;
    delete user.UserHashedPassword;

    const token = await sign({ user }, secret);
    const tokenNew = setAuthToken(c, token);
    // console.log(tokenNew)



    return c.json({ success: true, message: 'Login successful', data: { ...user, token } }, 200);

  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

export default authRoutes;
