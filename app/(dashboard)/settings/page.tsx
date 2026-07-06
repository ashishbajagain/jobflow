import { getAuthenticatedUser } from '@/lib/auth/server';
import { SettingsContent } from './settings-content';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const user = await getAuthenticatedUser();
  return <SettingsContent user={user} />;
}
