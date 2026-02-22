"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";

interface ScheduledItem {
  _id: string;
  title: string;
  content: string;
  status: string;
  scheduledAt?: string;
  media: { url: string; type: string }[];
}

interface ScheduledSectionProps {
  className?: string;
}

export function ScheduledSection({ className }: ScheduledSectionProps) {
  const [items, setItems] = useState<ScheduledItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchScheduled = useCallback(async () => {
    const res = await apiFetch<ScheduledItem[]>(
      "/admin/content/posts?status=scheduled&limit=10"
    );
    if (res.success && res.data && Array.isArray(res.data)) {
      setItems(res.data);
    } else {
      setItems([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchScheduled();
  }, [fetchScheduled]);

  useEffect(() => {
    const handler = () => fetchScheduled();
    window.addEventListener("post-created", handler);
    return () => window.removeEventListener("post-created", handler);
  }, [fetchScheduled]);

  return (
    <section
      className={cn(
        "bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden",
        className
      )}
    >
      <div className="p-5 pb-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Scheduled</h2>
        <Link
          href="/content-management/all"
          className="text-sm font-medium text-red-600 hover:text-red-700"
        >
          See all
        </Link>
      </div>

      <div className="divide-y divide-gray-100">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full" />
          </div>
        ) : items.length > 0 ? (
          items.map((item) => (
            <Link
              key={item._id}
              href={`/content-management/news/${item._id}`}
              className="flex items-center gap-4 p-4 hover:bg-gray-50/50 transition-colors"
            >
              <div className="w-14 h-14 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                {item.media?.[0]?.url ? (
                  item.media[0].type === "video" ? (
                    <video
                      src={item.media[0].url}
                      className="w-full h-full object-cover"
                      muted
                    />
                  ) : (
                    <img
                      src={item.media[0].url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    No media
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-700 line-clamp-2 flex-1 min-w-0">
                {item.title}
              </p>
            </Link>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <p className="text-gray-500 text-sm">No scheduled posts</p>
            <p className="text-xs text-gray-400 mt-1">
              Schedule a post to see it here.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
