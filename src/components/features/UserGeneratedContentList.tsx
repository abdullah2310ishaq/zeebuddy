"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";

interface PendingPost {
  id: string;
  title: string;
  content?: string;
  media?: Array<{ url: string; type: string }>;
  postType?: string;
  category?: { name: string };
  author?: { id: string; name: string; email: string; avatarUrl?: string };
  createdAt: string;
}

export function UserGeneratedContentList() {
  const queryClient = useQueryClient();
  const [processed, setProcessed] = useState<Set<string>>(new Set());

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["user-generated-pending"],
    queryFn: async () => {
      const res = await apiFetch<PendingPost[]>("/admin/user-generated/pending");
      if (!res.success) throw new Error(res.error);
      return res.data ?? [];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`/admin/user-generated/${id}/approve`, { method: "POST" });
      if (!res.success) throw new Error(res.error);
    },
    onSuccess: (_, id) => {
      setProcessed((prev) => new Set(prev).add(id));
      queryClient.invalidateQueries({ queryKey: ["user-generated-pending"] });
      queryClient.invalidateQueries({ queryKey: ["user-generated-metrics"] });
    },
  });

  const declineMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`/admin/user-generated/${id}/decline`, { method: "POST" });
      if (!res.success) throw new Error(res.error);
    },
    onSuccess: (_, id) => {
      setProcessed((prev) => new Set(prev).add(id));
      queryClient.invalidateQueries({ queryKey: ["user-generated-pending"] });
      queryClient.invalidateQueries({ queryKey: ["user-generated-metrics"] });
    },
  });

  const handleApprove = (id: string) => approveMutation.mutate(id);
  const handleDecline = (id: string) => declineMutation.mutate(id);

  const visibleItems = items.filter((item) => !processed.has(item.id));

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-500">
        Loading pending content...
      </div>
    );
  }

  if (visibleItems.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-500">
        No pending user-generated content. All items have been reviewed.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">User-generated content for approval</h2>
      <div className="space-y-4">
        {visibleItems.map((item, index) => {
          const imageUrl = item.media?.[0]?.url || "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=280&fit=crop";
          const isApproving = approveMutation.isPending && approveMutation.variables === item.id;
          const isDeclining = declineMutation.isPending && declineMutation.variables === item.id;
          return (
            <div
              key={item.id}
              className={cn(
                "rounded-2xl border bg-white p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row gap-4 sm:gap-6",
                index === 0 ? "border-red-300" : "border-gray-200"
              )}
            >
              <div className="w-full sm:w-40 lg:w-48 shrink-0 rounded-xl overflow-hidden bg-gray-100 aspect-video sm:aspect-square sm:h-32 lg:h-36">
                <img src={imageUrl} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <h3 className="font-semibold text-gray-900 line-clamp-2">{item.title}</h3>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.content || "No description"}</p>
                {item.author && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="relative h-8 w-8 shrink-0 rounded-full overflow-hidden bg-gray-200">
                      {item.author.avatarUrl ? (
                        <img src={item.author.avatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-xs font-medium text-gray-500">
                          {(item.author.name || "?").charAt(0).toUpperCase()}
                        </span>
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-700 truncate">{item.author.name}</p>
                      <p className="text-[11px] text-gray-500 truncate">ID: {item.author.id}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex sm:flex-col gap-2 sm:justify-center shrink-0">
                <button
                  type="button"
                  onClick={() => handleDecline(item.id)}
                  disabled={isDeclining || isApproving}
                  className="px-5 py-2.5 rounded-full border-2 border-red-600 text-red-600 font-medium text-sm hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isDeclining ? "Declining..." : "Decline"}
                </button>
                <button
                  type="button"
                  onClick={() => handleApprove(item.id)}
                  disabled={isApproving || isDeclining}
                  className="px-5 py-2.5 rounded-full bg-red-600 text-white font-medium text-sm hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isApproving ? "Approving..." : "Approve"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
