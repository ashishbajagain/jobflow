import { getDb } from '@/lib/db';
import { initializeAuthAndSeed } from '@/lib/auth/seed';
import { getUserByUsername } from '@/lib/auth/user-repository';
import { DEFAULT_USER } from '@/lib/auth/config';
import { resetDatabase, seedDatabase } from '@/lib/db';

function resolveSeedUser() {
  const preferred = getUserByUsername(DEFAULT_USER.username);
  if (preferred) return preferred;

  const db = getDb();
  const row = db.prepare('SELECT id, username FROM users ORDER BY id LIMIT 1').get() as
    | { id: number; username: string }
    | undefined;
  return row ? { id: row.id, username: row.username } : null;
}

async function main() {
  const force = process.argv.includes('--force');
  await initializeAuthAndSeed();
  const user = resolveSeedUser();
  if (!user) {
    throw new Error('No user found. Register an account first, then run npm run seed.');
  }

  if (force) resetDatabase(user.id);
  seedDatabase(force, user.id);
  console.log(`Database seeded for @${user.username}${force ? ' (forced)' : ''}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
