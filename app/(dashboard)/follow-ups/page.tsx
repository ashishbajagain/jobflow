'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FollowUpList } from '@/components/application-card';
import { PageLoading } from '@/components/skeleton';
import { toast } from '@/components/ui/use-toast';
import type { Application } from '@/lib/types';

export default function FollowUpsPage() {
  const [followUps, setFollowUps] = useState<Application[]>([]);
  const [stale, setStale] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/applications?needs_follow_up=true').then((r) => r.json()),
      fetch('/api/applications?status=Applied&sortBy=date_applied&sortOrder=asc').then((r) => r.json()),
    ])
      .then(([followUpResult, appliedResult]) => {
        if (!followUpResult.success) throw new Error(followUpResult.error);
        setFollowUps(followUpResult.data);
        if (appliedResult.success) {
          setStale(appliedResult.data.filter((a: Application) => a.is_stale));
        }
      })
      .catch((err) =>
        toast({ variant: 'destructive', title: 'Error', description: err.message })
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoading />;

  return (
    <div className="page-container max-w-3xl">
      <div className="page-header mb-2">
        <div>
          <h1>Follow-ups</h1>
          <p className="page-subtitle">Applications that need your attention</p>
        </div>
      </div>

      <Card className="surface-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4 text-orange-500" />
            Due Now ({followUps.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {followUps.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <CheckCircle2 className="mb-3 h-10 w-10 text-emerald-500" />
              <p className="font-medium">All caught up!</p>
              <p className="text-sm text-muted-foreground">No follow-ups due right now.</p>
            </div>
          ) : (
            <FollowUpList applications={followUps} />
          )}
        </CardContent>
      </Card>

      {stale.length > 0 && (
        <Card className="border-amber-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-amber-800">
              <AlertTriangle className="h-4 w-4" />
              Likely Ghosted — Consider Updating ({stale.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              These applications have been in &quot;Applied&quot; status for 21+ days with no contact.
              Industry data suggests marking them as &quot;No Response&quot; to keep your pipeline clean.
            </p>
            {stale.map((app) => (
              <div key={app.id} className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">{app.company}</p>
                  <p className="text-sm text-muted-foreground">
                    Applied {app.days_since_applied} days ago · {app.position}
                  </p>
                </div>
                <Link href={`/applications/${app.id}?edit=true`}>
                  <Button variant="outline" size="sm">Update Status</Button>
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="surface-card">
        <CardHeader>
          <CardTitle className="text-base">Follow-up Best Practices</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p><strong className="text-foreground">Day 5–7:</strong> Send first follow-up after applying if no response.</p>
          <p><strong className="text-foreground">Day 14:</strong> Send a second, brief follow-up.</p>
          <p><strong className="text-foreground">Day 21+:</strong> Mark as &quot;No Response&quot; and move on.</p>
          <p><strong className="text-foreground">Post-interview:</strong> Send thank-you email within 24 hours.</p>
        </CardContent>
      </Card>
    </div>
  );
}
