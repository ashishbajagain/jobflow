import {
  APPLICATION_STATUSES,
  JOB_SOURCES,
  PRIORITIES,
  ROLE_TYPES,
  WORK_TYPES,
} from './constants';

const URL_PATTERN = /^https?:\/\/.+/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(date: string): boolean {
  if (!DATE_PATTERN.test(date)) return false;
  return !isNaN(new Date(date).getTime());
}

function sanitizeString(value: unknown, maxLength = 500): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string') return null;
  return value.trim().slice(0, maxLength);
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  data?: Record<string, unknown>;
}

export function validateCreateApplication(body: Record<string, unknown>): ValidationResult {
  const company = sanitizeString(body.company, 200);
  const position = sanitizeString(body.position, 200);

  if (!company) return { valid: false, error: 'Company name is required' };
  if (!position) return { valid: false, error: 'Position title is required' };

  const dateApplied = typeof body.date_applied === 'string' ? body.date_applied : '';
  if (!isValidDate(dateApplied)) {
    return { valid: false, error: 'Valid date applied is required (YYYY-MM-DD)' };
  }

  const status = body.status as string;
  if (!status || !APPLICATION_STATUSES.includes(status as (typeof APPLICATION_STATUSES)[number])) {
    return { valid: false, error: 'Invalid status value' };
  }

  const optionalChecks = validateOptionalFields(body);
  if (!optionalChecks.valid) return optionalChecks;

  return {
    valid: true,
    data: {
      company,
      position,
      date_applied: dateApplied,
      status,
      ...optionalChecks.data,
    },
  };
}

function validateOptionalFields(body: Record<string, unknown>): ValidationResult {
  const jobUrl = sanitizeString(body.job_url, 2000);
  if (jobUrl && !URL_PATTERN.test(jobUrl)) {
    return { valid: false, error: 'Job URL must be a valid http(s) URL' };
  }

  const source = body.source as string | null | undefined;
  if (source && !JOB_SOURCES.includes(source as (typeof JOB_SOURCES)[number])) {
    return { valid: false, error: 'Invalid job source' };
  }

  const workType = body.work_type as string | null | undefined;
  if (workType && !WORK_TYPES.includes(workType as (typeof WORK_TYPES)[number])) {
    return { valid: false, error: 'Invalid work type' };
  }

  const roleType = body.role_type as string | null | undefined;
  if (roleType && !ROLE_TYPES.includes(roleType as (typeof ROLE_TYPES)[number])) {
    return { valid: false, error: 'Invalid role type' };
  }

  const priority = (body.priority as string) || 'Medium';
  if (body.priority !== undefined && !PRIORITIES.includes(priority as (typeof PRIORITIES)[number])) {
    return { valid: false, error: 'Invalid priority value' };
  }

  const contactEmail = sanitizeString(body.contact_email, 200);
  if (contactEmail && !EMAIL_PATTERN.test(contactEmail)) {
    return { valid: false, error: 'Invalid contact email' };
  }

  for (const dateField of ['follow_up_date', 'last_contact_date'] as const) {
    const val = body[dateField];
    if (typeof val === 'string' && val && !isValidDate(val)) {
      return { valid: false, error: `Invalid ${dateField.replace('_', ' ')}` };
    }
  }

  const salaryMin = parseSalary(body.salary_min);
  const salaryMax = parseSalary(body.salary_max);
  if (salaryMin !== undefined && salaryMin === null) return { valid: false, error: 'Invalid minimum salary' };
  if (salaryMax !== undefined && salaryMax === null) return { valid: false, error: 'Invalid maximum salary' };
  if (salaryMin && salaryMax && salaryMin > salaryMax) {
    return { valid: false, error: 'Minimum salary cannot exceed maximum salary' };
  }

  return {
    valid: true,
    data: {
      job_url: jobUrl,
      notes: sanitizeString(body.notes, 5000),
      source: source || null,
      location: sanitizeString(body.location, 200),
      work_type: workType || null,
      role_type: roleType || null,
      salary_min: salaryMin ?? null,
      salary_max: salaryMax ?? null,
      follow_up_date: typeof body.follow_up_date === 'string' && body.follow_up_date ? body.follow_up_date : null,
      last_contact_date: typeof body.last_contact_date === 'string' && body.last_contact_date ? body.last_contact_date : null,
      priority: body.priority ? priority : undefined,
      contact_name: sanitizeString(body.contact_name, 200),
      contact_email: contactEmail,
      next_action: sanitizeString(body.next_action, 500),
      status_note: sanitizeString(body.status_note, 1000),
    },
  };
}

function parseSalary(value: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const num = Number(value);
  if (isNaN(num) || num < 0) return null;
  return num;
}

export function validateUpdateApplication(body: Record<string, unknown>): ValidationResult {
  if (Object.keys(body).length === 0) {
    return { valid: false, error: 'No update fields provided' };
  }

  const data: Record<string, unknown> = {};

  if (body.company !== undefined) {
    const company = sanitizeString(body.company, 200);
    if (!company) return { valid: false, error: 'Company name cannot be empty' };
    data.company = company;
  }

  if (body.position !== undefined) {
    const position = sanitizeString(body.position, 200);
    if (!position) return { valid: false, error: 'Position title cannot be empty' };
    data.position = position;
  }

  if (body.date_applied !== undefined) {
    if (typeof body.date_applied !== 'string' || !isValidDate(body.date_applied)) {
      return { valid: false, error: 'Invalid date applied' };
    }
    data.date_applied = body.date_applied;
  }

  if (body.status !== undefined) {
    if (!APPLICATION_STATUSES.includes(body.status as (typeof APPLICATION_STATUSES)[number])) {
      return { valid: false, error: 'Invalid status value' };
    }
    data.status = body.status;
  }

  const optional = validateOptionalFields(body);
  if (!optional.valid) return optional;

  const optionalKeys = [
    'job_url', 'notes', 'source', 'location', 'work_type', 'role_type',
    'salary_min', 'salary_max', 'follow_up_date', 'last_contact_date',
    'priority', 'contact_name', 'contact_email', 'next_action', 'status_note',
  ] as const;

  for (const key of optionalKeys) {
    if (body[key] !== undefined) {
      data[key] = optional.data![key];
    }
  }

  return { valid: true, data };
}

export function parseApplicationId(id: string): number | null {
  const parsed = parseInt(id, 10);
  if (isNaN(parsed) || parsed <= 0 || parsed > Number.MAX_SAFE_INTEGER) return null;
  return parsed;
}
