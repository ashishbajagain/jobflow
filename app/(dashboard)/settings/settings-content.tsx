import { ChangePasswordForm } from '@/components/change-password-form';
import type { PublicUser } from '@/lib/auth/types';

export function SettingsContent({ user }: { user: PublicUser }) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Account settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile and security for @{user.username}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div className="rounded-xl border bg-muted/20 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
              {(user.displayName || user.username).charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium">{user.displayName || user.username}</p>
              <p className="truncate text-sm text-muted-foreground">@{user.username}</p>
            </div>
          </div>
          <dl className="mt-5 space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-medium">{user.email}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Username</dt>
              <dd className="font-medium">@{user.username}</dd>
            </div>
          </dl>
        </div>

        <ChangePasswordForm />
      </div>
    </div>
  );
}
