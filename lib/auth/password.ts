import bcrypt from 'bcryptjs';
import { AUTH_CONFIG } from './config';

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
  return null;
}
