import { getDb } from '../db';
import { AUTH_CONFIG } from './config';
import { generateSecureToken, hashToken } from './crypto';
import type { SessionRecord } from './types';

function rowToSession(row: Record<string, unknown>): SessionRecord {
  return {
    id: row.id as string,
    user_id: row.user_id as number,
    token_hash: row.token_hash as string,
    expires_at: row.expires_at as string,
    created_at: row.created_at as string,
    last_seen_at: row.last_seen_at as string,
    ip_address: (row.ip_address as string) ?? null,
    user_agent: (row.user_agent as string) ?? null,
  };
}

export function createSession(input: {
  userId: number;
  ipAddress?: string | null;
  userAgent?: string | null;
}): { sessionId: string; expiresAt: string } {
  const db = getDb();
  const sessionId = generateSecureToken(16);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + AUTH_CONFIG.sessionMaxAgeSeconds * 1000).toISOString();

  db.prepare(
    `INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at, last_seen_at, ip_address, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    sessionId,
    input.userId,
    hashToken(sessionId),
    expiresAt,
    now.toISOString(),
    now.toISOString(),
    input.ipAddress ?? null,
    input.userAgent ?? null
  );

  return { sessionId, expiresAt };
}

export function getSessionById(sessionId: string): SessionRecord | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId) as
    | Record<string, unknown>
    | undefined;
  if (!row) return null;
  const session = rowToSession(row);
  if (new Date(session.expires_at) <= new Date()) {
    deleteSession(session.id);
    return null;
  }
  return session;
}

export function getSessionByToken(token: string): SessionRecord | null {
  const db = getDb();
  const row = db
    .prepare('SELECT * FROM sessions WHERE token_hash = ?')
    .get(hashToken(token)) as Record<string, unknown> | undefined;
  if (!row) return null;
  const session = rowToSession(row);
  if (new Date(session.expires_at) <= new Date()) {
    deleteSession(session.id);
    return null;
  }
  return session;
}

export function touchSession(sessionId: string): void {
  const db = getDb();
  db.prepare('UPDATE sessions SET last_seen_at = ? WHERE id = ?').run(new Date().toISOString(), sessionId);
}

export function deleteSession(sessionId: string): void {
  const db = getDb();
  db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
}

export function deleteSessionByToken(token: string): void {
  const db = getDb();
  db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token));
}

export function deleteAllUserSessions(userId: number): void {
  const db = getDb();
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
}

export function purgeExpiredSessions(): void {
  const db = getDb();
  db.prepare("DELETE FROM sessions WHERE expires_at <= datetime('now')").run();
}
