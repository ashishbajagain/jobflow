'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { StatusBadge } from '@/components/status-badge';
import { toast } from '@/components/ui/use-toast';
import { APPLICATION_STATUSES } from '@/lib/constants';
import type { Application, ApplicationStatus } from '@/lib/types';

interface DeleteApplicationButtonProps {
  id: number;
  company: string;
  redirectTo?: string;
  onDeleted?: () => void;
  showLabel?: boolean;
}

export function DeleteApplicationButton({
  id,
  company,
  redirectTo,
  onDeleted,
  showLabel = false,
}: DeleteApplicationButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/applications/${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      toast({ variant: 'success', title: 'Deleted', description: `${company} removed.` });

      if (redirectTo) router.push(redirectTo);
      else if (onDeleted) onDeleted();
      else router.refresh();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant={showLabel ? 'outline' : 'ghost'}
          size="sm"
          disabled={loading}
          className={showLabel ? 'gap-1.5 rounded-xl text-destructive hover:bg-destructive/5 hover:text-destructive' : 'text-destructive hover:text-destructive'}
        >
          <Trash2 className="h-4 w-4" />
          {showLabel && 'Delete'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete application?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete <strong>{company}</strong> and its timeline.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function EditApplicationButton({ id }: { id: number }) {
  const router = useRouter();
  return (
    <Button variant="ghost" size="sm" onClick={() => router.push(`/applications/${id}?edit=true`)}>
      <Pencil className="h-4 w-4" />
    </Button>
  );
}

export function QuickStatusSelect({
  app,
  onUpdated,
}: {
  app: Application;
  onUpdated: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleChange = async (status: ApplicationStatus) => {
    if (status === app.status) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/applications/${app.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note: `Quick update to ${status}` }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      toast({ variant: 'success', title: 'Status updated', description: `${app.company} → ${status}` });
      onUpdated();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Select value={app.status} onValueChange={handleChange} disabled={loading}>
      <SelectTrigger className="h-8 w-[130px] border-0 bg-transparent p-0 shadow-none">
        <StatusBadge status={app.status} />
      </SelectTrigger>
      <SelectContent>
        {APPLICATION_STATUSES.map((s) => (
          <SelectItem key={s} value={s}>{s}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
