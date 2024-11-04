// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET || 'mySecretKey';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('authToken')?.value;

  if (token) {
    try {
      jwt.verify(token, secret);
      return NextResponse.next();  // Allow access
    } catch {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
  matcher: ['/admin/:path*'],  // Protect the admin route
};
