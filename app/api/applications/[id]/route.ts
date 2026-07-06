import { NextRequest } from 'next/server';
import {
  getApplicationById,
  updateApplication,
  deleteApplication,
  updateApplicationStatus,
} from '@/lib/db';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { validateUpdateApplication, parseApplicationId } from '@/lib/validators';
import type { ApplicationStatus } from '@/lib/constants';
import type { UpdateApplicationInput } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseApplicationId(params.id);
    if (!id) return errorResponse('Invalid application ID');

    const application = getApplicationById(id);
    if (!application) return errorResponse('Application not found', 404);

    return successResponse(application);
  } catch (error) {
    return handleApiError(error, `GET /api/applications/${params.id}`);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseApplicationId(params.id);
    if (!id) return errorResponse('Invalid application ID');

    const body = await request.json();
    const validation = validateUpdateApplication(body);

    if (!validation.valid || !validation.data) {
      return errorResponse(validation.error || 'Invalid input');
    }

    const application = updateApplication(id, validation.data as unknown as UpdateApplicationInput);
    if (!application) return errorResponse('Application not found', 404);

    return successResponse(application);
  } catch (error) {
    return handleApiError(error, `PUT /api/applications/${params.id}`);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseApplicationId(params.id);
    if (!id) return errorResponse('Invalid application ID');

    const body = await request.json();
    if (!body.status) return errorResponse('Status is required for quick update');

    const application = updateApplicationStatus(id, body.status as ApplicationStatus, body.note);
    if (!application) return errorResponse('Application not found', 404);

    return successResponse(application);
  } catch (error) {
    return handleApiError(error, `PATCH /api/applications/${params.id}`);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseApplicationId(params.id);
    if (!id) return errorResponse('Invalid application ID');

    const deleted = deleteApplication(id);
    if (!deleted) return errorResponse('Application not found', 404);

    return successResponse({ message: 'Application deleted successfully' });
  } catch (error) {
    return handleApiError(error, `DELETE /api/applications/${params.id}`);
  }
}
