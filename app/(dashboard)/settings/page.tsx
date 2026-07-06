import { getAuthSession } from '@/lib/auth/session';
import { sessionToPublicUser } from '@/lib/auth/service';
import { redirect } from 'next/navigation';
import { SettingsContent } from './settings-content';

export default async function SettingsPage() {
  const session = await getAuthSession();
  if (!session) redirect('/login');
  return <SettingsContent user={sessionToPublicUser(session)} />;
}
