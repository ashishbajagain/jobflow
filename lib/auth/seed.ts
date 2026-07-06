import { getDb } from '../db';
import { DEFAULT_USER } from './config';
import { hashPassword } from './password';
import { createUser, getUserByUsername } from './user-repository';
import { seedDatabase } from '../db';

const DEFAULT_PASSWORD = process.env.DEFAULT_USER_PASSWORD || 'JobFlow@Ashish2026';

export async function seedDefaultUser(): Promise<number> {
  const existing = getUserByUsername(DEFAULT_USER.username);
  if (existing) {
    return existing.id;
  }

  const passwordHash = await hashPassword(DEFAULT_PASSWORD);
  const user = createUser({
    username: DEFAULT_USER.username,
    email: DEFAULT_USER.email,
    passwordHash,
    displayName: DEFAULT_USER.displayName,
  });

  return user.id;
}

export function assignOrphanApplicationsToUser(userId: number): void {
  const db = getDb();
  db.prepare('UPDATE applications SET user_id = ? WHERE user_id IS NULL').run(userId);
}

export async function initializeAuthAndSeed(): Promise<void> {
  const userId = await seedDefaultUser();
  assignOrphanApplicationsToUser(userId);

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
