'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { toast } from '@/components/ui/use-toast';
import { StatusBadge } from '@/components/status-badge';
import { PageLoading } from '@/components/skeleton';
import { PIPELINE_STATUSES, STATUS_CONFIG, type ApplicationStatus } from '@/lib/constants';
import type { Application } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function PipelinePage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState<number | null>(null);

  const fetchApps = useCallback(async () => {
    try {
      const res = await fetch('/api/applications?sortBy=updated_at&sortOrder=desc');
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      setApplications(result.data);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  const handleDrop = async (appId: number, newStatus: ApplicationStatus) => {
    const app = applications.find((a) => a.id === appId);
    if (!app || app.status === newStatus) return;

    setApplications((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
    );

    try {
      const res = await fetch(`/api/applications/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, note: `Moved to ${newStatus} via pipeline` }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      toast({ variant: 'success', title: 'Status updated', description: `${app.company} → ${newStatus}` });
    } catch (err) {
      fetchApps();
      toast({ variant: 'destructive', title: 'Error', description: (err as Error).message });
    }
  };

  if (loading) return <PageLoading />;

  const columns = PIPELINE_STATUSES;

  return (
    <div className="page-container max-w-[1400px]">
      <div className="page-header mb-2">
        <div>
          <h1>Pipeline</h1>
          <p className="page-subtitle">Drag cards between columns to update status</p>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
        {columns.map((status) => {
          const items = applications.filter((a) => a.status === status);
          const config = STATUS_CONFIG[status];

          return (
            <div
              key={status}
              className="flex w-72 flex-shrink-0 flex-col rounded-2xl border border-border/80 bg-muted/20"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => dragging && handleDrop(dragging, status)}
            >
              <div className="flex items-center gap-2 border-b px-4 py-3">
                <span className={cn('h-2.5 w-2.5 rounded-full', config.dot)} />
                <h3 className="text-sm font-semibold">{status}</h3>
                <span className="ml-auto rounded-full bg-background px-2 py-0.5 text-xs font-medium">
                  {items.length}
                </span>
              </div>

              <div className="flex-1 space-y-2 p-3 min-h-[200px]">
                {items.map((app) => (
                  <div
                    key={app.id}
                    draggable
                    onDragStart={() => setDragging(app.id)}
                    onDragEnd={() => setDragging(null)}
                    className={cn(
                      'cursor-grab rounded-lg border bg-card p-3 shadow-sm transition-all active:cursor-grabbing hover:shadow-md',
                      dragging === app.id && 'opacity-50'
                    )}
                  >
                    <Link href={`/applications/${app.id}`}>
                      <p className="font-medium text-sm hover:text-primary">{app.company}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{app.position}</p>
                      {app.role_type && (
                        <span className="mt-2 inline-block rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                          {app.role_type}
                        </span>
                      )}
                      {app.needs_follow_up && (
                        <p className="mt-1.5 text-[10px] font-medium text-orange-600">Follow-up due</p>
                      )}
                    </Link>
                  </div>
                ))}
                {items.length === 0 && (
                  <p className="py-8 text-center text-xs text-muted-foreground">Drop here</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Closed statuses */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Closed Applications</h2>
        <div className="flex flex-wrap gap-3">
          {(['Rejected', 'No Response', 'Withdrawn'] as ApplicationStatus[]).map((status) => {
            const items = applications.filter((a) => a.status === status);
            if (items.length === 0) return null;
            return (
              <div key={status} className="rounded-lg border px-4 py-2">
                <StatusBadge status={status} />
                <span className="ml-2 text-sm text-muted-foreground">{items.length} applications</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
