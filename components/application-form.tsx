'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import {
  APPLICATION_STATUSES,
  JOB_SOURCES,
  WORK_TYPES,
  ROLE_TYPES,
  PRIORITIES,
  STATUS_CONFIG,
  type ApplicationStatus,
} from '@/lib/constants';
import type { Application } from '@/lib/types';

interface ApplicationFormProps {
  application?: Application;
  mode?: 'create' | 'edit';
  onSuccess?: () => void;
}

export function ApplicationForm({
  application,
  mode = 'create',
  onSuccess,
}: ApplicationFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    company: application?.company || '',
    position: application?.position || '',
    date_applied: application?.date_applied || new Date().toISOString().split('T')[0],
    status: (application?.status || 'Applied') as ApplicationStatus,
    job_url: application?.job_url || '',
    notes: application?.notes || '',
    source: application?.source || '',
    location: application?.location || '',
    work_type: application?.work_type || '',
    role_type: application?.role_type || '',
    salary_min: application?.salary_min?.toString() || '',
    salary_max: application?.salary_max?.toString() || '',
    follow_up_date: application?.follow_up_date || '',
    last_contact_date: application?.last_contact_date || '',
    priority: application?.priority || 'Medium',
    contact_name: application?.contact_name || '',
    contact_email: application?.contact_email || '',
    next_action: application?.next_action || '',
    status_note: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url =
        mode === 'edit' && application
          ? `/api/applications/${application.id}`
          : '/api/applications';
      const method = mode === 'edit' ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        job_url: formData.job_url || null,
        notes: formData.notes || null,
        source: formData.source || null,
        location: formData.location || null,
        work_type: formData.work_type || null,
        role_type: formData.role_type || null,
        salary_min: formData.salary_min ? Number(formData.salary_min) : null,
        salary_max: formData.salary_max ? Number(formData.salary_max) : null,
        follow_up_date: formData.follow_up_date || null,
        last_contact_date: formData.last_contact_date || null,
        contact_name: formData.contact_name || null,
        contact_email: formData.contact_email || null,
        next_action: formData.next_action || null,
        ...(mode === 'edit' && formData.status_note ? { status_note: formData.status_note } : {}),
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Something went wrong');

      toast({
        variant: 'success',
        title: mode === 'edit' ? 'Application updated' : 'Application added',
        description: `${formData.company} — ${formData.position}`,
      });

      if (onSuccess) {
        onSuccess();
      } else if (mode === 'create') {
        router.push(`/applications/${result.data.id}`);
      } else {
        router.refresh();
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save application',
      });
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="surface-card">
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
          <CardDescription>Basic information about the role</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company">Company *</Label>
              <Input id="company" value={formData.company} onChange={(e) => update('company', e.target.value)} placeholder="e.g. Atlassian" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Position *</Label>
              <Input id="position" value={formData.position} onChange={(e) => update('position', e.target.value)} placeholder="e.g. Full Stack Developer" required />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="role_type">Role Type</Label>
              <Select value={formData.role_type} onValueChange={(v) => update('role_type', v)}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  {ROLE_TYPES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Select value={formData.source} onValueChange={(v) => update('source', v)}>
                <SelectTrigger><SelectValue placeholder="Where found" /></SelectTrigger>
                <SelectContent>
                  {JOB_SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="work_type">Work Type</Label>
              <Select value={formData.work_type} onValueChange={(v) => update('work_type', v)}>
                <SelectTrigger><SelectValue placeholder="Remote/Hybrid/On-site" /></SelectTrigger>
                <SelectContent>
                  {WORK_TYPES.map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" value={formData.location} onChange={(e) => update('location', e.target.value)} placeholder="e.g. Sydney, NSW" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job_url">Job URL</Label>
              <Input id="job_url" type="url" value={formData.job_url} onChange={(e) => update('job_url', e.target.value)} placeholder="https://..." />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="salary_min">Salary Min (AUD)</Label>
              <Input id="salary_min" type="number" value={formData.salary_min} onChange={(e) => update('salary_min', e.target.value)} placeholder="100000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salary_max">Salary Max (AUD)</Label>
              <Input id="salary_max" type="number" value={formData.salary_max} onChange={(e) => update('salary_max', e.target.value)} placeholder="150000" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="surface-card">
        <CardHeader>
          <CardTitle>Application Status</CardTitle>
          <CardDescription>Track where you are in the process</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="date_applied">Date Applied *</Label>
              <Input id="date_applied" type="date" value={formData.date_applied} onChange={(e) => update('date_applied', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={formData.status} onValueChange={(v) => update('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {APPLICATION_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      <span className="flex items-center gap-2">
                        {STATUS_CONFIG[s].label}
                        <span className="text-xs text-muted-foreground">— {STATUS_CONFIG[s].description}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(v) => update('priority', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {mode === 'edit' && (
            <div className="space-y-2">
              <Label htmlFor="status_note">Status Change Note</Label>
              <Input id="status_note" value={formData.status_note} onChange={(e) => update('status_note', e.target.value)} placeholder="Optional note for status change timeline" />
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="surface-card">
        <CardHeader>
          <CardTitle>Follow-up & Contacts</CardTitle>
          <CardDescription>Stay on top of next actions and recruiter contacts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="follow_up_date">Follow-up Date</Label>
              <Input id="follow_up_date" type="date" value={formData.follow_up_date} onChange={(e) => update('follow_up_date', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_contact_date">Last Contact Date</Label>
              <Input id="last_contact_date" type="date" value={formData.last_contact_date} onChange={(e) => update('last_contact_date', e.target.value)} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contact_name">Contact Name</Label>
              <Input id="contact_name" value={formData.contact_name} onChange={(e) => update('contact_name', e.target.value)} placeholder="Recruiter name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_email">Contact Email</Label>
              <Input id="contact_email" type="email" value={formData.contact_email} onChange={(e) => update('contact_email', e.target.value)} placeholder="recruiter@company.com" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="next_action">Next Action</Label>
            <Input id="next_action" value={formData.next_action} onChange={(e) => update('next_action', e.target.value)} placeholder="e.g. Send follow-up email, prep for interview" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={formData.notes} onChange={(e) => update('notes', e.target.value)} placeholder="Interview prep, feedback, salary details..." rows={4} />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading} className="btn-brand">
          {loading ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Add Application'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading} className="rounded-xl">
          Cancel
        </Button>
      </div>
    </form>
  );
}
