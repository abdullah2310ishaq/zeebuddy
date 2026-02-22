"use client";

import { useQuery } from "@tanstack/react-query";
import { COLORS } from "@/constants/colors";
import { apiFetch } from "@/lib/api-client";

const APP_GRADIENT = `linear-gradient(135deg, ${COLORS.GRADIENT_START} 0%, ${COLORS.GRADIENT_END} 100%)`;

export function UserGeneratedMetrics() {
  const { data, isLoading } = useQuery({
    queryKey: ["user-generated-metrics"],
    queryFn: async () => {
      const res = await apiFetch<{
        totalUsers: number;
        totalPosts: number;
        livePosts: number;
        userContributionPercent: number;
      }>("/admin/user-generated/metrics");
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
            <div className="h-8 bg-gray-200 rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <p className="text-sm font-medium text-gray-500">Overall Users %</p>
        <p className="text-2xl font-bold text-gray-900 mt-2">{data?.userContributionPercent ?? 0}%</p>
        <p className="text-xs text-gray-500 mt-1">User contribution rate</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <p className="text-sm font-medium text-gray-500">Total Posts</p>
        <p className="text-2xl font-bold text-gray-900 mt-2">{data?.totalPosts ?? 0}</p>
        <p className="text-xs text-gray-500 mt-1">From {data?.totalUsers ?? 0} users</p>
      </div>

      <div
        className="rounded-2xl border border-transparent p-6 shadow-sm text-white"
        style={{ background: APP_GRADIENT }}
      >
        <p className="text-sm font-medium text-white/90">Live Posts</p>
        <p className="text-2xl font-bold mt-2">{data?.livePosts ?? 0}</p>
        <p className="text-xs text-white/80 mt-1">Approved & published</p>
      </div>
    </div>
  );
}
