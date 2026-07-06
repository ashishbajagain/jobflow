import { getAuthenticatedUser } from '@/lib/auth/server';
import { DashboardShell } from '@/components/dashboard-shell';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthenticatedUser();
  return <DashboardShell user={user}>{children}</DashboardShell>;
}
