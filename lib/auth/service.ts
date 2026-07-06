import { signSessionToken } from './jwt';
import { AUTH_CONFIG } from './config';
import { sendPasswordResetEmail } from './email';
import { hashPassword, validatePasswordStrength, verifyPassword } from './password';
import { createPasswordResetToken, consumePasswordResetToken, purgeExpiredResetTokens } from './reset-repository';
import {
  createSession,
  deleteSession,
  deleteAllUserSessions,
  purgeExpiredSessions,
} from './session-repository';
import { verifySessionToken } from './jwt';
import {
  createUser,
  emailExists,
  getUserByEmail,
  getUserWithPasswordById,
  getUserWithPasswordByUsername,
  recordFailedLogin,
  resetFailedLogin,
  updateUserPassword,
  usernameExists,
} from './user-repository';
import type { AuthSession, PublicUser } from './types';
import type { ChangePasswordInput, ForgotPasswordInput, LoginInput, RegisterInput, ResetPasswordInput } from './validators';
import { isUniqueConstraintError } from './errors';

function toPublicUser(session: AuthSession): PublicUser {
  return {
    id: session.userId,
    username: session.username,
    email: session.email,
    displayName: session.displayName,
  };
}

function isAccountLocked(lockedUntil: string | null): boolean {
  if (!lockedUntil) return false;
  return new Date(lockedUntil) > new Date();
}

export async function loginUser(
  input: LoginInput,
  meta: { ipAddress?: string | null; userAgent?: string | null }
): Promise<
  | { ok: true; token: string; expiresAt: string; user: PublicUser }
  | { ok: false; error: string; status: number }
> {
  purgeExpiredSessions();

  const user = getUserWithPasswordByUsername(input.username);
  if (!user) {
    return { ok: false, error: 'Invalid username or password', status: 401 };
  }

  if (isAccountLocked(user.locked_until)) {
    return {
      ok: false,
      error: 'Account temporarily locked due to too many failed attempts. Try again later.',
      status: 423,
    };
  }

  const valid = await verifyPassword(input.password, user.password_hash);
  if (!valid) {
    const attempts = user.failed_login_attempts + 1;
    const lockedUntil =
      attempts >= AUTH_CONFIG.maxLoginAttempts
        ? new Date(Date.now() + AUTH_CONFIG.lockoutMinutes * 60 * 1000).toISOString()
        : null;
    recordFailedLogin(user.id, attempts, lockedUntil);
    return { ok: false, error: 'Invalid username or password', status: 401 };
  }

  resetFailedLogin(user.id);
  const session = createSession({
    userId: user.id,
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
  });

  const token = await signSessionToken(
    { sessionId: session.sessionId, userId: user.id },
    session.expiresAt
  );

  return {
    ok: true,
    token,
    expiresAt: session.expiresAt,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.display_name,
    },
  };
}

export async function registerUser(
  input: RegisterInput
): Promise<{ ok: true; user: PublicUser } | { ok: false; error: string; status: number }> {
  if (usernameExists(input.username)) {
    return { ok: false, error: 'Username is already taken', status: 409 };
  }
  if (emailExists(input.email)) {
    return { ok: false, error: 'Email is already registered', status: 409 };
  }

  const passwordError = validatePasswordStrength(input.password);
  if (passwordError) {
    return { ok: false, error: passwordError, status: 400 };
  }

  const passwordHash = await hashPassword(input.password);
  try {
    const user = createUser({
      username: input.username,
      email: input.email,
      passwordHash,
      displayName: input.displayName,
    });

    return {
      ok: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.display_name,
      },
    };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { ok: false, error: 'Username or email is already registered', status: 409 };
    }
    throw error;
  }
}

export async function requestPasswordReset(
  input: ForgotPasswordInput,
  appUrl: string
): Promise<{ ok: true; message: string }> {
  purgeExpiredResetTokens();

  const user = getUserByEmail(input.email);
  const message =
    'If an account exists with that email, you will receive password reset instructions shortly.';

  if (!user) {
    return { ok: true, message };
  }

  const token = createPasswordResetToken(user.id);
  const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(token)}`;

  await sendPasswordResetEmail({
    to: user.email,
    username: user.username,
    resetUrl,
  });

  return { ok: true, message };
}

export async function resetUserPassword(
  input: ResetPasswordInput
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const passwordError = validatePasswordStrength(input.password);
  if (passwordError) {
    return { ok: false, error: passwordError, status: 400 };
  }

  const userId = consumePasswordResetToken(input.token);
  if (!userId) {
    return { ok: false, error: 'This reset link is invalid or has expired', status: 400 };
  }

  const passwordHash = await hashPassword(input.password);
  updateUserPassword(userId, passwordHash);
  deleteAllUserSessions(userId);

  return { ok: true };
}

export async function changeUserPassword(
  userId: number,
  input: ChangePasswordInput
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const user = getUserWithPasswordById(userId);
  if (!user) {
    return { ok: false, error: 'User not found', status: 404 };
  }

  const valid = await verifyPassword(input.currentPassword, user.password_hash);
  if (!valid) {
    return { ok: false, error: 'Current password is incorrect', status: 401 };
  }

  if (input.currentPassword === input.newPassword) {
    return { ok: false, error: 'New password must be different from current password', status: 400 };
  }

  const passwordError = validatePasswordStrength(input.newPassword);
  if (passwordError) {
    return { ok: false, error: passwordError, status: 400 };
  }

  const passwordHash = await hashPassword(input.newPassword);
  updateUserPassword(userId, passwordHash);

  return { ok: true };
}

export async function logoutUser(token: string | null): Promise<void> {
  if (!token) return;
  const payload = await verifySessionToken(token);
  if (payload) {
    deleteSession(payload.sessionId);
  }
}

export function sessionToPublicUser(session: AuthSession): PublicUser {
  return toPublicUser(session);
}
