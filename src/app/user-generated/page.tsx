"use client";

import { useState } from "react";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { MainLayout } from "@/components/layout/MainLayout";
import { MainContent } from "@/components/layout/MainContent";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileSidebar } from "@/components/layout/MobileSidebar";
import { UserGeneratedHeader } from "@/components/features/UserGeneratedHeader";
import { UserGeneratedMetrics } from "@/components/features/UserGeneratedMetrics";
import { UserGeneratedContentList } from "@/components/features/UserGeneratedContentList";
import { UserGeneratedAllPostsList } from "@/components/features/UserGeneratedAllPostsList";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export default function UserGeneratedPage() {
  const isMobile = useMediaQuery("(max-width: 1024px)");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
          <UserGeneratedHeader onMenuToggle={() => setIsMobileSidebarOpen((v) => !v)} />

          <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8">
            <UserGeneratedMetrics />
            <UserGeneratedContentList />
            <UserGeneratedAllPostsList />
          </div>
        </div>
      </MainContent>
    </MainLayout>
    </ProtectedLayout>
  );
}
