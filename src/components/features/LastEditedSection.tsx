"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";

interface PostItem {
  _id: string;
  title: string;
  content: string;
  status: string;
  updatedAt: string;
  media: { url: string; type: string }[];
}

interface LastEditedSectionProps {
  className?: string;
}

export function LastEditedSection({ className }: LastEditedSectionProps) {
  const [post, setPost] = useState<PostItem | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLastEdited = useCallback(async () => {
    const res = await apiFetch<PostItem[]>("/admin/content/posts?limit=1");
    if (res.success && res.data && Array.isArray(res.data) && res.data.length > 0) {
      setPost(res.data[0]);
    } else {
      setPost(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLastEdited();
  }, [fetchLastEdited]);

  useEffect(() => {
    const handler = () => fetchLastEdited();
    window.addEventListener("post-created", handler);
    return () => window.removeEventListener("post-created", handler);
  }, [fetchLastEdited]);

  return (
    <section
      className={cn(
        "bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden",
        className
      )}
    >
      <div className="p-5 pb-0 flex items-start justify-between gap-4">
        <h2 className="text-xl font-bold text-gray-900">Last Edited</h2>
        <Link
          href="/content-management/all"
          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer shrink-0"
          aria-label="See all"
        >
          <svg
            className="w-4 h-4 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 17L17 7M17 7H7M17 7V17"
            />
          </svg>
        </Link>
      </div>

      <div className="p-5 pb-5">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full" />
          </div>
        ) : post ? (
          <Link
            href={`/content-management/news/${post._id}`}
            className="flex flex-col sm:flex-row items-center gap-4 group cursor-pointer"
          >
            <div className="w-full sm:w-36 h-28 sm:h-32 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
              {post.media?.[0]?.url ? (
                post.media[0].type === "video" ? (
                  <video
                    src={post.media[0].url}
                    className="w-full h-full object-cover"
                    muted
                  />
                ) : (
                  <img
                    src={post.media[0].url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                  No media
                </div>
              )}
            </div>
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed flex-1 line-clamp-2 group-hover:text-red-600 transition-colors">
              {post.title}
            </p>
          </Link>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-gray-500 text-sm">No posts yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Create a post to see it here.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
