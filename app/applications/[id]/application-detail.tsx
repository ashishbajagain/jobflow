'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  MapPin,
  DollarSign,
  User,
  Mail,
  Calendar,
  AlertTriangle,
  Pencil,
  Briefcase,
  Globe,
  Flag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/status-badge';
import { ApplicationForm } from '@/components/application-form';
import { ApplicationLink } from '@/components/application-card';
import { DeleteApplicationButton } from '@/components/delete-application-button';
import { PageLoading } from '@/components/skeleton';
import { toast } from '@/components/ui/use-toast';
import { formatDate, formatDateTime, formatSalary } from '@/lib/utils';
import { STATUS_CONFIG } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { ApplicationWithTimeline } from '@/lib/types';

function InfoRow({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start gap-3.5 py-3.5', className)}>
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-muted/80">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <div className="mt-0.5 text-sm font-medium text-foreground">{value || <span className="text-muted-foreground">—</span>}</div>
      </div>
    </div>
  );
}

export default function ApplicationDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditing = searchParams.get('edit') === 'true';

  const [application, setApplication] = useState<ApplicationWithTimeline | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchApplication = async () => {
    try {
      const response = await fetch(`/api/applications/${params.id}`);
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      setApplication(result.data);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Not found',
      });
      router.push('/applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplication();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  if (loading) return <PageLoading />;
  if (!application) return null;

  if (isEditing) {
    return (
      <div className="page-container max-w-3xl">
        <Button
          variant="ghost"
          size="sm"
          className="mb-2 -ml-2 gap-1.5 text-muted-foreground"
          onClick={() => router.push(`/applications/${params.id}`)}
        >
          <ArrowLeft className="h-4 w-4" /> Back to details
        </Button>
        <ApplicationForm
          application={application}
          mode="edit"
          onSuccess={() => {
            router.push(`/applications/${params.id}`);
            fetchApplication();
          }}
        />
      </div>
    );
  }

  return (
    <div className="page-container max-w-4xl">
      {/* Back nav */}
      <Link
        href="/applications"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All applications
      </Link>

      {/* Hero header */}
      <div className="surface-card overflow-hidden">
        <div className="bg-gradient-to-br from-teal-600/5 via-transparent to-transparent px-6 py-8 sm:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{application.company}</h1>
                <StatusBadge status={application.status} size="md" />
              </div>
              <p className="text-lg text-muted-foreground">{application.position}</p>
              <div className="flex flex-wrap gap-2">
                {application.role_type && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-800">
                    <Briefcase className="h-3 w-3" /> {application.role_type}
                  </span>
                )}
                {application.work_type && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">
                    <Globe className="h-3 w-3" /> {application.work_type}
                  </span>
                )}
                {application.source && (
                  <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">
                    via {application.source}
                  </span>
                )}
                {application.priority === 'High' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700">
                    <Flag className="h-3 w-3" /> High Priority
                  </span>
                )}
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 rounded-xl"
                onClick={() => router.push(`/applications/${params.id}?edit=true`)}
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
              <DeleteApplicationButton
                id={application.id}
                company={application.company}
                redirectTo="/applications"
                showLabel
              />
            </div>
          </div>
        </div>

        {/* Alerts */}
        {(application.needs_follow_up || application.is_stale) && (
          <div className="space-y-0 border-t border-border/60">
            {application.needs_follow_up && (
              <div className="flex items-start gap-3 border-b border-orange-100 bg-orange-50/60 px-6 py-4 sm:px-8">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-orange-900">Follow-up due</p>
                  <p className="mt-0.5 text-sm text-orange-700">{application.next_action || 'Send a follow-up message'}</p>
                </div>
              </div>
            )}
            {application.is_stale && (
              <div className="flex items-start gap-3 bg-amber-50/60 px-6 py-4 sm:px-8">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                <p className="text-sm text-amber-800">
                  Applied {application.days_since_applied} days ago with no response — consider marking as &quot;No Response&quot;.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Details grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="surface-card">
          <CardHeader className="px-6 pt-6 pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Job Details</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border/60 px-6 pb-2">
            <InfoRow icon={MapPin} label="Location" value={application.location} />
            <InfoRow icon={DollarSign} label="Salary Range" value={formatSalary(application.salary_min, application.salary_max)} />
            <InfoRow
              icon={Globe}
              label="Job Posting"
              value={<ApplicationLink url={application.job_url} source={application.source} />}
            />
            <InfoRow icon={Calendar} label="Date Applied" value={formatDate(application.date_applied)} />
          </CardContent>
        </Card>

        <Card className="surface-card">
          <CardHeader className="px-6 pt-6 pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Follow-up & Contact</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border/60 px-6 pb-2">
            <InfoRow icon={Calendar} label="Follow-up Date" value={application.follow_up_date ? formatDate(application.follow_up_date) : null} />
            <InfoRow icon={Clock} label="Last Contact" value={application.last_contact_date ? formatDate(application.last_contact_date) : null} />
            <InfoRow icon={User} label="Contact" value={application.contact_name} />
            <InfoRow icon={Mail} label="Email" value={application.contact_email} />
            <InfoRow icon={Clock} label="Next Action" value={application.next_action} />
          </CardContent>
        </Card>
      </div>

      {application.notes && (
        <Card className="surface-card">
          <CardHeader className="px-6 pt-6 pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Notes</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{application.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card className="surface-card">
        <CardHeader className="px-6 pt-6 pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Clock className="h-4 w-4 text-primary" /> Status Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-8">
          {application.timeline.length === 0 ? (
            <p className="text-sm text-muted-foreground">No status changes recorded.</p>
          ) : (
            <div className="relative ml-1 space-y-0">
              {application.timeline.map((change, index) => (
                <div key={change.id} className="relative flex gap-5 pb-8 last:pb-0">
                  {index < application.timeline.length - 1 && (
                    <div className="absolute left-[7px] top-4 h-[calc(100%-8px)] w-px bg-border" />
                  )}
                  <div
                    className="relative z-10 mt-1 h-3.5 w-3.5 flex-shrink-0 rounded-full ring-4 ring-card"
                    style={{ backgroundColor: STATUS_CONFIG[change.new_status].chart }}
                  />
                  <div className="min-w-0 flex-1 pt-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {change.old_status && (
                        <>
                          <StatusBadge status={change.old_status} />
                          <span className="text-muted-foreground">→</span>
                        </>
                      )}
                      <StatusBadge status={change.new_status} />
                    </div>
                    {change.note && (
                      <p className="mt-2 text-sm text-muted-foreground">{change.note}</p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground/80">
                      {formatDateTime(change.changed_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
