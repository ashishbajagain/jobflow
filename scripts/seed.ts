import { resetDatabase, seedDatabase } from '@/lib/db';

const force = process.argv.includes('--force');
if (force) resetDatabase();
seedDatabase(force);
console.log(`Database seeded with ${force ? '16' : 'sample'} applications.`);
