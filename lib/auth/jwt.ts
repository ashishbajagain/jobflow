import { SignJWT, jwtVerify } from 'jose';
import { AUTH_CONFIG } from './config';

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET environment variable is required in production');
  }
  return new TextEncoder().encode(secret || 'jobflow-dev-secret-change-in-production');
}

export interface SessionTokenPayload {
  sessionId: string;
  userId: number;
}

export async function signSessionToken(payload: SessionTokenPayload, expiresAt: string): Promise<string> {
  return new SignJWT({ sid: payload.sessionId })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(payload.userId))
    .setExpirationTime(new Date(expiresAt))
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<SessionTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const sessionId = payload.sid;
    const userId = payload.sub;
    if (typeof sessionId !== 'string' || !userId) return null;
    return { sessionId, userId: Number(userId) };
  } catch {
    return null;
  }
}

export { AUTH_CONFIG };
