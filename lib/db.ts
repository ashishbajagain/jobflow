import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { differenceInDays, parseISO } from 'date-fns';
import { runMigrations } from './migrations';
import { SEED_APPLICATIONS } from './seed-data';
import {
  ACTIVE_STATUSES,
  APPLICATION_STATUSES,
  CLOSED_STATUSES,
  GHOST_THRESHOLD_DAYS,
  type ApplicationStatus,
} from './constants';
import type {
  Application,
  ApplicationFilters,
  ApplicationQuery,
  ApplicationWithTimeline,
  CreateApplicationInput,
  StatusChange,
  UpdateApplicationInput,
} from './types';

const DATA_DIR = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'applications.db');

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!db) {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    runMigrations(db);
  }
  return db;
}

function enrichApplication(app: Application): Application {
  const today = new Date();
  const appliedDate = parseISO(app.date_applied);
  const daysSince = differenceInDays(today, appliedDate);

  const needsFollowUp =
    !!app.follow_up_date &&
    parseISO(app.follow_up_date) <= today &&
    ACTIVE_STATUSES.includes(app.status);

  const isStale =
    app.status === 'Applied' &&
    daysSince >= GHOST_THRESHOLD_DAYS &&
    !app.last_contact_date;

  return {
    ...app,
    days_since_applied: daysSince,
    needs_follow_up: needsFollowUp,
    is_stale: isStale,
  };
}

function rowToApplication(row: Record<string, unknown>): Application {
  return enrichApplication({
    id: row.id as number,
    company: row.company as string,
    position: row.position as string,
    date_applied: row.date_applied as string,
    status: row.status as ApplicationStatus,
    job_url: (row.job_url as string) ?? null,
    notes: (row.notes as string) ?? null,
    source: (row.source as Application['source']) ?? null,
    location: (row.location as string) ?? null,
    work_type: (row.work_type as Application['work_type']) ?? null,
    role_type: (row.role_type as Application['role_type']) ?? null,
    salary_min: row.salary_min != null ? (row.salary_min as number) : null,
    salary_max: row.salary_max != null ? (row.salary_max as number) : null,
    follow_up_date: (row.follow_up_date as string) ?? null,
    last_contact_date: (row.last_contact_date as string) ?? null,
    priority: (row.priority as Application['priority']) ?? 'Medium',
    contact_name: (row.contact_name as string) ?? null,
    contact_email: (row.contact_email as string) ?? null,
    next_action: (row.next_action as string) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  });
}

function buildWhereClause(filters: ApplicationFilters): { clause: string; params: unknown[] } {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.userId != null) {
    conditions.push('user_id = ?');
    params.push(filters.userId);
  }
  if (filters.status) {
    conditions.push('status = ?');
    params.push(filters.status);
  }
  if (filters.role_type) {
    conditions.push('role_type = ?');
    params.push(filters.role_type);
  }
  if (filters.source) {
    conditions.push('source = ?');
    params.push(filters.source);
  }
  if (filters.work_type) {
    conditions.push('work_type = ?');
    params.push(filters.work_type);
  }
  if (filters.priority) {
    conditions.push('priority = ?');
    params.push(filters.priority);
  }
  if (filters.active_only) {
    const placeholders = ACTIVE_STATUSES.map(() => '?').join(', ');
    conditions.push(`status IN (${placeholders})`);
    params.push(...ACTIVE_STATUSES);
  }
  if (filters.needs_follow_up) {
    conditions.push("follow_up_date IS NOT NULL AND follow_up_date <= date('now')");
    const activePlaceholders = ACTIVE_STATUSES.map(() => '?').join(', ');
    conditions.push(`status IN (${activePlaceholders})`);
    params.push(...ACTIVE_STATUSES);
  }
  if (filters.search) {
    const term = `%${filters.search.trim()}%`;
    conditions.push('(company LIKE ? OR position LIKE ? OR notes LIKE ? OR location LIKE ?)');
    params.push(term, term, term, term);
  }

  const clause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { clause, params };
}

export function getApplicationsCount(filters: ApplicationFilters = {}): number {
  const database = getDb();
  const { clause, params } = buildWhereClause(filters);
  const row = database
    .prepare(`SELECT COUNT(*) as count FROM applications ${clause}`)
    .get(...params) as { count: number };
  return row.count;
}

export function getAllApplications(query: ApplicationQuery = {}): Application[] {
  const database = getDb();
  const {
    sortBy = 'date_applied',
    sortOrder = 'desc',
    limit,
    offset,
    ...filters
  } = query;

  const allowedSort = ['date_applied', 'company', 'status', 'follow_up_date', 'updated_at'];
  const column = allowedSort.includes(sortBy) ? sortBy : 'date_applied';
  const order = sortOrder === 'asc' ? 'ASC' : 'DESC';

  const { clause, params } = buildWhereClause(filters);
  let sql = `SELECT * FROM applications ${clause} ORDER BY ${column} ${order}`;

  if (limit) {
    sql += ` LIMIT ?`;
    params.push(limit);
  }
  if (offset) {
    sql += ` OFFSET ?`;
    params.push(offset);
  }

  const rows = database.prepare(sql).all(...params) as Record<string, unknown>[];
  return rows.map(rowToApplication);
}

export function getApplicationById(id: number, userId?: number): ApplicationWithTimeline | null {
  const database = getDb();
  const row = userId != null
    ? (database.prepare('SELECT * FROM applications WHERE id = ? AND user_id = ?').get(id, userId) as
        | Record<string, unknown>
        | undefined)
    : (database.prepare('SELECT * FROM applications WHERE id = ?').get(id) as
        | Record<string, unknown>
        | undefined);

  if (!row) return null;

  const timeline = database
    .prepare(
      'SELECT * FROM status_changes WHERE application_id = ? ORDER BY changed_at DESC'
    )
    .all(id) as StatusChange[];

  return { ...rowToApplication(row), timeline };
}

export function createApplication(input: CreateApplicationInput, userId: number): Application {
  const database = getDb();
  const now = new Date().toISOString();

  const result = database
    .prepare(`
      INSERT INTO applications (
        company, position, date_applied, status, job_url, notes,
        source, location, work_type, role_type, salary_min, salary_max,
        follow_up_date, last_contact_date, priority, contact_name, contact_email,
        next_action, user_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      input.company.trim(),
      input.position.trim(),
      input.date_applied,
      input.status,
      input.job_url?.trim() || null,
      input.notes?.trim() || null,
      input.source || null,
      input.location?.trim() || null,
      input.work_type || null,
      input.role_type || null,
      input.salary_min ?? null,
      input.salary_max ?? null,
      input.follow_up_date || null,
      input.last_contact_date || null,
      input.priority || 'Medium',
      input.contact_name?.trim() || null,
      input.contact_email?.trim() || null,
      input.next_action?.trim() || null,
      userId,
      now,
      now
    );

  const id = result.lastInsertRowid as number;

  database
    .prepare(
      'INSERT INTO status_changes (application_id, old_status, new_status, note, changed_at) VALUES (?, ?, ?, ?, ?)'
    )
    .run(id, null, input.status, 'Application created', now);

  return getApplicationById(id, userId)!;
}

export function updateApplication(
  id: number,
  input: UpdateApplicationInput,
  userId?: number
): Application | null {
  const database = getDb();
  const existing = userId != null
    ? (database.prepare('SELECT * FROM applications WHERE id = ? AND user_id = ?').get(id, userId) as
        | Record<string, unknown>
        | undefined)
    : (database.prepare('SELECT * FROM applications WHERE id = ?').get(id) as
        | Record<string, unknown>
        | undefined);

  if (!existing) return null;

  const now = new Date().toISOString();
  const current = rowToApplication(existing);
  const newStatus = input.status ?? current.status;

  const fields: unknown[] = [];
  const setters: string[] = [];

  const map: [keyof UpdateApplicationInput, string][] = [
    ['company', 'company'],
    ['position', 'position'],
    ['date_applied', 'date_applied'],
    ['status', 'status'],
    ['job_url', 'job_url'],
    ['notes', 'notes'],
    ['source', 'source'],
    ['location', 'location'],
    ['work_type', 'work_type'],
    ['role_type', 'role_type'],
    ['salary_min', 'salary_min'],
    ['salary_max', 'salary_max'],
    ['follow_up_date', 'follow_up_date'],
    ['last_contact_date', 'last_contact_date'],
    ['priority', 'priority'],
    ['contact_name', 'contact_name'],
    ['contact_email', 'contact_email'],
    ['next_action', 'next_action'],
  ];

  for (const [key, col] of map) {
    if (input[key] !== undefined) {
      let value = input[key];
      if (typeof value === 'string') value = value.trim() || null;
      setters.push(`${col} = ?`);
      fields.push(value);
    }
  }

  setters.push('updated_at = ?');
  fields.push(now);
  fields.push(id);

  database.prepare(`UPDATE applications SET ${setters.join(', ')} WHERE id = ?`).run(...fields);

  if (input.status && input.status !== current.status) {
    database
      .prepare(
        'INSERT INTO status_changes (application_id, old_status, new_status, note, changed_at) VALUES (?, ?, ?, ?, ?)'
      )
      .run(
        id,
        current.status,
        newStatus,
        input.status_note?.trim() || `Status changed to ${newStatus}`,
        now
      );
  }

  return getApplicationById(id, userId ?? undefined);
}

export function updateApplicationStatus(
  id: number,
  status: ApplicationStatus,
  note?: string,
  userId?: number
): Application | null {
  return updateApplication(id, { status, status_note: note }, userId);
}

export function deleteApplication(id: number, userId?: number): boolean {
  const database = getDb();
  const result =
    userId != null
      ? database.prepare('DELETE FROM applications WHERE id = ? AND user_id = ?').run(id, userId)
      : database.prepare('DELETE FROM applications WHERE id = ?').run(id);
  return result.changes > 0;
}

export function getApplicationStats(userId: number) {
  const allApps = getAllApplications({ userId });

  const byStatus = Object.fromEntries(
    APPLICATION_STATUSES.map((s) => [s, 0])
  ) as Record<ApplicationStatus, number>;

  const byRoleType: Record<string, number> = {};
  const bySource: Record<string, number> = {};

  for (const app of allApps) {
    byStatus[app.status] = (byStatus[app.status] || 0) + 1;
    if (app.role_type) {
      byRoleType[app.role_type] = (byRoleType[app.role_type] || 0) + 1;
    }
    if (app.source) {
      bySource[app.source] = (bySource[app.source] || 0) + 1;
    }
  }

  const active = allApps.filter((a) => ACTIVE_STATUSES.includes(a.status)).length;
  const recent = allApps.slice(0, 5);
  const followUpsDue = allApps.filter((a) => a.needs_follow_up);
  const staleApplications = allApps.filter((a) => a.is_stale);

  const applied = allApps.filter((a) => a.status !== 'Saved').length;
  const responded = allApps.filter((a) =>
    ['In Review', 'Interview', 'Assessment', 'Offer', 'Rejected'].includes(a.status)
  ).length;
  const interviewed = allApps.filter((a) =>
    ['Interview', 'Assessment', 'Offer'].includes(a.status)
  ).length;
  const offered = allApps.filter((a) => a.status === 'Offer').length;

  const responseRate = applied > 0 ? Math.round((responded / applied) * 100) : 0;
  const interviewRate = applied > 0 ? Math.round((interviewed / applied) * 100) : 0;
  const offerRate = applied > 0 ? Math.round((offered / applied) * 100) : 0;

  const appsWithResponse = allApps.filter((a) => a.last_contact_date);
  let avgDaysToResponse: number | null = null;
  if (appsWithResponse.length > 0) {
    const totalDays = appsWithResponse.reduce((sum, a) => {
      return sum + differenceInDays(parseISO(a.last_contact_date!), parseISO(a.date_applied));
    }, 0);
    avgDaysToResponse = Math.round(totalDays / appsWithResponse.length);
  }

  return {
    total: allApps.length,
    active,
    byStatus,
    byRoleType,
    bySource,
    recent,
    followUpsDue,
    staleApplications,
    responseRate,
    interviewRate,
    offerRate,
    avgDaysToResponse,
  };
}

export function seedDatabase(force = false, userId?: number): void {
  const database = getDb();

  if (userId == null) {
    return;
  }

  const count = (
    database
      .prepare('SELECT COUNT(*) as count FROM applications WHERE user_id = ?')
      .get(userId) as { count: number }
  ).count;

  if (count > 0 && !force) return;

  if (force) {
    database.prepare('DELETE FROM status_changes WHERE application_id IN (SELECT id FROM applications WHERE user_id = ?)').run(userId);
    database.prepare('DELETE FROM applications WHERE user_id = ?').run(userId);
  }

  for (const app of SEED_APPLICATIONS) {
    createApplication(app, userId);
  }
}

export function resetDatabase(userId?: number): void {
  const database = getDb();
  if (userId != null) {
    database.prepare('DELETE FROM status_changes WHERE application_id IN (SELECT id FROM applications WHERE user_id = ?)').run(userId);
    database.prepare('DELETE FROM applications WHERE user_id = ?').run(userId);
    return;
  }
  database.exec('DELETE FROM status_changes; DELETE FROM applications;');
}

export { getDb };
