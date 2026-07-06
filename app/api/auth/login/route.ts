import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { loginUser } from '@/lib/auth/service';
import { loginSchema } from '@/lib/auth/validators';
import { setSessionCookie } from '@/lib/auth/session';
import { ensureAppInitialized } from '@/lib/init';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  await ensureAppInitialized();

  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message || 'Invalid input');
    }

    const result = await loginUser(parsed.data, {
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      userAgent: request.headers.get('user-agent'),
    });

    if (!result.ok) {
      return errorResponse(result.error, result.status);
    }

    const response = successResponse({ user: result.user });
    setSessionCookie(response, result.token, result.expiresAt);
    return response;
  } catch (error) {
    console.error('POST /api/auth/login:', error);
    return errorResponse('Unable to sign in right now', 500);
  }
}
