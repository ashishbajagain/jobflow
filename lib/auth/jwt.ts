import { SignJWT, jwtVerify } from 'jose';
import { AUTH_CONFIG } from './config';

const DEV_FALLBACK_SECRET = 'jobflow-dev-secret-change-in-production';

function requireSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('AUTH_SECRET environment variable is required in production');
    }
    return new TextEncoder().encode(DEV_FALLBACK_SECRET);
  }
  return new TextEncoder().encode(secret);
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
    .sign(requireSecret());
}

export async function verifySessionToken(token: string): Promise<SessionTokenPayload | null> {
  try {
    // Fail closed in production when misconfigured (do not use the public dev fallback).
    if (!process.env.AUTH_SECRET && process.env.NODE_ENV === 'production') {
      return null;
    }
    const { payload } = await jwtVerify(token, requireSecret());
    const sessionId = payload.sid;
    const userId = payload.sub;
    if (typeof sessionId !== 'string' || !userId) return null;
    return { sessionId, userId: Number(userId) };
  } catch {
    return null;
  }
}

export { AUTH_CONFIG };
