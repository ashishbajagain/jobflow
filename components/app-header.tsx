'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown, LogOut, Settings, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { PublicUser } from '@/lib/auth/types';
import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';

export function AppHeader({ user }: { user: PublicUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

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
      setOpen(false);
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="flex h-14 items-center justify-end gap-3 px-4 sm:px-8 lg:px-10">
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={cn(
              'flex items-center gap-2.5 rounded-xl border bg-background px-3 py-2 text-left shadow-sm transition-colors hover:bg-accent',
              pathname === '/settings' && 'border-primary/30 ring-1 ring-primary/20'
            )}
            aria-expanded={open}
            aria-haspopup="menu"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-sm font-medium leading-tight">
                {user.displayName || user.username}
              </p>
              <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
            </div>
            <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
              <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border bg-card shadow-lg">
                <div className="border-b px-4 py-3">
                  <p className="truncate text-sm font-medium">{user.displayName || user.username}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
                <div className="p-1">
                  <Link
                    href="/settings"
                    onClick={() => setOpen(false)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent"
                  >
                    <Settings className="h-4 w-4" />
                    Account settings
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
