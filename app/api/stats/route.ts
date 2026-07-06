import { NextRequest } from 'next/server';
import { getApplicationStats } from '@/lib/db';
import { successResponse, handleApiError } from '@/lib/api-utils';
import { requireAuth } from '@/lib/auth/guards';
import { ensureAppInitialized } from '@/lib/init';
import { ensureUserApplicationsSeeded } from '@/lib/auth/seed';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  await ensureAppInitialized();

  const auth = await requireAuth(request);
  if ('response' in auth) return auth.response;

  ensureUserApplicationsSeeded(auth.session.userId);

  try {
    const stats = getApplicationStats(auth.session.userId);
    return successResponse(stats);
  } catch (error) {
    return handleApiError(error, 'GET /api/stats');
  }
}
