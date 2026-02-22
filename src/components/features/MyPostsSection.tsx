"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

interface PostItem {
  _id: string;
  title: string;
  content: string;
  status: "published" | "scheduled";
  createdAt: string;
  scheduledAt?: string;
  categoryId?: { name: string };
  media: { url: string; type: string }[];
}

const CATEGORY_COLORS: Record<string, string> = {
  News: "bg-red-500",
  Events: "bg-blue-500",
  Community: "bg-green-500",
  Business: "bg-purple-500",
  Lifestyle: "bg-orange-500",
};

function formatDate(d: string) {
  const date = new Date(d);
  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")} ${days[date.getDay()]}`;
}

function formatTime(d: string) {
  const date = new Date(d);
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function MyPostsSection() {
  const router = useRouter();
  const [hoveredPost, setHoveredPost] = useState<string | null>(null);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<PostItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPosts = useCallback(async () => {
    const res = await apiFetch<PostItem[]>("/admin/content/posts");
    if (res.success && res.data) {
      setPosts(Array.isArray(res.data) ? res.data : []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    const handler = () => fetchPosts();
    window.addEventListener("post-created", handler);
    return () => window.removeEventListener("post-created", handler);
  }, [fetchPosts]);

  const handleDelete = async () => {
    if (!deleteModal) return;
    setDeleting(true);
    try {
      const res = await apiFetch(`/admin/content/posts/${deleteModal._id}`, { method: "DELETE" });
      if (res.success) {
        fetchPosts();
        setDeleteModal(null);
      } else throw new Error(res.error);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">My Posts</h2>
        <div className="flex justify-center py-12">
          <div className="animate-spin w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full" />
        </div>
      </section>
    );
  }

  if (!posts.length) {
    return (
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">My Posts</h2>
        <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-gray-500 mb-4">No posts yet</p>
          <p className="text-sm text-gray-400">
            Click &quot;Create new project&quot; in the sidebar to add your first post or event.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section>
      {/* Section Title + See All */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">My Posts</h2>
        <Link
          href="/content-management/all"
          className="text-sm font-medium text-red-600 hover:text-red-700"
        >
          See all
        </Link>
      </div>

      {/* Posts Grid - larger cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <Link
            key={post._id}
            href={`/content-management/news/${post._id}`}
            className="relative bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group cursor-pointer min-h-[380px] flex flex-col block"
            onMouseEnter={() => setHoveredPost(post._id)}
            onMouseLeave={() => setHoveredPost(null)}
          >
            {/* Status Tag */}
            <div className="absolute top-4 right-4 z-10">
              <span
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium text-white",
                  post.status === "published" ? "bg-green-500" : "bg-red-500"
                )}
              >
                {post.status === "published" ? "Published" : "Scheduled"}
              </span>
            </div>

            {/* Hover: blur overlay + red pill with icons */}
            {hoveredPost === post._id && (
              <>
                <div
                  className="absolute inset-0 z-20 backdrop-blur-md bg-white/30"
                  aria-hidden
                />
                <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
                  <div className="flex items-center gap-3 px-6 py-3 bg-red-500 rounded-full shadow-lg pointer-events-auto">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        router.push(`/content-management/news/${post._id}/edit`);
                      }}
                      className="p-2 text-white hover:bg-white/20 rounded-full transition-colors cursor-pointer"
                      aria-label="Edit"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="p-2 text-white hover:bg-white/20 rounded-full transition-colors cursor-pointer"
                      aria-label="Schedule"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="p-2 text-white hover:bg-white/20 rounded-full transition-colors cursor-pointer"
                      aria-label="Send"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteModal(post); }}
                      className="p-2 text-white hover:bg-white/20 rounded-full transition-colors cursor-pointer"
                      aria-label="Delete"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Post Content (blurs behind overlay on hover) */}
            <div
              className={cn(
                "p-6 pt-5 flex flex-col flex-1 transition-[filter] duration-200",
                hoveredPost === post._id && "blur-md"
              )}
            >
              {/* Title */}
              <h3 className="text-base font-medium text-gray-900 mb-4 line-clamp-3">
                {post.title}
              </h3>

              {/* Media */}
              <div className="w-full h-44 sm:h-52 rounded-lg overflow-hidden mb-5 flex-shrink-0 bg-gray-100">
                {post.media?.[0]?.url ? (
                  post.media[0].type === "video" ? (
                    <video src={post.media[0].url} className="w-full h-full object-cover" muted />
                  ) : (
                    <img src={post.media[0].url} alt="" className="w-full h-full object-cover" />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No media</div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center space-x-2">
                  <svg
                    className="w-4 h-4 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-xs text-gray-500">
                    {post.scheduledAt ? formatDate(post.scheduledAt) : formatDate(post.createdAt)}{" "}
                    {post.scheduledAt ? formatTime(post.scheduledAt) : formatTime(post.createdAt)}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <div
                    className={cn("w-2 h-2 rounded-full", (post.categoryId as { name: string })?.name ? CATEGORY_COLORS[(post.categoryId as { name: string }).name] || "bg-gray-500" : "bg-gray-500")}
                  ></div>
                  <span className="text-xs text-gray-500">{(post.categoryId as { name: string })?.name || "—"}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <ConfirmModal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        onConfirm={handleDelete}
        title="Delete news"
        message={deleteModal ? `Are you sure you want to delete "${deleteModal.title}"? This action cannot be undone.` : ""}
        confirmLabel="Delete"
        isLoading={deleting}
      />
    </section>
  );
}
