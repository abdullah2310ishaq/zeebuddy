"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { MainLayout } from "@/components/layout/MainLayout";
import { MainContent } from "@/components/layout/MainContent";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileSidebar } from "@/components/layout/MobileSidebar";
import { LocalBusinessHeader } from "@/components/features/LocalBusinessHeader";
import { COLORS } from "@/constants/colors";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const APP_GRADIENT = `linear-gradient(135deg, ${COLORS.GRADIENT_START} 0%, ${COLORS.GRADIENT_END} 100%)`;

type BusinessMediaType = "image" | "video";
type BusinessMediaItem = { url: string; type: BusinessMediaType; publicId?: string };

function toMedia(business: unknown): BusinessMediaItem[] {
  if (!business || typeof business !== "object") return [];
  const rec = business as Record<string, unknown>;
  const mediaRaw = rec.media;
  if (Array.isArray(mediaRaw)) {
    return mediaRaw
      .filter((m): m is Record<string, unknown> => !!m && typeof m === "object")
      .map((m) => ({
        url: typeof m.url === "string" ? m.url.trim() : "",
        type: m.type === "video" ? ("video" as const) : ("image" as const),
        publicId: typeof m.publicId === "string" && m.publicId.trim() ? m.publicId.trim() : undefined,
      }))
      .filter((m) => !!m.url);
  }
  const imagesRaw = rec.images;
  if (Array.isArray(imagesRaw)) {
    return imagesRaw
      .filter((u): u is string => typeof u === "string" && u.trim().length > 0)
      .map((u) => ({ url: u.trim(), type: "image" as const }));
  }
  return [];
}

export default function LocalBusinessDetailPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";
  const { data: business, isLoading, error } = useQuery({
    queryKey: ["business", id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/business/${id}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to fetch");
      return json.data;
    },
    enabled: !!id,
  });
  const isMobile = useMediaQuery("(max-width: 1024px)");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  if (isLoading) {
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
          <div className="flex flex-col h-full p-6 lg:p-8">
            <p className="text-gray-500">Loading...</p>
          </div>
        </MainContent>
      </MainLayout>
      </ProtectedLayout>
    );
  }

  if (error || !business) {
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
          <div className="flex flex-col h-full p-6 lg:p-8">
            <p className="text-gray-500">Business not found.</p>
            <Link
              href="/local-business"
              className="mt-4 text-red-600 hover:underline font-medium"
            >
              ← Back to Local Business
            </Link>
          </div>
        </MainContent>
      </MainLayout>
      </ProtectedLayout>
    );
  }

  const media = toMedia(business);
  const heroImage = media.find((m) => m.type === "image")?.url || "";
  const heroVideo = !heroImage ? media.find((m) => m.type === "video")?.url || "" : "";
  const heroUrl = heroImage || heroVideo;
  const galleryMedia =
    media.length <= 1 ? media : media.filter((m) => m.url !== heroUrl);

  const primaryService = (() => {
    const services = (business as { services?: string[] | string }).services;
    const value = Array.isArray(services) ? services[0] : services;
    if (typeof value !== "string") return "";
    const trimmed = value.trim();
    if (!trimmed) return "";
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  })();

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
          <LocalBusinessHeader onMenuToggle={() => setIsMobileSidebarOpen((v) => !v)} />

          <div className="flex-1 overflow-y-auto">
            {/* Back link */}
            <div className="px-6 lg:px-8 pt-4">
              <Link
                href="/local-business"
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-red-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to View All Businesses
              </Link>
            </div>

            <div className="p-6 lg:p-8 space-y-8">
              {/* Hero + gradient bar */}
              <div className="rounded-2xl overflow-hidden shadow-xl border border-gray-200 bg-white">
                <div className="h-1.5 w-full" style={{ background: APP_GRADIENT }} />
                <div className="relative h-64 sm:h-80 lg:h-96 bg-gray-100">
                  {heroImage ? (
                    <img
                      src={heroImage}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : heroVideo ? (
                    <video
                      src={heroVideo}
                      className="absolute inset-0 w-full h-full object-cover"
                      controls
                      playsInline
                    />
                  ) : (
                    <div
                      className="absolute inset-0 flex items-center justify-center text-6xl text-white/80"
                      style={{ background: APP_GRADIENT }}
                    >
                      🏢
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold drop-shadow">
                      {business.businessName}
                    </h1>
                    <p className="text-white/95 text-sm sm:text-base mt-1">
                      {business.businessType}
                      {primaryService && <> · {primaryService}</>}
                    </p>
                  </div>
                </div>
              </div>

              {/* Content grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900 mb-3">About</h2>
                    <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                      {business.businessDescription}
                    </p>
                  </section>

                  {/* Gallery */}
                  {galleryMedia.length > 0 && (
                    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                      <h2 className="text-lg font-bold text-gray-900 mb-4">Gallery</h2>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {galleryMedia.map((item: BusinessMediaItem, i: number) => (
                          <div
                            key={i}
                            className={item.type === "video"
                              ? "rounded-xl overflow-hidden bg-black aspect-video"
                              : "aspect-square rounded-xl overflow-hidden bg-gray-100"}
                          >
                            {item.type === "video" ? (
                              <video
                                src={item.url}
                                className="w-full h-full object-contain"
                                controls
                                playsInline
                                preload="metadata"
                              />
                            ) : (
                              <img
                                src={item.url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>

                <div className="space-y-6">
                  <section
                    className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                    style={{ borderTopWidth: "4px", borderTopColor: COLORS.GRADIENT_START }}
                  >
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Details</h2>
                    <dl className="space-y-4">
                      {business.serviceHours && (
                        <div>
                          <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
                            <span>🕐</span> Hours
                          </dt>
                          <dd className="mt-1 text-gray-700">{business.serviceHours}</dd>
                        </div>
                      )}
                      {business.serviceAreas && (
                        <div>
                          <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
                            <span>📍</span> Service areas
                          </dt>
                          <dd className="mt-1 text-gray-700">{business.serviceAreas}</dd>
                        </div>
                      )}
                      <div>
                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
                          Type
                        </dt>
                        <dd className="mt-1">
                          <span
                            className="inline-flex px-3 py-1 rounded-full text-sm font-medium text-white"
                            style={{ background: COLORS.GRADIENT_START }}
                          >
                            {business.businessType}
                          </span>
                        </dd>
                      </div>
                    </dl>
                  </section>

                  <Link
                    href="/local-business"
                    className="block w-full text-center py-3 px-4 rounded-full font-semibold text-white transition-colors cursor-pointer"
                    style={{ background: APP_GRADIENT }}
                  >
                    View all businesses
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MainContent>
    </MainLayout>
    </ProtectedLayout>
  );
}
