import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { requestPasswordReset } from '@/lib/auth/service';
import { forgotPasswordSchema } from '@/lib/auth/validators';
import { ensureAppInitialized } from '@/lib/init';

export const dynamic = 'force-dynamic';

function getAppUrl(request: NextRequest): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') || 'http';
  return `${proto}://${host}`;
}

export async function POST(request: NextRequest) {
  await ensureAppInitialized();

  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message || 'Invalid input');
    }

    const result = await requestPasswordReset(parsed.data, getAppUrl(request));
    return successResponse({ message: result.message });
  } catch (error) {
    console.error('POST /api/auth/forgot-password:', error);
    return errorResponse('Unable to process request right now', 500);
  }
}
