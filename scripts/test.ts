/**
 * Integration tests for the Job Application Tracker API.
 * Run: npm test
 */

import {
  getDb,
  resetDatabase,
  seedDatabase,
  getAllApplications,
  getApplicationById,
  createApplication,
  updateApplication,
  updateApplicationStatus,
  deleteApplication,
  getApplicationStats,
} from '../lib/db';
import { initializeAuthAndSeed } from '../lib/auth/seed';
import { getUserByUsername } from '../lib/auth/user-repository';

let passed = 0;
let failed = 0;
let userId = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ ${message}`);
  }
}

function test(name: string, fn: () => void) {
  console.log(`\n${name}`);
  try {
    fn();
  } catch (err) {
    failed++;
    console.error(`  ✗ Threw: ${(err as Error).message}`);
  }
}

async function setup() {
  process.env.AUTH_SECRET = process.env.AUTH_SECRET || 'test-secret-key-for-integration-tests';
  await initializeAuthAndSeed();
  const user = getUserByUsername('ashish');
  if (!user) throw new Error('Default user not found');
  userId = user.id;
  resetDatabase(userId);
  seedDatabase(true, userId);
}

console.log('=== Job Application Tracker — Integration Tests ===\n');

async function run() {
  await setup();

  test('Database seeding', () => {
  const apps = getAllApplications({ userId });
  assert(apps.length === 16, `Seeded 16 applications (got ${apps.length})`);
});

test('Get all applications with filters', () => {
  const frontend = getAllApplications({ userId, role_type: 'Frontend' });
  assert(frontend.length >= 2, `Frontend filter returns results (${frontend.length})`);

  const linkedin = getAllApplications({ userId, source: 'LinkedIn' });
  assert(linkedin.length >= 5, `LinkedIn source filter (${linkedin.length})`);

  const search = getAllApplications({ userId, search: 'WordPress' });
  assert(search.length >= 3, `WordPress search (${search.length})`);
});

test('Get application by ID with timeline', () => {
  const apps = getAllApplications({ userId });
  const app = getApplicationById(apps[0].id, userId);
  assert(app !== null, 'Application found by ID');
  assert(Array.isArray(app!.timeline), 'Timeline is array');
  assert(app!.timeline.length >= 1, 'Timeline has at least 1 entry');
});

test('Create application', () => {
  const created = createApplication(
    {
      company: 'Test Corp',
      position: 'Test Developer',
      date_applied: '2026-06-20',
      status: 'Applied',
      role_type: 'Full Stack',
      source: 'LinkedIn',
    },
    userId
  );
  assert(created.id > 0, 'Created application has ID');
  assert(created.company === 'Test Corp', 'Company matches');
  assert(created.needs_follow_up === false, 'No follow-up flag by default');
});

test('Update application status', () => {
  const created = createApplication(
    {
      company: 'Update Test',
      position: 'Dev',
      date_applied: '2026-06-01',
      status: 'Applied',
    },
    userId
  );
  const updated = updateApplicationStatus(created.id, 'Interview', 'Moved to interview', userId);
  assert(updated!.status === 'Interview', 'Status updated to Interview');

  const withTimeline = getApplicationById(created.id, userId);
  assert(withTimeline!.timeline.length >= 2, 'Timeline has status change entries');
});

test('Update application fields', () => {
  const apps = getAllApplications({ userId, search: 'Test Corp' });
  const updated = updateApplication(
    apps[0].id,
    {
      salary_min: 100000,
      salary_max: 130000,
      location: 'Melbourne, VIC',
      follow_up_date: '2026-07-20',
    },
    userId
  );
  assert(updated!.salary_min === 100000, 'Salary min updated');
  assert(updated!.location === 'Melbourne, VIC', 'Location updated');
});

test('Delete application', () => {
  const created = createApplication(
    {
      company: 'Delete Me',
      position: 'Temp',
      date_applied: '2026-06-01',
      status: 'Applied',
    },
    userId
  );
  const deleted = deleteApplication(created.id, userId);
  assert(deleted === true, 'Delete returns true');
  assert(getApplicationById(created.id, userId) === null, 'Application no longer exists');
});

test('Application stats', () => {
  const stats = getApplicationStats(userId);
  assert(stats.total > 0, `Total > 0 (${stats.total})`);
  assert(typeof stats.responseRate === 'number', 'Response rate is number');
  assert(typeof stats.interviewRate === 'number', 'Interview rate is number');
  assert(Array.isArray(stats.followUpsDue), 'Follow-ups due is array');
  assert(Array.isArray(stats.staleApplications), 'Stale applications is array');
});

test('Enrichment flags', () => {
  const stale = getAllApplications({ userId }).filter((a) => a.is_stale);
  assert(stale.length >= 1, `At least 1 stale application (${stale.length})`);

  const followUp = getAllApplications({ userId, needs_follow_up: true });
  assert(followUp.length >= 1, `At least 1 follow-up due (${followUp.length})`);
});

test('Sort and order', () => {
  const asc = getAllApplications({ userId, sortBy: 'company', sortOrder: 'asc' });
  const desc = getAllApplications({ userId, sortBy: 'company', sortOrder: 'desc' });
  assert(asc[0].company <= asc[asc.length - 1].company, 'Ascending sort works');
  assert(desc[0].company >= desc[desc.length - 1].company, 'Descending sort works');
});

test('User data isolation', () => {
  const db = getDb();
  const otherUser = db
    .prepare(
      `INSERT INTO users (username, email, password_hash, created_at, updated_at)
       VALUES ('otheruser', 'other@test.com', 'hash', datetime('now'), datetime('now'))`
    )
    .run();
  const otherUserId = otherUser.lastInsertRowid as number;

  createApplication(
    {
      company: 'Other User Corp',
      position: 'Private Role',
      date_applied: '2026-06-01',
      status: 'Applied',
    },
    otherUserId
  );

  const ashishApps = getAllApplications({ userId, search: 'Other User Corp' });
  assert(ashishApps.length === 0, 'Applications are isolated per user');
  });

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) process.exit(1);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
