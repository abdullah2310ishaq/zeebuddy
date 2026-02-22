"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { MainLayout } from "@/components/layout/MainLayout";
import { MainContent } from "@/components/layout/MainContent";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileSidebar } from "@/components/layout/MobileSidebar";
import { DashboardHeader } from "@/components/features/DashboardHeader";
import { OverviewSection } from "@/components/features/OverviewSection";
import { AutomationList } from "@/components/features/AutomationList";
import { TopContributorsSection } from "@/components/features/TopContributorsSection";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { apiFetch } from "@/lib/api-client";

function getDateRange(days: number) {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  };
}

export default function DashboardPage() {
  const isMobile = useMediaQuery("(max-width: 1024px)");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [dateRangeDays, setDateRangeDays] = useState(30);

  const { from, to } = useMemo(() => getDateRange(dateRangeDays), [dateRangeDays]);

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats", from, to],
    queryFn: async () => {
      const res = await apiFetch<{ totalPosted: number; totalAccepted: number; totalRejected: number }>(
        `/admin/dashboard/stats?from=${from}&to=${to}`
      );
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
  });

  const { data: contributors } = useQuery({
    queryKey: ["dashboard-top-contributors"],
    queryFn: async () => {
      const res = await apiFetch<Array<{ id: string; name: string; roleOrStat: string; avatar?: string }>>(
        "/admin/dashboard/top-contributors"
      );
      if (!res.success) throw new Error(res.error);
      return res.data ?? [];
    },
  });

  const metrics = useMemo(
    () => [
      { id: "news-posted", title: "Total news posted", value: stats?.totalPosted?.toLocaleString() ?? "0", icon: "📰", iconColor: "text-blue-600" },
      { id: "news-accepted", title: "Total news accepted", value: stats?.totalAccepted?.toLocaleString() ?? "0", icon: "✅", iconColor: "text-green-600" },
      { id: "news-rejected", title: "Total news rejected", value: stats?.totalRejected?.toLocaleString() ?? "0", icon: "❌", iconColor: "text-red-600" },
    ],
    [stats]
  );

  const topContributors = useMemo(
    () =>
      (contributors ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        roleOrStat: c.roleOrStat,
        avatar: c.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + c.id,
      })),
    [contributors]
  );

  return (
    <ProtectedLayout>
      <MainLayout>
        {!isMobile && <Sidebar />}
        {isMobile && (
          <MobileSidebar isOpen={isMobileSidebarOpen} onClose={() => setIsMobileSidebarOpen(false)} />
        )}

        <MainContent>
          <div className="flex flex-col h-full">
            <DashboardHeader onMenuToggle={() => setIsMobileSidebarOpen((v) => !v)} />
            <div className="flex-1 overflow-y-auto min-h-0 pb-24">
              <OverviewSection metrics={metrics} dateRangeDays={dateRangeDays} onDateRangeChange={setDateRangeDays} />
              <AutomationList />
              <TopContributorsSection contributors={topContributors} />
            </div>
          </div>
        </MainContent>
      </MainLayout>
    </ProtectedLayout>
  );
}
