'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  TrendingUp,
  MessageSquare,
  Target,
  AlertTriangle,
  Bell,
  Plus,
  ArrowUpRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusCharts } from '@/components/status-charts';
import { RecentApplications, FollowUpList } from '@/components/application-card';
import { DashboardSkeleton } from '@/components/skeleton';
import { toast } from '@/components/ui/use-toast';
import { apiFetch } from '@/lib/api-client';
import { STATUS_CONFIG, type ApplicationStatus } from '@/lib/constants';
import type { ApplicationStats } from '@/lib/types';

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  href,
  accentClass,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  href?: string;
  accentClass: string;
}) {
  const content = (
    <Card className="surface-card transition-all duration-150 hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-semibold tracking-tight text-foreground">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className={`rounded-2xl p-3 ${accentClass}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/api/stats')
      .then(async (r) => {
        const result = await r.json();
        if (!result.success) {
          if (r.status === 401) {
            window.location.assign('/login?session=expired');
            return;
          }
          throw new Error(result.error || 'Failed to load dashboard');
        }
        setStats(result.data);
        setError(null);
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : 'Failed to load dashboard';
        setError(message);
        toast({ variant: 'destructive', title: 'Error', description: message });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-container"><DashboardSkeleton /></div>;

  if (error || !stats) {
    return (
      <div className="page-container">
        <Card className="surface-card">
          <CardContent className="py-16 text-center">
            <p className="text-lg font-medium text-foreground">Unable to load dashboard</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {error || 'Something went wrong while loading your data.'}
            </p>
            <Button className="btn-brand mt-6" onClick={() => window.location.reload()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pipelineStatuses = ['Applied', 'In Review', 'Interview', 'Assessment', 'Offer'] as ApplicationStatus[];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="page-subtitle">
            {stats.active} active · {stats.followUpsDue.length} follow-up{stats.followUpsDue.length !== 1 ? 's' : ''} due
          </p>
        </div>
        <Link href="/applications/new">
          <Button className="btn-brand gap-2">
            <Plus className="h-4 w-4" /> New Application
          </Button>
        </Link>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Applications"
          value={stats.total}
          icon={Briefcase}
          href="/applications"
          accentClass="bg-teal-50 text-teal-700"
        />
        <StatCard
          title="Response Rate"
          value={`${stats.responseRate}%`}
          subtitle={stats.avgDaysToResponse != null ? `${stats.avgDaysToResponse} avg days to response` : 'No responses yet'}
          icon={MessageSquare}
          accentClass="bg-fuchsia-50 text-fuchsia-600"
        />
        <StatCard
          title="Interview Rate"
          value={`${stats.interviewRate}%`}
          subtitle="Reached interview stage"
          icon={Target}
          accentClass="bg-amber-50 text-amber-600"
        />
        <StatCard
          title="Offer Rate"
          value={`${stats.offerRate}%`}
          subtitle={`${stats.byStatus.Offer || 0} offer${stats.byStatus.Offer !== 1 ? 's' : ''} received`}
          icon={TrendingUp}
          accentClass="bg-teal-50 text-teal-600"
        />
      </div>

      {(stats.followUpsDue.length > 0 || stats.staleApplications.length > 0) && (
        <div className="grid gap-5 md:grid-cols-2">
          {stats.followUpsDue.length > 0 && (
            <Card className="surface-card border-orange-200/80">
              <CardHeader className="flex flex-row items-center justify-between px-6 pt-6 pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-orange-900">
                  <Bell className="h-4 w-4" /> Follow-ups Due
                  <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold">{stats.followUpsDue.length}</span>
                </CardTitle>
                <Link href="/follow-ups">
                  <Button variant="ghost" size="sm" className="text-orange-700 hover:text-orange-900">
                    View all <ArrowUpRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <FollowUpList applications={stats.followUpsDue.slice(0, 3)} />
              </CardContent>
            </Card>
          )}
          {stats.staleApplications.length > 0 && (
            <Card className="surface-card border-amber-200/80">
              <CardHeader className="px-6 pt-6 pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-amber-900">
                  <AlertTriangle className="h-4 w-4" />
                  Possible Ghosted
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold">{stats.staleApplications.length}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 px-6 pb-6">
                <p className="mb-3 text-sm text-amber-800/80">
                  21+ days with no response — consider updating status.
                </p>
                {stats.staleApplications.slice(0, 3).map((app) => (
                  <Link
                    key={app.id}
                    href={`/applications/${app.id}`}
                    className="flex items-center justify-between rounded-xl border border-amber-100 bg-card p-3.5 text-sm transition-colors hover:bg-amber-50/50"
                  >
                    <span className="font-medium text-foreground">{app.company}</span>
                    <span className="text-xs font-medium text-amber-700">{app.days_since_applied}d ago</span>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Card className="surface-card">
        <CardHeader className="px-6 pt-6 pb-4">
          <CardTitle className="text-base font-semibold">Pipeline Overview</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="flex flex-wrap gap-2.5">
            {pipelineStatuses.map((status) => (
              <Link
                key={status}
                href={`/applications?status=${encodeURIComponent(status)}`}
                className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card px-4 py-2 text-sm transition-all hover:border-teal-200 hover:shadow-sm"
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_CONFIG[status].chart }} />
                <span className="font-medium text-foreground">{status}</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                  {stats.byStatus[status] || 0}
                </span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <StatusCharts byStatus={stats.byStatus} />
      <RecentApplications applications={stats.recent} />
    </div>
  );
}
