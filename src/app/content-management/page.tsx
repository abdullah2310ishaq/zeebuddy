"use client";

import { useState } from "react";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { MainLayout } from "@/components/layout/MainLayout";
import { MainContent } from "@/components/layout/MainContent";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileSidebar } from "@/components/layout/MobileSidebar";
import { ContentManagementHeader } from "@/components/features/ContentManagementHeader";
import { LastEditedSection } from "@/components/features/LastEditedSection";
import { ScheduledSection } from "@/components/features/ScheduledSection";
import { MyPostsSection } from "@/components/features/MyPostsSection";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export default function ContentManagementPage() {
  const isMobile = useMediaQuery("(max-width: 1024px)");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleMenuToggle = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  return (
    <ProtectedLayout>
    <MainLayout>
      {/* Desktop Sidebar */}
      {!isMobile && <Sidebar />}

      {/* Mobile Sidebar */}
      {isMobile && (
        <MobileSidebar
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
        />
      )}

      <MainContent>
        <div className="flex flex-col h-full">
          {/* Header */}
          <ContentManagementHeader onMenuToggle={handleMenuToggle} />

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6 lg:p-8">
            <div className="space-y-8">
              {/* Last Edited + Scheduled in one row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <LastEditedSection />
                <ScheduledSection />
              </div>

              {/* My Posts Section */}
              <MyPostsSection />
            </div>
          </div>
        </div>
      </MainContent>
    </MainLayout>
    </ProtectedLayout>
  );
}
