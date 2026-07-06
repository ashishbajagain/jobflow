import { z } from 'zod';
import { AUTH_CONFIG } from './config';

export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Username is required').max(64),
  password: z.string().min(1, 'Password is required').max(AUTH_CONFIG.maxPasswordLength),
});

export const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(32, 'Username must be at most 32 characters')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Username can only contain letters, numbers, dots, hyphens, and underscores'),
  email: z.string().trim().email('Enter a valid email address').max(254),
  password: z.string().min(AUTH_CONFIG.minPasswordLength).max(AUTH_CONFIG.maxPasswordLength),
  displayName: z.string().trim().max(100).optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
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
