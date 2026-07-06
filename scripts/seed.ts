import { initializeAuthAndSeed } from '@/lib/auth/seed';
import { getUserByUsername } from '@/lib/auth/user-repository';
import { resetDatabase, seedDatabase } from '@/lib/db';

async function main() {
  const force = process.argv.includes('--force');
  await initializeAuthAndSeed();
  const user = getUserByUsername('ashish');
  if (!user) throw new Error('Default user not found');

  if (force) resetDatabase(user.id);
  seedDatabase(force, user.id);
  console.log(`Database seeded for @${user.username}${force ? ' (forced)' : ''}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
