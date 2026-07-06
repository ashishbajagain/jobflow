import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { requireAuth } from '@/lib/auth/guards';
import { changeUserPassword } from '@/lib/auth/service';
import { changePasswordSchema } from '@/lib/auth/validators';
import { ensureAppInitialized } from '@/lib/init';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await ensureAppInitialized();

    const auth = await requireAuth(request);
    if ('response' in auth) return auth.response;

    const body = await request.json();
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message || 'Invalid input');
    }

    const result = await changeUserPassword(auth.session.userId, parsed.data);
    if (!result.ok) {
      return errorResponse(result.error, result.status);
    }

    return successResponse({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('POST /api/auth/change-password:', error);
    return errorResponse('Unable to change password right now', 500);
  }
}
