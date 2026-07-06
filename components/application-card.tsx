'use client';

import Link from 'next/link';
import { ExternalLink, MapPin, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/status-badge';
import { formatDate, formatRelativeDate } from '@/lib/utils';
import type { Application } from '@/lib/types';

export function ApplicationCard({ app, compact = false }: { app: Application; compact?: boolean }) {
  return (
    <Link
      href={`/applications/${app.id}`}
      className="group block rounded-2xl border border-border/80 bg-card p-5 transition-all duration-150 hover:border-teal-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-foreground group-hover:text-primary">{app.company}</p>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">{app.position}</p>
          {!compact && app.location && (
            <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" /> {app.location}
            </p>
          )}
        </div>
        <StatusBadge status={app.status} />
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatDate(app.date_applied)}
        </span>
        {app.needs_follow_up && (
          <span className="flex items-center gap-1 font-medium text-orange-600">
            <AlertTriangle className="h-3 w-3" /> Follow-up due
          </span>
        )}
        {app.is_stale && !app.needs_follow_up && (
          <span className="font-medium text-orange-600">{app.days_since_applied}d no response</span>
        )}
      </div>
    </Link>
  );
}

export function RecentApplications({ applications }: { applications: Application[] }) {
  if (applications.length === 0) {
    return (
      <Card className="surface-card">
        <CardContent className="py-16 text-center">
          <p className="text-muted-foreground">No applications yet.</p>
          <Link href="/applications/new" className="mt-3 inline-block text-sm font-medium text-primary hover:text-primary/80">
            Add your first application
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="surface-card">
      <CardHeader className="flex flex-row items-center justify-between px-6 pt-6 pb-4">
        <CardTitle className="text-base font-semibold">Recent Applications</CardTitle>
        <Link href="/applications" className="text-sm font-medium text-primary hover:text-primary/80">View all</Link>
      </CardHeader>
      <CardContent className="space-y-3 px-6 pb-6">
        {applications.map((app) => (
          <ApplicationCard key={app.id} app={app} compact />
        ))}
      </CardContent>
    </Card>
  );
}

export function ApplicationLink({ url, source }: { url: string | null; source?: string | null }) {
  if (!url) return <span className="text-muted-foreground">—</span>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
    >
      View on {source || 'web'} <ExternalLink className="h-3.5 w-3.5" />
    </a>
  );
}

export function FollowUpList({ applications }: { applications: Application[] }) {
  if (applications.length === 0) {
    return (
      <Card className="surface-card">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No follow-ups due. You&apos;re all caught up!
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {applications.map((app) => (
        <Link
          key={app.id}
          href={`/applications/${app.id}`}
          className="flex items-center justify-between rounded-2xl border border-orange-100 bg-card p-4 transition-all hover:border-orange-200 hover:bg-orange-50/40"
        >
          <div>
            <p className="font-medium text-foreground">{app.company}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{app.next_action || 'Follow up needed'}</p>
          </div>
          <div className="text-right">
            <StatusBadge status={app.status} />
            <p className="mt-1.5 text-xs font-medium text-orange-600">
              Due {app.follow_up_date ? formatRelativeDate(app.follow_up_date) : 'now'}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
