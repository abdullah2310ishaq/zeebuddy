import { NextRequest } from 'next/server';
import { REPORT_TYPES } from '@/constants/report-types';
import { apiSuccess } from '@/lib/api-response';

/**
 * GET /api/v1/reports/types
 * Get available report types
 */
export async function GET(request: NextRequest) {
  return apiSuccess(REPORT_TYPES);
}
