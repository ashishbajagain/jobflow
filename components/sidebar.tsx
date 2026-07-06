'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  List,
  Plus,
  Kanban,
  Bell,
  Menu,
  X,
  Workflow,
  LogOut,
  User,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { BRAND } from '@/lib/brand';
import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import type { PublicUser } from '@/lib/auth/types';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pipeline', label: 'Pipeline', icon: Kanban },
  { href: '/applications', label: 'Applications', icon: List },
  { href: '/follow-ups', label: 'Follow-ups', icon: Bell },
  { href: '/settings', label: 'Settings', icon: Settings },
];

function Logo({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'h-8 w-8' : 'h-9 w-9';
  const icon = size === 'sm' ? 'h-4 w-4' : 'h-[18px] w-[18px]';
  return (
    <div className={cn('flex items-center justify-center rounded-xl bg-gradient-to-br from-teal-700 to-teal-800 shadow-sm', dim)}>
      <Workflow className={cn('text-white', icon)} />
    </div>
  );
}

export function Sidebar({ user }: { user: PublicUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
      router.push('/login');
      router.refresh();
    } catch {
      toast({ title: 'Sign out failed', variant: 'destructive' });
    } finally {
      setLoggingOut(false);
    }
  }

  const NavContent = () => (
    <>
      <div className="flex h-[72px] items-center gap-3 border-b border-sidebar-border px-5">
        <Logo />
        <div>
          <p className="font-semibold leading-tight tracking-tight text-foreground">{BRAND.name}</p>
          <p className="text-[11px] leading-tight text-muted-foreground">{BRAND.tagline}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
              isActive(href)
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            <Icon className="h-[18px] w-[18px]" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="space-y-3 border-t border-sidebar-border p-4">
        <Link href="/applications/new" onClick={() => setMobileOpen(false)}>
          <Button className="btn-brand w-full gap-2" size="sm">
            <Plus className="h-4 w-4" />
            New Application
          </Button>
        </Link>

        <div className="rounded-xl border bg-muted/30 p-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.displayName || user.username}</p>
              <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
            </div>
          </div>
          <div className="mt-3 grid gap-1">
            <Link
              href="/settings"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Settings className="h-4 w-4" />
              Account settings
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 px-2 text-muted-foreground"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-card px-4 lg:hidden">
        <div className="flex items-center gap-2.5">
          <Logo size="sm" />
          <span className="font-semibold tracking-tight">{BRAND.name}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-sidebar-border bg-card transition-transform duration-200 lg:static lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <NavContent />
      </aside>
    </>
  );
}
