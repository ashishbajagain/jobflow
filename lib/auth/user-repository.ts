import type Database from 'better-sqlite3';
import { getDb } from '../db';
import type { User } from './types';

function rowToUser(row: Record<string, unknown>): User {
  return {
    id: row.id as number,
    username: row.username as string,
    email: row.email as string,
    display_name: (row.display_name as string) ?? null,
    failed_login_attempts: row.failed_login_attempts as number,
    locked_until: (row.locked_until as string) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export function getUserWithPasswordById(id: number): (User & { password_hash: string }) | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!row) return null;
  return { ...rowToUser(row), password_hash: row.password_hash as string };
}

export function getUserById(id: number): User | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  return row ? rowToUser(row) : null;
}

export function getUserByUsername(username: string): User | null {
  const db = getDb();
  const row = db
    .prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE')
    .get(username.trim()) as Record<string, unknown> | undefined;
  return row ? rowToUser(row) : null;
}

export function getUserByEmail(email: string): User | null {
  const db = getDb();
  const row = db
    .prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE')
    .get(email.trim().toLowerCase()) as Record<string, unknown> | undefined;
  return row ? rowToUser(row) : null;
}

export function getUserWithPasswordByUsername(username: string): (User & { password_hash: string }) | null {
  const db = getDb();
  const row = db
    .prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE')
    .get(username.trim()) as Record<string, unknown> | undefined;
  if (!row) return null;
  return { ...rowToUser(row), password_hash: row.password_hash as string };
}

export function getUserWithPasswordByEmail(email: string): (User & { password_hash: string }) | null {
  const db = getDb();
  const row = db
    .prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE')
    .get(email.trim().toLowerCase()) as Record<string, unknown> | undefined;
  if (!row) return null;
  return { ...rowToUser(row), password_hash: row.password_hash as string };
}

export function createUser(input: {
  username: string;
  email: string;
  passwordHash: string;
  displayName?: string | null;
}): User {
  const db = getDb();
  const now = new Date().toISOString();
  const result = db
    .prepare(
      `INSERT INTO users (username, email, password_hash, display_name, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      input.username.trim().toLowerCase(),
      input.email.trim().toLowerCase(),
      input.passwordHash,
      input.displayName?.trim() || null,
      now,
      now
    );
  return getUserById(result.lastInsertRowid as number)!;
}

export function updateUserPassword(userId: number, passwordHash: string): void {
  const db = getDb();
  db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(
    passwordHash,
    new Date().toISOString(),
    userId
  );
}

export function updateUserEmail(userId: number, email: string): void {
  const db = getDb();
  db.prepare('UPDATE users SET email = ?, updated_at = ? WHERE id = ?').run(
    email.trim().toLowerCase(),
    new Date().toISOString(),
    userId
  );
}

export function recordFailedLogin(userId: number, failedAttempts: number, lockedUntil: string | null): void {
  const db = getDb();
  db.prepare(
    'UPDATE users SET failed_login_attempts = ?, locked_until = ?, updated_at = ? WHERE id = ?'
  ).run(failedAttempts, lockedUntil, new Date().toISOString(), userId);
}

export function resetFailedLogin(userId: number): void {
  const db = getDb();
  db.prepare(
    'UPDATE users SET failed_login_attempts = 0, locked_until = NULL, updated_at = ? WHERE id = ?'
  ).run(new Date().toISOString(), userId);
}

export function usernameExists(username: string): boolean {
  return getUserByUsername(username) !== null;
}

export function emailExists(email: string): boolean {
  return getUserByEmail(email) !== null;
}

export function getDefaultUserId(db: Database.Database): number | null {
  const row = db
    .prepare('SELECT id FROM users WHERE username = ? COLLATE NOCASE')
    .get('ashish') as { id: number } | undefined;
  return row?.id ?? null;
}
