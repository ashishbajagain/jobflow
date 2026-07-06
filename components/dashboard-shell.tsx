import type { PublicUser } from '@/lib/auth/types';
import { Sidebar } from '@/components/sidebar';
import { AppHeader } from '@/components/app-header';

export function DashboardShell({
  user,
  children,
}: {
  user: PublicUser;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar user={user} />
      <div className="flex min-w-0 flex-1 flex-col lg:overflow-hidden">
        <AppHeader user={user} />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
