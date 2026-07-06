import { cookies } from 'next/headers';
import type { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from './jwt';
import { AUTH_CONFIG } from './config';
import { getSessionById, touchSession } from './session-repository';
import { getUserById } from './user-repository';
import { ensureDefaultUser } from './seed';
import type { AuthSession } from './types';

export function getSessionTokenFromRequest(request: NextRequest): string | null {
  return request.cookies.get(AUTH_CONFIG.sessionCookie)?.value ?? null;
}

export async function getSessionTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_CONFIG.sessionCookie)?.value ?? null;
}

export async function resolveAuthSession(token: string | null): Promise<AuthSession | null> {
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  let user = getUserById(payload.userId);
  if (!user) {
    await ensureDefaultUser();
    user = getUserById(payload.userId);
  }
  if (!user) return null;

  const session = getSessionById(payload.sessionId);
  if (session && session.user_id === payload.userId) {
    touchSession(session.id);
  }

  // Trust signed JWT when DB session is missing (e.g. ephemeral SQLite on serverless).
  return {
    userId: user.id,
    sessionId: payload.sessionId,
    username: user.username,
    email: user.email,
    displayName: user.display_name,
  };
}

export async function getAuthSession(request?: NextRequest): Promise<AuthSession | null> {
  const token = request
    ? getSessionTokenFromRequest(request)
    : await getSessionTokenFromCookies();
  return resolveAuthSession(token);
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
