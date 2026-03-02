import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { Report, Post, User } from '@/models';
import { requireAdmin } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-response';

/**
 * GET /api/v1/admin/reports
 * List reports for admin review.
 * Optional query: status (pending|resolved|dismissed, default: pending)
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request.headers.get('Authorization'));
    if (!admin) return apiUnauthorized();

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';

    const reports = await Report.find({ status })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('reportedBy', 'name email')
      .lean();

    // Load basic target info for posts and users
    const postIds = reports
      .filter((r) => r.targetType === 'post')
      .map((r) => r.targetId);
    const userIds = reports
      .filter((r) => r.targetType === 'user')
      .map((r) => r.targetId);

    const [posts, users] = await Promise.all([
      postIds.length
        ? Post.find({ _id: { $in: postIds } })
            .select('title authorType authorId deletedAt')
            .populate('authorId', 'name email')
            .lean()
        : [],
      userIds.length
        ? User.find({ _id: { $in: userIds } })
            .select('name email deletedAt')
            .lean()
        : [],
    ]);

    const postMap = new Map<string, unknown>();
    posts.forEach((p) => postMap.set(String(p._id), p));
    const userMap = new Map<string, unknown>();
    users.forEach((u) => userMap.set(String(u._id), u));

    return apiSuccess(
      reports.map((r) => ({
        id: String(r._id),
        targetType: r.targetType,
        targetId: String(r.targetId),
        reportType: r.reportType,
        reason: r.reason,
        status: r.status,
        createdAt: r.createdAt,
        reportedBy: (r as unknown as { reportedBy?: { name: string; email: string } }).reportedBy,
        post:
          r.targetType === 'post'
            ? postMap.get(String(r.targetId)) ?? null
            : null,
        user:
          r.targetType === 'user'
            ? userMap.get(String(r.targetId)) ?? null
            : null,
      }))
    );
  } catch (err) {
    console.error('Admin reports list error:', err);
    return apiError('Failed to fetch reports', 'SERVER_ERROR', 500);
  }
}

