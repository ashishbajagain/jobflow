import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { getAuthSession } from '@/lib/auth/session';
import { sessionToPublicUser } from '@/lib/auth/service';
import { ensureAppInitialized } from '@/lib/init';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  await ensureAppInitialized();

  const session = await getAuthSession(request);
  if (!session) {
    return errorResponse('Unauthorized', 401);
  }

  return successResponse({ user: sessionToPublicUser(session) });
}
