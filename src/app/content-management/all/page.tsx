'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProtectedLayout } from '@/components/ProtectedLayout';
import { MainLayout } from '@/components/layout/MainLayout';
import { MainContent } from '@/components/layout/MainContent';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileSidebar } from '@/components/layout/MobileSidebar';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { apiFetch } from '@/lib/api-client';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { cn } from '@/lib/utils';
// good things take time
interface PostItem {
  _id: string;
  title: string;
  content: string;
  status: string;
  createdAt: string;
  scheduledAt?: string;
  categoryId?: { name: string };
  media: { url: string; type: string }[];
}

interface EventItem {
  _id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  media: { url: string; type: string }[];
  createdAt: string;
}

type TabType = 'news' | 'event';

function formatDate(d: string) {
  const date = new Date(d);
  return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function SeeAllPage() {
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 1024px)');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [tab, setTab] = useState<TabType>('news');
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{ type: 'news' | 'event'; id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPosts = useCallback(async () => {
    const res = await apiFetch<PostItem[]>('/admin/content/posts');
    if (res.success && res.data) {
      setPosts(Array.isArray(res.data) ? res.data : []);
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    const res = await apiFetch<EventItem[]>('/admin/content/events');
    if (res.success && res.data) {
      setEvents(Array.isArray(res.data) ? res.data : []);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchPosts(), fetchEvents()]).finally(() => setLoading(false));
  }, [fetchPosts, fetchEvents]);

  useEffect(() => {
    const handler = () => {
      fetchPosts();
      fetchEvents();
    };
    window.addEventListener('post-created', handler);
    return () => window.removeEventListener('post-created', handler);
  }, [fetchPosts, fetchEvents]);

  const handleDelete = async () => {
    if (!deleteModal) return;
    setDeleting(true);
    try {
      const endpoint =
        deleteModal.type === 'news'
          ? `/admin/content/posts/${deleteModal.id}`
          : `/admin/content/events/${deleteModal.id}`;
      const res = await apiFetch(endpoint, { method: 'DELETE' });
      if (!res.success) throw new Error(res.error || 'Delete failed');
      if (deleteModal.type === 'news') fetchPosts();
      else fetchEvents();
      setDeleteModal(null);
    } finally {
      setDeleting(false);
    }
  };

  const items = tab === 'news' ? posts : events;

  return (
    <ProtectedLayout>
      <MainLayout>
        {!isMobile && <Sidebar />}
        {isMobile && (
          <MobileSidebar isOpen={isMobileSidebarOpen} onClose={() => setIsMobileSidebarOpen(false)} />
        )}

        <MainContent>
          <div className="flex flex-col h-full">
            <header className="flex items-center justify-between p-6 lg:p-8 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <Link
                  href="/content-management"
                  className="text-gray-600 hover:text-gray-900"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Link>
                <h1 className="text-2xl lg:text-3xl font-bold text-black">See All</h1>
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

            <div className="flex-1 overflow-y-auto p-6 lg:p-8">
              {/* Toggle */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setTab('news')}
                  className={cn(
                    'px-4 py-2 rounded-lg font-medium transition-colors',
                    tab === 'news'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  )}
                >
                  News
                </button>
                <button
                  onClick={() => setTab('event')}
                  className={cn(
                    'px-4 py-2 rounded-lg font-medium transition-colors',
                    tab === 'event'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  )}
                >
                  Events
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full" />
                </div>
              ) : !items.length ? (
                <div className="py-16 text-center text-gray-500">
                  No {tab === 'news' ? 'news' : 'events'} yet. Create one from the sidebar.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tab === 'news' &&
                    (posts as PostItem[]).map((post) => (
                      <div
                        key={post._id}
                        className="bg-white rounded-xl border-2 border-black overflow-hidden shadow-sm"
                      >
                        <Link href={`/content-management/news/${post._id}`} className="block">
                          <div className="h-40 bg-gray-100">
                            {post.media?.[0]?.url ? (
                              post.media[0].type === 'video' ? (
                                <video src={post.media[0].url} className="w-full h-full object-cover" muted />
                              ) : (
                                <img src={post.media[0].url} alt="" className="w-full h-full object-cover" />
                              )
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">No media</div>
                            )}
                          </div>
                          <div className="p-4">
                            <h3 className="font-semibold text-black line-clamp-2 mb-1">{post.title}</h3>
                            <p className="text-xs text-gray-600">{formatDate(post.createdAt)}</p>
                            {post.categoryId && (
                              <span className="text-xs text-gray-500">{(post.categoryId as { name: string }).name}</span>
                            )}
                          </div>
                        </Link>
                        <div className="p-4 pt-0 flex gap-2">
                          <Link
                            href={`/content-management/news/${post._id}/edit`}
                            className="flex-1 py-2 text-center rounded-lg border-2 border-black text-black font-medium hover:bg-gray-50"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              setDeleteModal({ type: 'news', id: post._id, title: post.title });
                            }}
                            className="flex-1 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}

                  {tab === 'event' &&
                    (events as EventItem[]).map((event) => (
                      <div
                        key={event._id}
                        className="bg-white rounded-xl border-2 border-black overflow-hidden shadow-sm"
                      >
                        <Link href={`/content-management/events/${event._id}`} className="block">
                          <div className="h-40 bg-gray-100">
                            {event.media?.[0]?.url ? (
                              event.media[0].type === 'video' ? (
                                <video src={event.media[0].url} className="w-full h-full object-cover" muted />
                              ) : (
                                <img src={event.media[0].url} alt="" className="w-full h-full object-cover" />
                              )
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
                            )}
                          </div>
                          <div className="p-4">
                            <h3 className="font-semibold text-black line-clamp-2 mb-1">{event.title}</h3>
                            <p className="text-xs text-gray-600">
                              {formatDate(event.date)} · {event.time}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{event.location}</p>
                          </div>
                        </Link>
                        <div className="p-4 pt-0 flex gap-2">
                          <Link
                            href={`/content-management/events/${event._id}/edit`}
                            className="flex-1 py-2 text-center rounded-lg border-2 border-black text-black font-medium hover:bg-gray-50"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              setDeleteModal({ type: 'event', id: event._id, title: event.title });
                            }}
                            className="flex-1 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </MainContent>
      </MainLayout>

      <ConfirmModal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        onConfirm={handleDelete}
        title="Delete confirmation"
        message={`Are you sure you want to delete "${deleteModal?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isLoading={deleting}
      />
    </ProtectedLayout>
  );
}
