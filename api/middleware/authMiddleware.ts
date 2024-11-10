import { Context } from 'hono';
import { getAuthToken } from '../utils/cookieUtils';
import { verify } from 'hono/jwt';

const secret = 'mySecretKey';

export async function authMiddleware(c: Context<any, any, {}>, next: () => any) {
  const token = getAuthToken(c);
  if (!token) {
    return c.json({ success: false, message: 'Unauthorized' }, 401);
  }
  
  try {
    const decoded = await verify(token, secret);
    c.set('user', decoded.payload);
    return next();
  } catch {
    return c.json({ success: false, message: 'Invalid or expired token' }, 401);
  }
}
