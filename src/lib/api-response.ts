import { NextResponse } from 'next/server';

export function apiSuccess<T>(data: T, message?: string, status = 200) {
  return NextResponse.json(
    { success: true, data, message: message ?? undefined },
    { status }
  );
}

export function apiError(message: string, code?: string, status = 400) {
  return NextResponse.json(
    { success: false, error: message, code: code ?? undefined },
    { status }
  );
}

export function apiUnauthorized(message = 'Unauthorized') {
  return apiError(message, 'UNAUTHORIZED', 401);
}

export function apiForbidden(message = 'Forbidden') {
  return apiError(message, 'FORBIDDEN', 403);
}

export function apiNotFound(message = 'Not found') {
  return apiError(message, 'NOT_FOUND', 404);
}

export function apiServerError(message = 'Internal server error') {
  return apiError(message, 'SERVER_ERROR', 500);
}
