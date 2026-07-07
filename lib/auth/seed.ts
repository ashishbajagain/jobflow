import { getDb } from '../db';
import { DEFAULT_USER } from './config';
import { createUser, emailExists, getUserByUsername, updateUserEmail } from './user-repository';
import { seedDatabase } from '../db';

export async function seedDefaultUser(): Promise<number | null> {
  const existing = getUserByUsername(DEFAULT_USER.username);
  if (existing) {
    if (existing.email !== DEFAULT_USER.email && !emailExists(DEFAULT_USER.email)) {
      updateUserEmail(existing.id, DEFAULT_USER.email);
    }
    return existing.id;
  }

  return null;
}

export function assignOrphanApplicationsToUser(userId: number): void {
  const db = getDb();
  db.prepare('UPDATE applications SET user_id = ? WHERE user_id IS NULL').run(userId);
}

export async function ensureDefaultUser(): Promise<number | null> {
  const userId = await seedDefaultUser();
  if (userId !== null) {
    assignOrphanApplicationsToUser(userId);
  }
  return userId;
}

export function ensureUserApplicationsSeeded(userId: number): void {
  const db = getDb();
  const count = (
    db.prepare('SELECT COUNT(*) as count FROM applications WHERE user_id = ?').get(userId) as {
      count: number;
    }
  ).count;

  if (count === 0) {
    seedDatabase(false, userId);
  }
}

/** @deprecated Use ensureDefaultUser + ensureUserApplicationsSeeded */
export async function initializeAuthAndSeed(): Promise<void> {
  const userId = await ensureDefaultUser();
  if (userId !== null) {
    ensureUserApplicationsSeeded(userId);
  }
}

export async function createSeedUser(input: {
  username: string;
  email: string;
  displayName: string;
  passwordHash: string;
}): Promise<number> {
  try {
    const user = createUser({
      username: input.username,
      email: input.email,
      passwordHash: input.passwordHash,
      displayName: input.displayName,
    });
    return user.id;
  } catch (error) {
    const retry = getUserByUsername(input.username);
    if (retry) return retry.id;
    throw error;
  }
}
