'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedLayout } from '@/components/ProtectedLayout';
import { MainLayout } from '@/components/layout/MainLayout';
import { MainContent } from '@/components/layout/MainContent';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileSidebar } from '@/components/layout/MobileSidebar';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { apiFetch } from '@/lib/api-client';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface Post {
  _id: string;
  title: string;
  content: string;
  status: string;
  createdAt: string;
  scheduledAt?: string;
  categoryId?: { name: string };
  media: { url: string; type: string }[];
}

function formatDate(d: string) {
  return new Date(d).toLocaleString('en-US');
}

export default function NewsDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const isMobile = useMediaQuery('(max-width: 1024px)');
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    apiFetch<Post>(`/admin/content/posts/${id}`).then((res) => {
      if (res.success && res.data) setPost(res.data);
      setLoading(false);
    });
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await apiFetch(`/admin/content/posts/${id}`, { method: 'DELETE' });
      if (res.success) {
        router.push('/content-management/all');
      } else throw new Error(res.error);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <ProtectedLayout>
        <MainLayout>
          <MainContent>
            <div className="flex justify-center py-20">
              <div className="animate-spin w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full" />
            </div>
          </MainContent>
        </MainLayout>
      </ProtectedLayout>
    );
  }

  if (!post) {
    return (
      <ProtectedLayout>
        <MainLayout>
          <MainContent>
            <div className="p-8 text-center">
              <p className="text-gray-500 mb-4">Post not found</p>
              <Link href="/content-management" className="text-red-600">Back to Content Management</Link>
            </div>
          </MainContent>
        </MainLayout>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout>
      <MainLayout>
        {!isMobile && <Sidebar />}
        <MobileSidebar isOpen={false} onClose={() => {}} />

        <MainContent>
          <div className="flex flex-col h-full">
            <header className="flex items-center justify-between p-6 lg:p-8 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <Link href="/content-management/all" className="text-gray-600 hover:text-gray-900">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Link>
                <h1 className="text-2xl font-bold text-black">News Detail</h1>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/content-management/news/${id}/edit`}
                  className="px-4 py-2 rounded-lg border-2 border-black text-black font-medium hover:bg-gray-50"
                >
                  Edit
                </Link>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 lg:p-8">
              <article className="max-w-3xl">
                <h2 className="text-2xl font-bold text-black mb-4">{post.title}</h2>
                <div className="flex gap-3 text-sm text-gray-600 mb-6">
                  <span>{formatDate(post.createdAt)}</span>
                  {post.categoryId && (
                    <span>· {(post.categoryId as { name: string }).name}</span>
                  )}
                  <span className={post.status === 'published' ? 'text-green-600' : 'text-amber-600'}>
                    {post.status}
                  </span>
                </div>

                {post.media?.length ? (
                  <div className="mb-6 space-y-4">
                    {post.media.map((m, i) =>
                      m.type === 'video' ? (
                        <video key={i} src={m.url} controls className="w-full rounded-lg" />
                      ) : (
                        <img key={i} src={m.url} alt="" className="w-full rounded-lg" />
                      )
                    )}
                  </div>
                ) : null}

                <div className="prose text-gray-900 whitespace-pre-wrap">{post.content || 'No content'}</div>
              </article>
            </div>
          </div>
        </MainContent>
      </MainLayout>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete news"
        message={`Are you sure you want to delete "${post.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isLoading={deleting}
      />
    </ProtectedLayout>
  );
}
