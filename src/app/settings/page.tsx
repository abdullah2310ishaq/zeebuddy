"use client";

import { useState } from "react";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { MainLayout } from "@/components/layout/MainLayout";
import { MainContent } from "@/components/layout/MainContent";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileSidebar } from "@/components/layout/MobileSidebar";
import { SettingsHeader } from "@/components/features/SettingsHeader";
import { UserProfileSection } from "@/components/features/UserProfileSection";
import { PersonalInfoSection } from "@/components/features/PersonalInfoSection";
import { GeneralSection } from "@/components/features/GeneralSection";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export default function SettingsPage() {
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
          <SettingsHeader onMenuToggle={handleMenuToggle} />

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6 lg:p-8">
            <div className="space-y-8">
              {/* User Profile Section */}
              <UserProfileSection />

              {/* Personal Info Section - Full Width */}
              <PersonalInfoSection />

              {/* General Section - Title on Left, Toggles on Right */}
              <GeneralSection />

              {/* Delete Account Button */}
              <div className="flex justify-end pt-4">
                <button className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors cursor-pointer">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </MainContent>
    </MainLayout>
    </ProtectedLayout>
  );
}
