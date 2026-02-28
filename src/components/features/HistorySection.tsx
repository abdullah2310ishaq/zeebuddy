"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  status: string;
  sentAt: string | null;
  createdAt: string;
  createdBy?: { name: string; email: string };
}

interface HistorySectionProps {
  /** When set, show only this many recent items and a "See all" button. Omit for full list. */
  limit?: number;
}

export function HistorySection({ limit = 50 }: HistorySectionProps) {
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["push-notifications-history", limit],
    queryFn: async () => {
      const url = limit ? `/admin/push-notifications?limit=${limit}` : "/admin/push-notifications";
      const res = await apiFetch<NotificationItem[]>(url);
      if (!res.success) throw new Error(res.error);
      return res.data ?? [];
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "bg-green-100 text-green-700";
      case "draft":
        return "bg-yellow-100 text-yellow-700";
      case "pending":
        return "bg-pink-100 text-pink-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  if (isLoading) {
    return (
      <section className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">History</h2>
        <div className="animate-pulse space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded" />
          ))}
        </div>
      </section>
    );
  }

  const showSeeAll = limit > 0 && limit < 50;

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">History</h2>
        {showSeeAll && (
          <Link
            href="/push-notification/history"
            className="text-sm font-medium text-red-600 hover:text-red-700"
          >
            See all
          </Link>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No notifications sent yet.</p>
      ) : (
        <div className="grid grid-cols-4 gap-0 rounded-lg overflow-hidden">
          <div className="col-span-4 grid grid-cols-[2fr_1fr_1fr_1fr] bg-red-600 text-white text-sm font-medium">
            <div className="px-4 py-2">Name</div>
            <div className="px-4 py-2">Date</div>
            <div className="px-4 py-2">Time</div>
            <div className="px-4 py-2">Status</div>
          </div>
          {notifications.map((n) => (
            <div
              key={n.id}
              className="col-span-4 grid grid-cols-[2fr_1fr_1fr_1fr] items-center bg-white border-b border-gray-100"
            >
              <div className="px-4 py-3 flex items-center space-x-3">
                <span className="w-6 h-6 rounded-full bg-red-100" />
                <span className="text-sm text-gray-800">{n.title}</span>
              </div>
              <div className="px-4 py-3 text-sm text-gray-600">{formatDate(n.sentAt ?? n.createdAt)}</div>
              <div className="px-4 py-3 text-sm text-gray-600">{formatTime(n.sentAt ?? n.createdAt)}</div>
              <div className="px-4 py-3">
                <span className={cn("px-3 py-1 rounded-full text-xs font-medium capitalize", getStatusColor(n.status))}>
                  {n.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
