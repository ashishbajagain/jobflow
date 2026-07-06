'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Plus, Search, ArrowUpDown, LayoutGrid, List, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ApplicationCard } from '@/components/application-card';
import {
  DeleteApplicationButton,
  EditApplicationButton,
  QuickStatusSelect,
} from '@/components/delete-application-button';
import { TableSkeleton } from '@/components/skeleton';
import { toast } from '@/components/ui/use-toast';
import { formatDate } from '@/lib/utils';
import { PAGE_SIZE, APPLICATION_STATUSES, ROLE_TYPES, JOB_SOURCES } from '@/lib/constants';
import type { ApplicationStatus, RoleType, JobSource } from '@/lib/constants';
import type { Application } from '@/lib/types';

type SortField = 'date_applied' | 'company' | 'status' | 'updated_at';
type ViewMode = 'table' | 'cards';

interface PaginatedResponse {
  items: Application[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

function ApplicationsContent() {
  const searchParams = useSearchParams();
  const [applications, setApplications] = useState<Application[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('date_applied');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>(
    (searchParams.get('status') as ApplicationStatus) || 'all'
  );
  const [roleFilter, setRoleFilter] = useState<RoleType | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<JobSource | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, roleFilter, sourceFilter, sortBy, sortOrder]);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
        sortBy,
        sortOrder,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(roleFilter !== 'all' && { role_type: roleFilter }),
        ...(sourceFilter !== 'all' && { source: sourceFilter }),
        ...(debouncedSearch && { search: debouncedSearch }),
      });
      const response = await fetch(`/api/applications?${params}`);
      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      const data = result.data as PaginatedResponse;
      setApplications(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load',
      });
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, sortOrder, statusFilter, roleFilter, sourceFilter, debouncedSearch]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const toggleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortOrder('desc'); }
  };

  const startItem = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Applications</h1>
          <p className="page-subtitle">
            {total} application{total !== 1 ? 's' : ''} tracked
          </p>
        </div>
        <Link href="/applications/new">
          <Button className="btn-brand gap-2">
            <Plus className="h-4 w-4" /> New Application
          </Button>
        </Link>
      </div>

      <Card className="surface-card overflow-hidden">
        <CardHeader className="space-y-4 border-b border-border/60 bg-muted/30 px-6 py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search company, position, notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-xl border-border/80 bg-card pl-10"
              />
            </div>
            <div className="flex gap-1.5 rounded-xl border border-border/80 bg-card p-1">
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                className={viewMode === 'table' ? 'rounded-lg bg-primary hover:bg-primary/90' : 'rounded-lg'}
                onClick={() => setViewMode('table')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                size="sm"
                className={viewMode === 'cards' ? 'rounded-lg bg-primary hover:bg-primary/90' : 'rounded-lg'}
                onClick={() => setViewMode('cards')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ApplicationStatus | 'all')}>
              <SelectTrigger className="w-[148px] rounded-xl"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {APPLICATION_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as RoleType | 'all')}>
              <SelectTrigger className="w-[148px] rounded-xl"><SelectValue placeholder="Role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {ROLE_TYPES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v as JobSource | 'all')}>
              <SelectTrigger className="w-[148px] rounded-xl"><SelectValue placeholder="Source" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {JOB_SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-6"><TableSkeleton /></div>
          ) : applications.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <p className="text-muted-foreground">No applications match your filters.</p>
              <Link href="/applications/new">
                <Button className="mt-5 rounded-xl">Add your first application</Button>
              </Link>
            </div>
          ) : viewMode === 'cards' ? (
            <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
              {applications.map((app) => <ApplicationCard key={app.id} app={app} />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/20 text-left">
                    <th className="px-6 py-4">
                      <button onClick={() => toggleSort('company')} className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground">
                        Company <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="hidden px-6 py-4 md:table-cell">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Role</span>
                    </th>
                    <th className="hidden px-6 py-4 lg:table-cell">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Source</span>
                    </th>
                    <th className="px-6 py-4">
                      <button onClick={() => toggleSort('date_applied')} className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground">
                        Applied <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-6 py-4">
                      <button onClick={() => toggleSort('status')} className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground">
                        Status <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-6 py-4 text-right">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id} className="border-b border-border/40 last:border-0 transition-colors hover:bg-muted/20">
                      <td className="px-6 py-5 align-top">
                        <div className="flex flex-col gap-2.5">
                          <Link href={`/applications/${app.id}`} className="link-brand text-[15px] leading-snug">
                            {app.company}
                          </Link>
                          {app.is_stale && (
                            <span className="inline-flex w-fit items-center rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700">
                              {app.days_since_applied}d no response
                            </span>
                          )}
                          <p className="text-sm leading-relaxed text-muted-foreground md:hidden">{app.position}</p>
                        </div>
                      </td>
                      <td className="hidden px-6 py-5 align-top md:table-cell">
                        <p className="font-medium leading-snug text-foreground">{app.position}</p>
                        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{app.role_type} · {app.location || '—'}</p>
                      </td>
                      <td className="hidden px-6 py-5 align-top text-muted-foreground lg:table-cell">{app.source || '—'}</td>
                      <td className="px-6 py-5 align-top text-muted-foreground">{formatDate(app.date_applied)}</td>
                      <td className="px-6 py-5 align-top">
                        <QuickStatusSelect app={app} onUpdated={fetchApplications} />
                      </td>
                      <td className="px-6 py-5 align-top">
                        <div className="flex justify-end gap-1">
                          <EditApplicationButton id={app.id} />
                          <DeleteApplicationButton id={app.id} company={app.company} onDeleted={fetchApplications} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {total > 0 && (
            <div className="flex flex-col items-center justify-between gap-4 border-t border-border/60 px-6 py-4 sm:flex-row">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-medium text-foreground">{startItem}–{endItem}</span> of{' '}
                <span className="font-medium text-foreground">{total}</span>
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="px-2 text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ApplicationsPage() {
  return (
    <Suspense fallback={<div className="page-container"><TableSkeleton /></div>}>
      <ApplicationsContent />
    </Suspense>
  );
}
