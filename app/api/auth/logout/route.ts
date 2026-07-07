import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/api-utils';
import { logoutUser } from '@/lib/auth/service';
import { clearSessionCookie, getSessionTokenFromRequest } from '@/lib/auth/cookies';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const token = getSessionTokenFromRequest(request);
  await logoutUser(token);

  const response = successResponse({ message: 'Signed out successfully' });
  clearSessionCookie(response);
  return response;
}
