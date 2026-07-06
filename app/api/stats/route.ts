import { getApplicationStats, seedDatabase } from '@/lib/db';
import { successResponse, handleApiError } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

seedDatabase();

export async function GET() {
  try {
    const stats = getApplicationStats();
    return successResponse(stats);
  } catch (error) {
    return handleApiError(error, 'GET /api/stats');
  }
}
