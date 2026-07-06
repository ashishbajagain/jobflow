import { NextRequest } from 'next/server';
import { getAllApplications, getApplicationsCount, createApplication } from '@/lib/db';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { validateCreateApplication } from '@/lib/validators';
import { PAGE_SIZE } from '@/lib/constants';
import { requireAuth } from '@/lib/auth/guards';
import { ensureAppInitialized } from '@/lib/init';
import { ensureUserApplicationsSeeded } from '@/lib/auth/seed';
import type { ApplicationQuery, CreateApplicationInput } from '@/lib/types';
import type { ApplicationStatus, JobSource, Priority, RoleType, WorkType } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  await ensureAppInitialized();

  const auth = await requireAuth(request);
  if ('response' in auth) return auth.response;

  ensureUserApplicationsSeeded(auth.session.userId);

  try {
    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get('page');
    const usePagination = pageParam !== null;
    const page = Math.max(1, parseInt(pageParam || '1', 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || String(PAGE_SIZE), 10)));

    const filters: ApplicationQuery = {
      userId: auth.session.userId,
      sortBy: (searchParams.get('sortBy') as ApplicationQuery['sortBy']) || 'date_applied',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
      status: (searchParams.get('status') as ApplicationStatus) || undefined,
      role_type: (searchParams.get('role_type') as RoleType) || undefined,
      source: (searchParams.get('source') as JobSource) || undefined,
      work_type: (searchParams.get('work_type') as WorkType) || undefined,
      priority: (searchParams.get('priority') as Priority) || undefined,
      search: searchParams.get('search') || undefined,
      active_only: searchParams.get('active_only') === 'true',
      needs_follow_up: searchParams.get('needs_follow_up') === 'true',
    };

    const total = getApplicationsCount(filters);

    if (!usePagination) {
      const applications = getAllApplications(filters);
      return successResponse(applications);
    }

    const applications = getAllApplications({
      ...filters,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    return successResponse({
      items: applications,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      hasMore: page * pageSize < total,
    });
  } catch (error) {
    return handleApiError(error, 'GET /api/applications');
  }
}

export async function POST(request: NextRequest) {
  await ensureAppInitialized();

  const auth = await requireAuth(request);
  if ('response' in auth) return auth.response;

  ensureUserApplicationsSeeded(auth.session.userId);

  try {
    const body = await request.json();
    const validation = validateCreateApplication(body);

    if (!validation.valid || !validation.data) {
      return errorResponse(validation.error || 'Invalid input');
    }

    const application = createApplication(
      validation.data as unknown as CreateApplicationInput,
      auth.session.userId
    );
    return successResponse(application, 201);
  } catch (error) {
    return handleApiError(error, 'POST /api/applications');
  }
}
