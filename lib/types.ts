import type {
  ApplicationStatus,
  JobSource,
  Priority,
  RoleType,
  WorkType,
} from './constants';

export type {
  ApplicationStatus,
  JobSource,
  Priority,
  RoleType,
  WorkType,
};

export interface Application {
  id: number;
  company: string;
  position: string;
  date_applied: string;
  status: ApplicationStatus;
  job_url: string | null;
  notes: string | null;
  source: JobSource | null;
  location: string | null;
  work_type: WorkType | null;
  role_type: RoleType | null;
  salary_min: number | null;
  salary_max: number | null;
  follow_up_date: string | null;
  last_contact_date: string | null;
  priority: Priority;
  contact_name: string | null;
  contact_email: string | null;
  next_action: string | null;
  created_at: string;
  updated_at: string;
  days_since_applied?: number;
  needs_follow_up?: boolean;
  is_stale?: boolean;
}

export interface StatusChange {
  id: number;
  application_id: number;
  old_status: ApplicationStatus | null;
  new_status: ApplicationStatus;
  note: string | null;
  changed_at: string;
}

export interface ApplicationWithTimeline extends Application {
  timeline: StatusChange[];
}

export interface ApplicationFilters {
  userId?: number;
  status?: ApplicationStatus;
  role_type?: RoleType;
  source?: JobSource;
  work_type?: WorkType;
  priority?: Priority;
  search?: string;
  active_only?: boolean;
  needs_follow_up?: boolean;
}

export interface ApplicationQuery extends ApplicationFilters {
  sortBy?: 'date_applied' | 'company' | 'status' | 'follow_up_date' | 'updated_at';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface ApplicationStats {
  total: number;
  active: number;
  byStatus: Record<ApplicationStatus, number>;
  byRoleType: Record<string, number>;
  bySource: Record<string, number>;
  recent: Application[];
  followUpsDue: Application[];
  staleApplications: Application[];
  responseRate: number;
  interviewRate: number;
  offerRate: number;
  avgDaysToResponse: number | null;
}

export interface CreateApplicationInput {
  company: string;
  position: string;
  date_applied: string;
  status: ApplicationStatus;
  job_url?: string | null;
  notes?: string | null;
  source?: JobSource | null;
  location?: string | null;
  work_type?: WorkType | null;
  role_type?: RoleType | null;
  salary_min?: number | null;
  salary_max?: number | null;
  follow_up_date?: string | null;
  last_contact_date?: string | null;
  priority?: Priority;
  contact_name?: string | null;
  contact_email?: string | null;
  next_action?: string | null;
}

export interface UpdateApplicationInput extends Partial<CreateApplicationInput> {
  status_note?: string;
}
