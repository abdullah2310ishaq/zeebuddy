"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { MainLayout } from "@/components/layout/MainLayout";
import { MainContent } from "@/components/layout/MainContent";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileSidebar } from "@/components/layout/MobileSidebar";
import { LocalBusinessHeader } from "@/components/features/LocalBusinessHeader";
import { BusinessForm } from "@/components/features/BusinessForm";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { apiFetch } from "@/lib/api-client";
import type { BusinessEntity } from "@/types/business";

export default function EditBusinessPage() {
  const params = useParams();
  const router = useRouter();
  const businessId = typeof params?.id === "string" ? params.id : "";
  const isMobile = useMediaQuery("(max-width: 1024px)");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const { data: business, isLoading, error } = useQuery({
    queryKey: ["business", businessId],
    enabled: businessId.length > 0,
    queryFn: async () => {
      const response = await apiFetch<BusinessEntity>(`/business/${businessId}`);
      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to fetch business details");
      }
      return response.data;
    },
  });

  return (
    <ProtectedLayout>
      <MainLayout>
        {!isMobile && <Sidebar />}
        {isMobile && (
          <MobileSidebar isOpen={isMobileSidebarOpen} onClose={() => setIsMobileSidebarOpen(false)} />
        )}

        <MainContent>
          <div className="flex flex-col h-full">
            <LocalBusinessHeader onMenuToggle={() => setIsMobileSidebarOpen((value) => !value)} />
            <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">
              <Link href="/local-business" className="text-sm text-gray-600 hover:text-red-600">
                ← Back to Local Business
              </Link>

              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Edit Business</h1>

                {isLoading && <p className="text-sm text-gray-500">Loading business details...</p>}
                {error && <p className="text-sm text-red-600">Failed to load business details.</p>}

                {!isLoading && !error && business && (
                  <BusinessForm
                    business={business}
                    onSuccess={() => {
                      router.push(`/local-business/${business.id}`);
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </MainContent>
      </MainLayout>
    </ProtectedLayout>
  );
}
