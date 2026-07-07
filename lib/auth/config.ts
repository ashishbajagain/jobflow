export const AUTH_CONFIG = {
  sessionCookie: 'jobflow_session',
  sessionMaxAgeDays: 30,
  sessionMaxAgeSeconds: 30 * 24 * 60 * 60,
  resetTokenMaxAgeMinutes: 60,
  maxLoginAttempts: 5,
  lockoutMinutes: 15,
  bcryptRounds: 12,
  minPasswordLength: 8,
  maxPasswordLength: 128,
} as const;

export const DEFAULT_USER = {
  username: 'ashish',
  email: 'bajagainashish@gmail.com',
  displayName: 'Ashish',
} as const;
