import { redirect } from 'next/navigation';
import { getAuthSession } from '@/lib/auth/session';
import { sessionToPublicUser } from '@/lib/auth/service';
import { ensureAppInitialized } from '@/lib/init';
import { DashboardShell } from '@/components/dashboard-shell';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await ensureAppInitialized();

  const session = await getAuthSession();
  if (!session) redirect('/login');

  const user = sessionToPublicUser(session);

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
