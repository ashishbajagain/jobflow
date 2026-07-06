import { NextRequest } from 'next/server';
import { errorResponse } from '../api-utils';
import { getAuthSession } from './session';
import type { AuthSession } from './types';

export async function requireAuth(
  request: NextRequest
): Promise<{ session: AuthSession } | { response: ReturnType<typeof errorResponse> }> {
  const session = await getAuthSession(request);
  if (!session) {
    return { response: errorResponse('Unauthorized', 401) };
  }
  return { session };
}

export async function requireAuthUserId(request: NextRequest): Promise<number | Response> {
  const result = await requireAuth(request);
  if ('response' in result) {
    return result.response;
  }
  return result.session.userId;
}
