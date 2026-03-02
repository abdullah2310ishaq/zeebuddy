"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useState } from "react";

interface UserPost {
  id: string;
  title: string;
  content?: string;
  media?: { url: string; type: string }[];
  postType?: string;
  category?: { name: string };
  author?: { id: string; name: string; email: string; avatarUrl?: string };
  status: "approved" | "published" | "pending" | "rejected" | "scheduled";
  createdAt: string;
}

export function UserGeneratedAllPostsList() {
  const queryClient = useQueryClient();
  const [deleteModal, setDeleteModal] = useState<UserPost | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["user-generated-all-posts"],
    queryFn: async () => {
      const res = await apiFetch<UserPost[]>("/admin/user-generated/posts");
      if (!res.success) throw new Error(res.error);
      return res.data ?? [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`/admin/content/posts/${id}`, { method: "DELETE" });
      if (!res.success) throw new Error(res.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-generated-all-posts"] });
    },
  });

  const handleDelete = async () => {
    if (!deleteModal) return;
    setDeleting(true);
    try {
      await deleteMutation.mutateAsync(deleteModal.id);
      setDeleteModal(null);
    } finally {
      setDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">All user posts</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (!posts.length) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-2">All user posts</h2>
        <p className="text-sm text-gray-500">No approved user-generated posts yet.</p>
      </section>
    );
  }

  return (
    <>
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">All user posts</h2>
        </div>
        <div className="space-y-3">
          {posts.map((post) => {
            const imageUrl =
              post.media?.[0]?.url ??
              "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=280&fit=crop";
            return (
              <div
                key={post.id}
                className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-gray-200 hover:border-red-300 transition-colors"
              >
                <div className="w-full sm:w-32 h-24 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                  {post.media?.[0]?.url ? (
                    post.media[0].type === "video" ? (
                      <video src={imageUrl} className="w-full h-full object-cover" muted />
                    ) : (
                      <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                      No media
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-gray-900 line-clamp-1">{post.title}</h3>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[11px] font-medium capitalize",
                        post.status === "published" || post.status === "approved"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      )}
                    >
                      {post.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                    {post.content || "No description"}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    {post.category?.name && <span>{post.category.name}</span>}
                    {post.author && (
                      <span className="flex items-center gap-1.5">
                        <span className="relative h-5 w-5 shrink-0 rounded-full overflow-hidden bg-gray-200">
                          {post.author.avatarUrl ? (
                            <img src={post.author.avatarUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-[10px] font-medium text-gray-500">
                              {(post.author.name || "?").charAt(0).toUpperCase()}
                            </span>
                          )}
                        </span>
                        <span>by {post.author.name}</span>
                        <span className="text-gray-400">(ID: {post.author.id})</span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex sm:flex-col justify-end gap-2 shrink-0">
                  <a
                    href={`/post/${post.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-full border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50 text-center"
                  >
                    View live
                  </a>
                  <button
                    type="button"
                    onClick={() => setDeleteModal(post)}
                    className="px-4 py-2 rounded-full bg-red-600 text-white text-xs font-medium hover:bg-red-700 cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <ConfirmModal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        onConfirm={handleDelete}
        title="Delete user post"
        message={
          deleteModal
            ? `Are you sure you want to delete the post "${deleteModal.title}"? This will hide it from the user app.`
            : ""
        }
        confirmLabel="Delete"
        isLoading={deleting}
      />
    </>
  );
}

