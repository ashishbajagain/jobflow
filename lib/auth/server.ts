import { redirect } from 'next/navigation';
import { ensureAppInitialized } from '@/lib/init';
import { getAuthSession, getSessionTokenFromCookies } from './session';
import { sessionToPublicUser } from './service';
import type { AuthSession, PublicUser } from './types';

export async function getAuthenticatedSession(): Promise<AuthSession> {
  await ensureAppInitialized();
  const token = await getSessionTokenFromCookies();
  const session = await getAuthSession();
  if (!session) {
    if (token) {
      redirect('/login?session=expired');
    }
    redirect('/login');
  }
  return session;
}

export async function getOptionalAuthenticatedSession(): Promise<AuthSession | null> {
  await ensureAppInitialized();
  return getAuthSession();
}

export async function getAuthenticatedUser(): Promise<PublicUser> {
  const session = await getAuthenticatedSession();
  return sessionToPublicUser(session);
}
