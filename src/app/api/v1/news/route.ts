import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { Post, Like } from '@/models';
import { apiSuccess, apiError } from '@/lib/api-response';
import { getAuthUser } from '@/lib/auth';
import { Types } from 'mongoose';

interface PopulatedAuthor {
  _id: Types.ObjectId;
  name: string;
  avatarUrl?: string;
}

interface PostWithAuthor {
  _id: Types.ObjectId;
  authorId?: PopulatedAuthor | Types.ObjectId;
  authorType?: 'user' | 'admin';
}

/**
 * GET /api/v1/news
 * News feed for user app - approved/published posts only, paginated
 * Query: limit, offset, categoryId
 * When authenticated: adds userLiked per post. Populates author (id, name, avatarUrl) for each post.
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));
    const categoryId = searchParams.get('categoryId');

    const currentUser = await getAuthUser(request.headers.get('Authorization'));

    const query: Record<string, unknown> = {
      status: { $in: ['published', 'approved'] },
      deletedAt: null,
    };

    if (categoryId && Types.ObjectId.isValid(categoryId)) {
      query.categoryId = new Types.ObjectId(categoryId);
    }

    const [posts, total] = await Promise.all([
      Post.find(query)
        .populate('categoryId', 'name slug')
        .populate('authorId', '_id name avatarUrl')
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      Post.countDocuments(query),
    ]);

    const postIds = (posts as PostWithAuthor[]).map((p) => p._id);
    let likedPostIds = new Set<string>();
    if (currentUser && postIds.length > 0) {
      const likes = await Like.find({
        targetType: 'post',
        targetId: { $in: postIds },
        userId: currentUser._id,
      })
        .select('targetId')
        .lean();
      likedPostIds = new Set(likes.map((l) => String(l.targetId)));
    }

    const data = (posts as PostWithAuthor[]).map((post) => {
      const authorDoc = post.authorId as PopulatedAuthor | undefined;
      const author =
        authorDoc && typeof authorDoc === 'object' && 'name' in authorDoc
          ? {
              id: String(authorDoc._id),
              name: authorDoc.name,
              avatarUrl: authorDoc.avatarUrl,
            }
          : undefined;

      const out: Record<string, unknown> = {
        ...post,
        author,
      };
      delete out.authorId;

      if (currentUser) {
        out.userLiked = likedPostIds.has(String(post._id));
      } else {
        out.userLiked = false;
      }

      return out;
    });

    return apiSuccess({
      data,
      total,
      limit,
      offset,
    });
  } catch (err) {
    console.error('News feed error:', err);
    return apiError('Failed to fetch news', 'SERVER_ERROR', 500);
  }
}
