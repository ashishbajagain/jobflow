import { redirect } from 'next/navigation';
import { ensureAppInitialized } from '@/lib/init';
import { getAuthSession } from './session';
import { sessionToPublicUser } from './service';
import type { AuthSession, PublicUser } from './types';

export async function getAuthenticatedSession(): Promise<AuthSession> {
  await ensureAppInitialized();
  const session = await getAuthSession();
  if (!session) redirect('/login');
  return session;
}

export async function getAuthenticatedUser(): Promise<PublicUser> {
  const session = await getAuthenticatedSession();
  return sessionToPublicUser(session);
}
