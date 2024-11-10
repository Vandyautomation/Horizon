import { pool } from '../config/database';
import { Context } from 'hono';
import { sign } from 'hono/jwt';
import { setAuthToken } from '../utils/cookieUtils';
import { queryDatabase } from '../utils/queryDatabase';

const secret = 'mySecretKey';

export async function loginHandler(c: Context) {
  try {
    const { username, password } = await c.req.json();
    if (!username || !password) {
      return c.json({ success: false, message: 'Username and password are required.' }, 400);
    }

    const connection = await pool;
    const result = await connection.request().input('username', username)
      .query(`SELECT id, username, firstname, lastname, password FROM [user] WHERE username = @username`);

    const user = result.recordset[0];
    if (!user) {
      return c.json({ success: false, message: 'Login failed, username not found.' }, 400);
    }

    const validPassword = await Bun.password.verify(password, user.password);
    if (!validPassword) {
      return c.json({ success: false, message: 'Login failed, wrong username or password.' }, 400);
    }

    const token = await sign({ username }, secret);
    setAuthToken(c, token);

    delete user.password;
    return c.json({ success: true, message: 'Login successful', data: { ...user, token } }, 200);
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
