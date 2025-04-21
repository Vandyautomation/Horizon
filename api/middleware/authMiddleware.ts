import { Context } from 'hono';
import { getAuthToken } from '../utils/cookieUtils';
import { verify } from 'hono/jwt';

const secret = process.env.JWT_SECRET 


export async function authMiddleware(c: Context<any, any, {}>, next: () => any) {
  const token = getAuthToken(c);
  if (!token) {
    return c.json({ success: false, message: 'Unauthorized' }, 401);
  }
  
  try {
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }
    const decoded = await verify(token, secret);
    c.set('user', decoded);
    return next();
  } catch {
    return c.json({ success: false, message: 'Invalid or expired token' }, 401);
  }
}

