'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProtectedLayout } from '@/components/ProtectedLayout';
import { MainLayout } from '@/components/layout/MainLayout';
import { MainContent } from '@/components/layout/MainContent';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileSidebar } from '@/components/layout/MobileSidebar';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { apiFetch } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

type ReportStatus = 'pending' | 'resolved' | 'dismissed';

interface ReportItem {
  id: string;
  targetType: 'post' | 'comment' | 'user';
  targetId: string;
  reportType: string;
  reason: string;
  status: ReportStatus;
  createdAt: string;
  reportedBy?: { name: string; email: string };
  post?: {
    _id: string;
    title: string;
    authorType: 'user' | 'admin';
    authorId?: { name: string; email: string };
    deletedAt?: string | null;
  } | null;
  user?: {
    _id: string;
    name: string;
    email: string;
    deletedAt?: string | null;
  } | null;
}

export default function ReportsPage() {
  const isMobile = useMediaQuery('(max-width: 1024px)');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ReportStatus>('pending');
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [deletePostTitle, setDeletePostTitle] = useState<string>('');
  const [deleting, setDeleting] = useState(false);

  const queryClient = useQueryClient();

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['admin-reports', statusFilter],
    queryFn: async () => {
      const res = await apiFetch<ReportItem[]>(`/admin/reports?status=${statusFilter}`);
      if (!res.success) throw new Error(res.error);
      return res.data ?? [];
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const res = await apiFetch(`/admin/content/posts/${postId}`, { method: 'DELETE' });
      if (!res.success) throw new Error(res.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
    },
  });

  const handleDeletePost = async () => {
    if (!deletePostId) return;
    setDeleting(true);
    try {
      await deletePostMutation.mutateAsync(deletePostId);
      setDeletePostId(null);
      setDeletePostTitle('');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ProtectedLayout>
      <MainLayout>
        {!isMobile && <Sidebar />}
        {isMobile && (
          <MobileSidebar
            isOpen={isMobileSidebarOpen}
            onClose={() => setIsMobileSidebarOpen(false)}
          />
        )}
        <MainContent>
          <div className="flex flex-col h-full">
            <header className="flex items-center justify-between p-6 lg:p-8 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl lg:text-3xl font-bold text-black">Reports</h1>
              </div>
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStatusFilter('pending')}
                    className={cn(
                      'px-4 py-1.5 rounded-full text-sm font-medium',
                      statusFilter === 'pending'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    )}
                  >
                    Pending
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('resolved')}
                    className={cn(
                      'px-4 py-1.5 rounded-full text-sm font-medium',
                      statusFilter === 'resolved'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    )}
                  >
                    Resolved
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('dismissed')}
                    className={cn(
                      'px-4 py-1.5 rounded-full text-sm font-medium',
                      statusFilter === 'dismissed'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    )}
                  >
                    Dismissed
                  </button>
                </div>
              </div>

              <section className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6">
                {isLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : !reports.length ? (
                  <p className="text-gray-500 text-center py-10">
                    No {statusFilter} reports.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {reports.map((r) => {
                      const isPost = r.targetType === 'post';
                      const postDeleted = isPost && r.post && r.post.deletedAt;
                      return (
                        <div
                          key={r.id}
                          className="rounded-xl border border-gray-200 p-4 flex flex-col gap-2"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide">
                              <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                                {r.targetType}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                                {r.reportType}
                              </span>
                            </div>
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded-full text-xs font-medium capitalize',
                                r.status === 'pending'
                                  ? 'bg-amber-100 text-amber-700'
                                  : r.status === 'resolved'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-700'
                              )}
                            >
                              {r.status}
                            </span>
                          </div>

                          <div className="text-sm text-gray-800">
                            {r.reason ? (
                              <p className="line-clamp-2">{r.reason}</p>
                            ) : (
                              <p className="text-gray-500">No additional reason provided.</p>
                            )}
                          </div>

                          <div className="text-xs text-gray-500 flex flex-wrap gap-2">
                            {r.reportedBy && (
                              <span>
                                Reported by {r.reportedBy.name} ({r.reportedBy.email})
                              </span>
                            )}
                            <span>· {new Date(r.createdAt).toLocaleString()}</span>
                          </div>

                          {isPost && r.post && (
                            <div className="mt-2 rounded-lg bg-gray-50 border border-dashed border-gray-200 p-3 text-xs">
                              <p className="font-semibold text-gray-800 line-clamp-1">
                                Post: {r.post.title || '(no title)'}
                              </p>
                              <p className="text-gray-600 mt-1 flex flex-wrap gap-2">
                                <span>Author: {r.post.authorId?.name ?? 'Unknown'}</span>
                                {postDeleted && <span className="text-red-600">· Already deleted</span>}
                              </p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <Link
                                  href={`/post/${r.targetId}`}
                                  target="_blank"
                                  className="px-3 py-1.5 rounded-full border border-gray-300 text-[11px] font-medium text-gray-700 hover:bg-gray-100"
                                >
                                  View post
                                </Link>
                                {!postDeleted && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDeletePostId(r.targetId);
                                      setDeletePostTitle(r.post?.title || '');
                                    }}
                                    className="px-3 py-1.5 rounded-full bg-red-600 text-white text-[11px] font-medium hover:bg-red-700"
                                  >
                                    Delete post
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          </div>
        </MainContent>
      </MainLayout>

      <ConfirmModal
        isOpen={!!deletePostId}
        onClose={() => {
          setDeletePostId(null);
          setDeletePostTitle('');
        }}
        onConfirm={handleDeletePost}
        title="Delete post"
        message={
          deletePostTitle
            ? `Are you sure you want to delete the post "${deletePostTitle}"? This will hide it from the user app.`
            : 'Are you sure you want to delete this post?'
        }
        confirmLabel="Delete"
        isLoading={deleting}
      />
    </ProtectedLayout>
  );
}

