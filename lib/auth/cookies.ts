import type { NextRequest, NextResponse } from 'next/server';
import { AUTH_CONFIG } from './config';

export function getSessionTokenFromRequest(request: NextRequest): string | null {
  return request.cookies.get(AUTH_CONFIG.sessionCookie)?.value ?? null;
}

export function setSessionCookie(response: NextResponse, token: string, expiresAt: string): void {
  response.cookies.set({
    name: AUTH_CONFIG.sessionCookie,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(expiresAt),
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: AUTH_CONFIG.sessionCookie,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
