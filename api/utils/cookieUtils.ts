import { Context } from 'hono';
import { setCookie, getCookie, deleteCookie } from 'hono/cookie';

export function setAuthToken(c: Context, token: string) {
  setCookie(c, 'authToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });

  const tokenNew = getAuthToken(c);
  return tokenNew
}

export function getAuthToken(c: Context) {
  const authHeader = c.req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7); // Remove 'Bearer ' prefix
  }
  return getCookie(c, 'authToken');
}

export function clearAuthToken(c: Context) {
  deleteCookie(c, 'authToken');
}
