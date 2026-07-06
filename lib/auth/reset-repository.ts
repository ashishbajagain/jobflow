import { getDb } from '../db';
import { AUTH_CONFIG } from './config';
import { generateSecureToken, hashToken } from './crypto';

export function createPasswordResetToken(userId: number): string {
  const db = getDb();
  const token = generateSecureToken(32);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + AUTH_CONFIG.resetTokenMaxAgeMinutes * 60 * 1000).toISOString();

  db.prepare('DELETE FROM password_reset_tokens WHERE user_id = ? AND used_at IS NULL').run(userId);

  db.prepare(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, created_at)
     VALUES (?, ?, ?, ?)`
  ).run(userId, hashToken(token), expiresAt, now.toISOString());

  return token;
}

export function consumePasswordResetToken(token: string): number | null {
  const db = getDb();
  const row = db
    .prepare('SELECT * FROM password_reset_tokens WHERE token_hash = ? AND used_at IS NULL')
    .get(hashToken(token)) as Record<string, unknown> | undefined;

  if (!row) return null;

  if (new Date(row.expires_at as string) <= new Date()) {
    return null;
  }

  db.prepare('UPDATE password_reset_tokens SET used_at = ? WHERE id = ?').run(
    new Date().toISOString(),
    row.id as number
  );

  return row.user_id as number;
}

export function purgeExpiredResetTokens(): void {
  const db = getDb();
  db.prepare(
    "DELETE FROM password_reset_tokens WHERE expires_at <= datetime('now') OR used_at IS NOT NULL"
  ).run();
}
