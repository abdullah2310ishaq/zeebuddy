'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Post {
  _id: string;
  title: string;
  content: string;
  status: string;
  createdAt: string;
  categoryId?: { name: string; slug?: string };
  media: { url: string; type: string }[];
  authorType?: 'user' | 'admin';
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Public user-generated / news post detail page (website).
 * Fetches from public API GET /api/v1/news/:id (published or approved posts only).
 */
export default function PublicPostDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    fetch(`/api/v1/news/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setPost(json.data);
          setError(null);
        } else {
          setError(json.error || 'Post not found');
        }
      })
      .catch(() => setError('Failed to load post'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <p className="text-gray-600 mb-4">{error ?? 'Post not found'}</p>
        <Link href="/" className="text-red-600 font-medium hover:underline">
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 py-4 px-4 lg:px-8">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Link
            href="/"
            className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
          {post.categoryId && (
            <span className="text-sm text-gray-500">· {(post.categoryId as { name: string }).name}</span>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto py-8 px-4 lg:px-8">
        <article className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 lg:p-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">{post.title}</h1>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mb-6">
              <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
              {post.categoryId && (
                <span>{(post.categoryId as { name: string }).name}</span>
              )}
              {post.authorType === 'user' && (
                <span className="text-gray-400">User post</span>
              )}
            </div>

            {post.media?.length ? (
              <div className="mb-6 space-y-4">
                {post.media.map((m, i) =>
                  m.type === 'video' ? (
                    <video
                      key={i}
                      src={m.url}
                      controls
                      className="w-full rounded-lg bg-gray-100"
                    />
                  ) : (
                    <img
                      key={i}
                      src={m.url}
                      alt=""
                      className="w-full rounded-lg object-cover"
                    />
                  )
                )}
              </div>
            ) : null}

            <div className="prose prose-gray max-w-none text-gray-700 whitespace-pre-wrap">
              {post.content || 'No content.'}
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}
