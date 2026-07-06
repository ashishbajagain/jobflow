import { z } from 'zod';
import { AUTH_CONFIG } from './config';
import { sanitizeDisplayName, sanitizeEmail, sanitizeUsername, containsHtml } from './sanitize';

const RESERVED_USERNAMES = new Set([
  'admin',
  'administrator',
  'root',
  'system',
  'support',
  'help',
  'api',
  'login',
  'register',
  'signup',
  'signin',
  'settings',
  'jobflow',
  'null',
  'undefined',
]);

const usernameField = z
  .string()
  .trim()
  .min(3, 'Username must be at least 3 characters')
  .max(32, 'Username must be at most 32 characters')
  .regex(/^[a-zA-Z0-9._-]+$/, 'Username can only contain letters, numbers, dots, hyphens, and underscores')
  .regex(/^[a-zA-Z0-9]/, 'Username must start with a letter or number')
  .regex(/[a-zA-Z0-9]$/, 'Username must end with a letter or number')
  .refine((value) => !/[._-]{2}/.test(value), 'Username cannot contain consecutive special characters')
  .transform(sanitizeUsername)
  .refine((value) => !RESERVED_USERNAMES.has(value), 'This username is not available');

const emailField = z
  .string()
  .trim()
  .min(5, 'Email is required')
  .max(254, 'Email is too long')
  .email('Enter a valid email address')
  .transform(sanitizeEmail);

const displayNameField = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z
    .string()
    .trim()
    .max(100, 'Display name must be at most 100 characters')
    .refine((value) => !containsHtml(value), 'Display name contains invalid characters')
    .refine(
      (value) => /^[\w\s.'-]+$/i.test(value),
      'Display name can only contain letters, numbers, spaces, and . \' -'
    )
    .optional()
    .transform((value) => sanitizeDisplayName(value))
);

export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, 'Username is required')
    .max(64)
    .transform(sanitizeUsername),
  password: z.string().min(1, 'Password is required').max(AUTH_CONFIG.maxPasswordLength),
});

export const registerSchema = z.object({
  username: usernameField,
  email: emailField,
  password: z.string().min(AUTH_CONFIG.minPasswordLength).max(AUTH_CONFIG.maxPasswordLength),
  displayName: displayNameField,
});

export const forgotPasswordSchema = z.object({
  email: emailField,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required').max(256),
  password: z.string().min(AUTH_CONFIG.minPasswordLength).max(AUTH_CONFIG.maxPasswordLength),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required').max(AUTH_CONFIG.maxPasswordLength),
  newPassword: z.string().min(AUTH_CONFIG.minPasswordLength).max(AUTH_CONFIG.maxPasswordLength),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const registerFormSchema = registerSchema
  .extend({
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
