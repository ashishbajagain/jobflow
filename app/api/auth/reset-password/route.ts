import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { resetUserPassword } from '@/lib/auth/service';
import { resetPasswordSchema } from '@/lib/auth/validators';
import { ensureAppInitialized } from '@/lib/init';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  await ensureAppInitialized();

  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message || 'Invalid input');
    }

    const result = await resetUserPassword(parsed.data);
    if (!result.ok) {
      return errorResponse(result.error, result.status);
    }

    return successResponse({ message: 'Password updated successfully. Please sign in.' });
  } catch (error) {
    console.error('POST /api/auth/reset-password:', error);
    return errorResponse('Unable to reset password right now', 500);
  }
}
