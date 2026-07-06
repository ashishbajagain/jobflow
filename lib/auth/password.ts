import bcrypt from 'bcryptjs';
import { AUTH_CONFIG } from './config';

const COMMON_PASSWORDS = new Set([
  'password',
  'password1',
  'password123',
  '12345678',
  '123456789',
  'qwerty123',
  'letmein1',
  'welcome1',
  'admin123',
  'jobflow123',
  'ashish123',
]);

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, AUTH_CONFIG.bcryptRounds);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function validatePasswordStrength(password: string): string | null {
  if (password.length < AUTH_CONFIG.minPasswordLength) {
    return `Password must be at least ${AUTH_CONFIG.minPasswordLength} characters`;
  }
  if (password.length > AUTH_CONFIG.maxPasswordLength) {
    return `Password must be at most ${AUTH_CONFIG.maxPasswordLength} characters`;
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must include a lowercase letter';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must include an uppercase letter';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must include a number';
  }
  if (/\s/.test(password)) {
    return 'Password cannot contain spaces';
  }
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return 'Password is too common. Choose a stronger password';
  }
  return null;
}
