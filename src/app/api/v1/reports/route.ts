import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { Report, Post, Comment, User } from '@/models';
import { requireUser } from '@/lib/auth';
import { REPORT_TYPES } from '@/constants/report-types';
import { apiSuccess, apiError, apiUnauthorized, apiNotFound } from '@/lib/api-response';
import mongoose from 'mongoose';

/**
 * POST /api/v1/reports
 * Report content. Body: { targetType: 'post'|'comment'|'user', targetId: string, reportType: string, reason?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request.headers.get('Authorization'));
    if (!user) return apiUnauthorized();

    const body = await request.json();
    const { targetType, targetId, reportType, reason = '' } = body;

    if (!targetType || !['post', 'comment', 'user'].includes(targetType)) {
      return apiError('targetType must be post, comment, or user', 'VALIDATION_ERROR', 400);
    }

    if (!targetId || !mongoose.Types.ObjectId.isValid(targetId)) {
      return apiError('Valid targetId is required', 'VALIDATION_ERROR', 400);
    }

    const validTypes = REPORT_TYPES.map((t) => t.id);
    if (!reportType || !validTypes.includes(reportType)) {
      return apiError(`reportType must be one of: ${validTypes.join(', ')}`, 'VALIDATION_ERROR', 400);
    }

    await connectDB();

    if (targetType === 'post') {
      const exists = await Post.findOne({ _id: targetId, deletedAt: null });
      if (!exists) return apiNotFound('Post not found');
    } else if (targetType === 'comment') {
      const exists = await Comment.findOne({ _id: targetId, deletedAt: null });
      if (!exists) return apiNotFound('Comment not found');
    } else {
      const exists = await User.findOne({ _id: targetId, deletedAt: null });
      if (!exists) return apiNotFound('User not found');
    }

    const report = await Report.create({
      targetType,
      targetId,
      reportedBy: user._id,
      reportType,
      reason: String(reason).trim(),
    });

    return apiSuccess(
      { id: report._id, targetType, targetId, reportType, status: 'pending' },
      'Report submitted',
      201
    );
  } catch (err) {
    console.error('Report error:', err);
    return apiError('Failed to submit report', 'SERVER_ERROR', 500);
  }
}
