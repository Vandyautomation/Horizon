import { Context } from 'hono';
import { getAuthToken } from '../utils/cookieUtils';
import { verify, decode } from 'hono/jwt';

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
    const verified = await verify(token, secret);
    const decoded = await decode(token);

    c.set('user', verified);
    c.set('jwtPayload', decoded);
    return next();
  } catch {
    return c.json({ success: false, message: 'Invalid or expired token' }, 401);
  }
}

