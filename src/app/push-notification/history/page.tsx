'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ProtectedLayout } from '@/components/ProtectedLayout';
import { MainLayout } from '@/components/layout/MainLayout';
import { MainContent } from '@/components/layout/MainContent';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileSidebar } from '@/components/layout/MobileSidebar';
import { PushHeader } from '@/components/features/PushHeader';
import { HistorySection } from '@/components/features/HistorySection';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export default function PushNotificationHistoryPage() {
  const isMobile = useMediaQuery('(max-width: 1024px)');
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
            <PushHeader onMenuToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} />
            <div className="flex-1 overflow-y-auto p-6 lg:p-8">
              <div className="flex items-center justify-between mb-6">
                <Link
                  href="/push-notification"
                  className="text-sm font-medium text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Push Notification
                </Link>
              </div>
              <HistorySection />
            </div>
          </div>
        </MainContent>
      </MainLayout>
    </ProtectedLayout>
  );
}
