export const APPLICATION_STATUSES = [
  'Saved',
  'Applied',
  'In Review',
  'Interview',
  'Assessment',
  'Offer',
  'Rejected',
  'No Response',
  'Withdrawn',
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const ACTIVE_STATUSES: ApplicationStatus[] = [
  'Saved',
  'Applied',
  'In Review',
  'Interview',
  'Assessment',
  'Offer',
];

export const CLOSED_STATUSES: ApplicationStatus[] = [
  'Rejected',
  'No Response',
  'Withdrawn',
];

export const JOB_SOURCES = [
  'LinkedIn',
  'Seek',
  'Indeed',
  'Company Website',
  'Referral',
  'Recruiter',
  'Other',
] as const;

export type JobSource = (typeof JOB_SOURCES)[number];

export const WORK_TYPES = ['Remote', 'Hybrid', 'On-site'] as const;
export type WorkType = (typeof WORK_TYPES)[number];

export const ROLE_TYPES = [
  'Full Stack',
  'Frontend',
  'WordPress',
  'PHP',
  'Backend',
  'Other',
] as const;

export type RoleType = (typeof ROLE_TYPES)[number];

export const PRIORITIES = ['Low', 'Medium', 'High'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const STATUS_CONFIG: Record<
  ApplicationStatus,
  {
    label: string;
    badge: string;
    dot: string;
    chart: string;
    description: string;
    order: number;
  }
> = {
  Saved: {
    label: 'Saved',
    badge: 'bg-stone-100 text-stone-600 border-stone-200',
    dot: 'bg-stone-400',
    chart: '#A8A29E',
    description: 'Interested — not yet applied',
    order: 0,
  },
  Applied: {
    label: 'Applied',
    badge: 'bg-teal-50 text-teal-800 border-teal-200',
    dot: 'bg-teal-600',
    chart: '#0F766E',
    description: 'Application submitted',
    order: 1,
  },
  'In Review': {
    label: 'In Review',
    badge: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
    dot: 'bg-fuchsia-500',
    chart: '#C026D3',
    description: 'Recruiter or hiring team reviewing',
    order: 2,
  },
  Interview: {
    label: 'Interview',
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-500',
    chart: '#D97706',
    description: 'Interview scheduled or completed',
    order: 3,
  },
  Assessment: {
    label: 'Assessment',
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
    dot: 'bg-purple-500',
    chart: '#9333EA',
    description: 'Take-home task or technical test',
    order: 4,
  },
  Offer: {
    label: 'Offer',
    badge: 'bg-teal-50 text-teal-700 border-teal-200',
    dot: 'bg-teal-500',
    chart: '#0D9488',
    description: 'Offer received',
    order: 5,
  },
  Rejected: {
    label: 'Rejected',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-400',
    chart: '#E11D48',
    description: 'Explicit rejection',
    order: 6,
  },
  'No Response': {
    label: 'No Response',
    badge: 'bg-orange-50 text-orange-700 border-orange-200',
    dot: 'bg-orange-400',
    chart: '#EA580C',
    description: 'No reply after follow-ups (ghosted)',
    order: 7,
  },
  Withdrawn: {
    label: 'Withdrawn',
    badge: 'bg-stone-50 text-stone-500 border-stone-200',
    dot: 'bg-stone-300',
    chart: '#78716C',
    description: 'You withdrew from the process',
    order: 8,
  },
};

export const PAGE_SIZE = 10;

export const PIPELINE_STATUSES: ApplicationStatus[] = [
  'Saved',
  'Applied',
  'In Review',
  'Interview',
  'Assessment',
  'Offer',
];

export const GHOST_THRESHOLD_DAYS = 21;
export const FOLLOW_UP_REMINDER_DAYS = 7;

export const LEGACY_STATUS_MAP: Record<string, ApplicationStatus> = {
  Applied: 'Applied',
  Interview: 'Interview',
  Rejected: 'Rejected',
  Offer: 'Offer',
};
