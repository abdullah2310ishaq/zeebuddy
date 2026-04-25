"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { COLORS } from "@/constants/colors";
import { apiFetch } from "@/lib/api-client";
import { useState } from "react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

interface Business {
  id: string;
  businessName: string;
  services: string[];
  serviceHours: string;
  businessDescription: string;
  businessType: string;
  serviceAreas: string;
  media?: Array<{ url: string; type: "image" | "video"; publicId?: string }>;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

const APP_GRADIENT = `linear-gradient(135deg, ${COLORS.GRADIENT_START} 0%, ${COLORS.GRADIENT_END} 100%)`;

function BusinessCard({ business }: { business: Business }) {
  const heroImage =
    business.media?.find((m) => m.type === "image")?.url ||
    business.images?.[0] ||
    "";
  const servicesLabel = business.services.join(", ");

  return (
    <Link
      href={`/local-business/${business.id}`}
      className={cn(
        "group block rounded-2xl overflow-hidden shadow-lg border border-gray-200",
        "bg-white transition-shadow hover:shadow-xl hover:border-red-200"
      )}
    >
      <div
        className="h-1.5 w-full shrink-0"
        style={{ background: APP_GRADIENT }}
      />
      <div className="flex flex-col md:flex-row">
        <div className="md:w-80 lg:w-96 shrink-0">
          <div className="relative h-52 md:h-full md:min-h-[240px] bg-gray-100">
            {heroImage ? (
              <img
                src={heroImage}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div
                className="absolute inset-0 flex items-center justify-center text-4xl text-gray-400"
                style={{ background: APP_GRADIENT }}
              >
                🏢
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 p-6 flex flex-col">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {business.businessName}
              </h3>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span
                  className="inline-flex px-3 py-1 rounded-full text-xs font-medium text-white"
                  style={{ background: COLORS.GRADIENT_START }}
                >
                  {business.businessType}
                </span>
                {servicesLabel && (
                  <span className="text-sm text-gray-200 bg-black/30 rounded-full px-3 py-0.5 capitalize">
                    {servicesLabel}
                  </span>
                )}
              </div>
            </div>
            <span className="text-gray-400 group-hover:text-red-600">
              View details →
            </span>
          </div>

          {business.businessDescription && (
            <p className="text-sm text-gray-600 mt-3 line-clamp-3 leading-relaxed">
              {business.businessDescription}
            </p>
          )}

          <div className="mt-4 space-y-2 text-sm text-gray-600">
            {business.serviceHours && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400 shrink-0">🕐</span>
                <span>{business.serviceHours}</span>
              </div>
            )}
            {business.serviceAreas && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400 shrink-0">📍</span>
                <span>{business.serviceAreas}</span>
              </div>
            )}
          </div>

          {business.images && business.images.length > 1 && (
            <div className="flex gap-2 mt-4 flex-wrap">
              {business.images.slice(1, 4).map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt=""
                  className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export function BusinessList() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["businesses"],
    queryFn: async () => {
      const res = await apiFetch<Business[]>("/business");
      if (!res.success) throw new Error(res.error || "Failed to fetch");
      return res.data ?? [];
    },
  });

  const [businessToDelete, setBusinessToDelete] = useState<Business | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch<unknown>(`/business/${id}`, { method: "DELETE" });
      if (!res.success) throw new Error(res.error || "Failed to delete business");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["businesses"] });
    },
  });

  const handleConfirmDelete = async () => {
    if (!businessToDelete) return;
    try {
      await deleteMutation.mutateAsync(businessToDelete.id);
      setBusinessToDelete(null);
    } catch {
      // error is surfaced via mutation if needed
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <p className="text-sm text-gray-500">Loading businesses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <p className="text-sm text-red-600">Failed to load businesses. Please try again.</p>
      </div>
    );
  }

  const businesses = data ?? [];

  return (
    <>
      <div className="space-y-6">
        <p className="text-sm text-gray-500">
          {businesses.length} business{businesses.length !== 1 ? "es" : ""} found.
        </p>
        <div className="grid gap-6">
          {businesses.map((business) => (
            <div key={business.id} className="space-y-2">
              <BusinessCard business={business} />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setBusinessToDelete(business)}
                  className="px-4 py-1.5 rounded-full bg-red-600 text-white text-xs font-medium hover:bg-red-700 cursor-pointer disabled:opacity-50"
                  disabled={deleteMutation.isPending && businessToDelete?.id === business.id}
                >
                  {deleteMutation.isPending && businessToDelete?.id === business.id
                    ? "Deleting..."
                    : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ConfirmModal
        isOpen={!!businessToDelete}
        onClose={() => setBusinessToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete business"
        message={
          businessToDelete
            ? `Are you sure you want to delete "${businessToDelete.businessName}"? This will hide it from the list and user app.`
            : ""
        }
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}
