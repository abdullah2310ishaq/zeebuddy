"use client";

import React, { ChangeEvent, FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";
import type { BusinessEntity, BusinessMediaItem, CreateBusinessRequest, UpdateBusinessRequest } from "@/types/business";

type UploadKind = "image" | "video";

interface MediaPreview {
  url: string;
  file: File;
  kind: UploadKind;
  title?: string;
  thumbnailFile?: File;
  thumbnailPreviewUrl?: string;
  thumbnailUrl?: string;
  thumbnailPublicId?: string;
}

interface EditableMediaItem extends BusinessMediaItem {
  pendingThumbnailFile?: File;
  pendingThumbnailPreviewUrl?: string;
}

interface BusinessFormProps {
  business?: BusinessEntity | null;
  onSuccess?: () => void;
}

interface UploadSignatureResponse {
  cloudName: string;
  apiKey: string;
  folder: string;
  resourceType: UploadKind;
  timestamp: number;
  signature: string;
  uploadUrl: string;
  maxVideoDurationSec: number;
}

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  duration?: number;
}

interface FieldErrors {
  businessName?: string;
  businessType?: string;
  services?: string;
}

function dedupeMedia(items: BusinessMediaItem[]): BusinessMediaItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.type}:${item.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getInitialMedia(business?: BusinessEntity | null): BusinessMediaItem[] {
  if (!business) return [];
  if (Array.isArray(business.media) && business.media.length > 0) return business.media;
  return (business.images ?? []).map((url) => ({ url, type: "image" as const }));
}

function getCloudinaryError(value: unknown): string {
  if (!value || typeof value !== "object") return "Cloudinary upload failed";
  const record = value as Record<string, unknown>;
  const error = record.error;
  if (error && typeof error === "object") {
    const message = (error as Record<string, unknown>).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return "Cloudinary upload failed";
}

function isCloudinaryUploadResponse(value: unknown): value is CloudinaryUploadResponse {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return typeof record.secure_url === "string" && typeof record.public_id === "string";
}

function formatDurationLimit(seconds: number): string {
  if (seconds % 60 === 0) {
    const minutes = seconds / 60;
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
  }
  return `${seconds} seconds`;
}

async function deleteUploadedMedia(publicId: string, type: UploadKind): Promise<void> {
  const response = await apiFetch<{ publicId: string }>("/upload", {
    method: "DELETE",
    body: JSON.stringify({ publicId, type }),
  });

  if (!response.success) {
    throw new Error(response.error || "Failed to delete invalid upload");
  }
}

async function uploadImageFile(file: File): Promise<{ url: string; publicId: string }> {
  const preview: MediaPreview = {
    url: URL.createObjectURL(file),
    file,
    kind: "image",
  };
  try {
    const uploaded = await uploadMediaDirect(preview);
    return { url: uploaded.url, publicId: uploaded.publicId ?? "" };
  } finally {
    URL.revokeObjectURL(preview.url);
  }
}

async function attachVideoMetadata(preview: MediaPreview, base: BusinessMediaItem): Promise<BusinessMediaItem> {
  if (preview.kind !== "video") return base;

  const item: BusinessMediaItem = { ...base };
  const title = preview.title?.trim();
  if (title) item.title = title;

  if (preview.thumbnailFile) {
    const thumbnail = await uploadImageFile(preview.thumbnailFile);
    item.thumbnailUrl = thumbnail.url;
    item.thumbnailPublicId = thumbnail.publicId || undefined;
  } else if (preview.thumbnailUrl) {
    item.thumbnailUrl = preview.thumbnailUrl;
    if (preview.thumbnailPublicId) item.thumbnailPublicId = preview.thumbnailPublicId;
  }

  return item;
}

async function finalizeExistingMediaItem(item: EditableMediaItem): Promise<BusinessMediaItem> {
  const { pendingThumbnailFile, pendingThumbnailPreviewUrl, ...rest } = item;
  if (pendingThumbnailPreviewUrl) URL.revokeObjectURL(pendingThumbnailPreviewUrl);

  let finalized: BusinessMediaItem = { ...rest };
  const title = finalized.title?.trim();
  if (title) finalized.title = title;
  else delete finalized.title;

  if (finalized.type === "video" && pendingThumbnailFile) {
    if (finalized.thumbnailPublicId) {
      await deleteUploadedMedia(finalized.thumbnailPublicId, "image").catch((error: unknown) => {
        console.warn("[BusinessForm] Failed to delete replaced thumbnail:", error);
      });
    }
    const thumbnail = await uploadImageFile(pendingThumbnailFile);
    finalized.thumbnailUrl = thumbnail.url;
    finalized.thumbnailPublicId = thumbnail.publicId || undefined;
  }

  if (finalized.type !== "video") {
    delete finalized.title;
    delete finalized.thumbnailUrl;
    delete finalized.thumbnailPublicId;
  }

  return finalized;
}

async function uploadMediaDirect(preview: MediaPreview): Promise<BusinessMediaItem> {
  const signatureResponse = await apiFetch<UploadSignatureResponse>("/upload/signature", {
    method: "POST",
    body: JSON.stringify({ folder: "businesses", type: preview.kind }),
  });

  if (!signatureResponse.success || !signatureResponse.data) {
    throw new Error(signatureResponse.error || `Failed to prepare upload for ${preview.file.name}`);
  }

  const signature = signatureResponse.data;
  const uploadFormData = new FormData();
  uploadFormData.append("file", preview.file);
  uploadFormData.append("api_key", signature.apiKey);
  uploadFormData.append("timestamp", String(signature.timestamp));
  uploadFormData.append("signature", signature.signature);
  uploadFormData.append("folder", signature.folder);

  const uploadResponse = await fetch(signature.uploadUrl, {
    method: "POST",
    body: uploadFormData,
  });
  const uploadJson: unknown = await uploadResponse.json().catch(() => null);

  if (!uploadResponse.ok) {
    throw new Error(getCloudinaryError(uploadJson));
  }

  if (!isCloudinaryUploadResponse(uploadJson)) {
    throw new Error("Cloudinary returned an invalid upload response");
  }

  if (
    preview.kind === "video" &&
    typeof uploadJson.duration === "number" &&
    uploadJson.duration > signature.maxVideoDurationSec
  ) {
    await deleteUploadedMedia(uploadJson.public_id, "video").catch((error: unknown) => {
      console.warn("[BusinessForm] Failed to delete oversized video:", error);
    });
    throw new Error(
      `Video must be ${formatDurationLimit(signature.maxVideoDurationSec)} or less (current: ${Math.ceil(
        uploadJson.duration
      )}s)`
    );
  }

  return {
    url: uploadJson.secure_url,
    type: preview.kind,
    publicId: uploadJson.public_id,
  };
}

async function uploadPreviewWithMetadata(preview: MediaPreview): Promise<BusinessMediaItem> {
  const base = await uploadMediaDirect(preview);
  return attachVideoMetadata(preview, base);
}

async function uploadMediaBatched(mediaPreviews: MediaPreview[]): Promise<BusinessMediaItem[]> {
  const uploadedMedia: BusinessMediaItem[] = [];
  const batchSize = 3;

  for (let i = 0; i < mediaPreviews.length; i += batchSize) {
    const batch = mediaPreviews.slice(i, i + batchSize);
    const uploadedBatch = await Promise.all(batch.map((preview) => uploadPreviewWithMetadata(preview)));
    uploadedMedia.push(...uploadedBatch);
  }

  return uploadedMedia;
}

interface VideoMetadataEditorProps {
  title?: string;
  thumbnailUrl?: string;
  onTitleChange: (title: string) => void;
  onThumbnailSelect: (file: File) => void;
  onThumbnailRemove: () => void;
}

function VideoMetadataEditor({
  title,
  thumbnailUrl,
  onTitleChange,
  onThumbnailSelect,
  onThumbnailRemove,
}: VideoMetadataEditorProps) {
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="mt-2 space-y-2 rounded-lg bg-gray-50 p-2">
      <input
        type="text"
        value={title ?? ""}
        onChange={(event) => onTitleChange(event.target.value)}
        placeholder="Video title (optional)"
        className="w-full h-9 px-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 text-xs"
      />
      {thumbnailUrl ? (
        <div className="flex items-center gap-2">
          <div className="relative h-14 w-20 rounded overflow-hidden border border-gray-300">
            <img src={thumbnailUrl} alt="Video thumbnail" className="w-full h-full object-cover" />
          </div>
          <button
            type="button"
            onClick={onThumbnailRemove}
            className="text-xs text-red-600 hover:text-red-700 font-medium"
          >
            Remove thumbnail
          </button>
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => thumbnailInputRef.current?.click()}
        className="w-full h-9 border border-dashed border-gray-400 rounded-lg text-xs font-medium text-gray-700 hover:bg-white transition-colors"
      >
        {thumbnailUrl ? "Change thumbnail" : "Add thumbnail (optional)"}
      </button>
      <input
        ref={thumbnailInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onThumbnailSelect(file);
          event.target.value = "";
        }}
      />
    </div>
  );
}

export function BusinessForm({ business, onSuccess }: BusinessFormProps = {}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditing = !!business?.id;

  const [businessName, setBusinessName] = useState<string>(business?.businessName ?? "");
  const [serviceHours, setServiceHours] = useState<string>(business?.serviceHours ?? "");
  const [businessDescription, setBusinessDescription] = useState<string>(business?.businessDescription ?? "");
  const [serviceAreas, setServiceAreas] = useState<string>(business?.serviceAreas ?? "");
  const [selectedBusinessType, setSelectedBusinessType] = useState<string>(business?.businessType ?? "");
  const [selectedServices, setSelectedServices] = useState<string[]>(business?.services ?? []);
  const [existingMedia, setExistingMedia] = useState<EditableMediaItem[]>(() => getInitialMedia(business));
  const [mediaPreviews, setMediaPreviews] = useState<MediaPreview[]>([]);
  const [submitMessage, setSubmitMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [businessTypes, setBusinessTypes] = useState<string[]>(() => {
    const defaults = ["Restaurant", "Retail", "Service"];
    if (business?.businessType && !defaults.includes(business.businessType)) {
      return [...defaults, business.businessType];
    }
    return defaults;
  });
  const [businessTypeInput, setBusinessTypeInput] = useState<string>("");
  const [servicesOptions, setServicesOptions] = useState<string[]>(() => {
    const defaults = ["care", "food", "bath", "groom"];
    for (const service of business?.services ?? []) {
      const normalized = service.toLowerCase();
      if (!defaults.includes(normalized)) defaults.push(normalized);
    }
    return defaults;
  });
  const [servicesInput, setServicesInput] = useState<string>("");

  function validateForm(): FieldErrors {
    const errors: FieldErrors = {};
    if (!businessName.trim()) errors.businessName = "Business name is required.";
    if (!selectedBusinessType.trim()) errors.businessType = "Business type is required.";
    if (selectedServices.length === 0) errors.services = "Select at least one service.";
    if (selectedServices.length > 3) errors.services = "Maximum 3 services are allowed.";
    return errors;
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const finalizedExisting = await Promise.all(existingMedia.map((item) => finalizeExistingMediaItem(item)));
      const uploadedMedia = await uploadMediaBatched(mediaPreviews);
      const mergedMedia = dedupeMedia([...finalizedExisting, ...uploadedMedia]);

      const payloadBase = {
        businessName: businessName.trim(),
        businessType: selectedBusinessType.trim(),
        services: selectedServices.map((service) => service.trim().toLowerCase()),
        serviceHours: serviceHours.trim(),
        businessDescription: businessDescription.trim(),
        serviceAreas: serviceAreas.trim(),
        media: mergedMedia,
      };

      const response = isEditing && business
        ? await apiFetch<BusinessEntity>(`/business/${business.id}`, {
            method: "PATCH",
            body: JSON.stringify(payloadBase satisfies UpdateBusinessRequest),
          })
        : await apiFetch<BusinessEntity>("/business", {
            method: "POST",
            body: JSON.stringify(payloadBase satisfies CreateBusinessRequest),
          });

      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to save business");
      }

      return response.data;
    },
    onSuccess: (savedBusiness) => {
      for (const preview of mediaPreviews) {
        URL.revokeObjectURL(preview.url);
        if (preview.thumbnailPreviewUrl) URL.revokeObjectURL(preview.thumbnailPreviewUrl);
      }

      setMediaPreviews([]);
      setExistingMedia(savedBusiness.media);
      setSubmitMessage({
        type: "success",
        text: isEditing ? "Business updated successfully." : "Business created successfully.",
      });
      setFieldErrors({});

      queryClient.invalidateQueries({ queryKey: ["businesses"] });
      queryClient.invalidateQueries({ queryKey: ["business", savedBusiness.id] });

      if (onSuccess) {
        onSuccess();
        return;
      }

      if (!isEditing) {
        router.push(`/local-business/${savedBusiness.id}`);
      }
    },
    onError: (error) => {
      setSubmitMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Unable to save business.",
      });
    },
  });
  const isSubmitting = saveMutation.isPending;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saveMutation.isPending) return;

    const errors = validateForm();
    setFieldErrors(errors);
    setSubmitMessage(null);
    if (Object.keys(errors).length > 0) {
      setSubmitMessage({ type: "error", text: "Please fix validation errors and try again." });
      return;
    }

    await saveMutation.mutateAsync();
  };

  const handleFormKeyDown = (event: React.KeyboardEvent<HTMLFormElement>) => {
    if (event.key !== "Enter") return;

    const target = event.target as HTMLElement;
    if (target instanceof HTMLTextAreaElement) return;

    // Keep Enter behavior for explicit tag/type add flows.
    if (target instanceof HTMLInputElement) {
      const inputMode = target.type?.toLowerCase() ?? "text";
      if (
        target.value.trim() &&
        (target.placeholder.includes("press Enter") || target.placeholder.includes("Type new"))
      ) {
        return;
      }

      // Prevent implicit form submit from regular input fields.
      if (["text", "search", "email", "tel", "url", "number"].includes(inputMode)) {
        event.preventDefault();
        target.blur();
      }
    }
  };

  const handleBusinessTypeKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const name = businessTypeInput.trim();
    if (!name) return;

    const existing = businessTypes.find((item) => item.toLowerCase() === name.toLowerCase());
    if (!existing) {
      setBusinessTypes((prev) => [...prev, name]);
      setSelectedBusinessType(name);
    } else {
      setSelectedBusinessType(existing);
    }
    setBusinessTypeInput("");
  };

  const handleServicesKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const value = servicesInput.trim().toLowerCase();
    if (!value || selectedServices.length >= 3) return;
    if (selectedServices.some((service) => service.toLowerCase() === value)) {
      setServicesInput("");
      return;
    }

    if (!servicesOptions.some((service) => service.toLowerCase() === value)) {
      setServicesOptions((prev) => [...prev, value]);
    }

    setSelectedServices((prev) => [...prev, value].slice(0, 3));
    setServicesInput("");
  };

  const handleServicesSelect = (service: string) => {
    const normalized = service.toLowerCase();
    if (selectedServices.length >= 3) return;
    if (selectedServices.some((current) => current.toLowerCase() === normalized)) return;
    setSelectedServices((prev) => [...prev, normalized].slice(0, 3));
  };

  const handleRemoveService = (index: number) => {
    setSelectedServices((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleMediaUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const nextPreviews: MediaPreview[] = Array.from(files).map((file) => ({
      url: URL.createObjectURL(file),
      file,
      kind: file.type.startsWith("video/") ? "video" : "image",
    }));
    setMediaPreviews((prev) => [...prev, ...nextPreviews]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveMediaPreview = (index: number) => {
    setMediaPreviews((prev) => {
      const next = [...prev];
      const [removed] = next.splice(index, 1);
      if (removed) {
        URL.revokeObjectURL(removed.url);
        if (removed.thumbnailPreviewUrl) URL.revokeObjectURL(removed.thumbnailPreviewUrl);
      }
      return next;
    });
  };

  const handleRemoveExistingMedia = (index: number) => {
    const item = existingMedia[index];
    if (item?.thumbnailPublicId) {
      deleteUploadedMedia(item.thumbnailPublicId, "image").catch((error: unknown) => {
        console.warn("[BusinessForm] Failed to delete thumbnail:", error);
      });
    }
    if (item?.pendingThumbnailPreviewUrl) URL.revokeObjectURL(item.pendingThumbnailPreviewUrl);

    setExistingMedia((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleExistingVideoTitleChange = (index: number, title: string) => {
    setExistingMedia((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], title };
      return next;
    });
  };

  const handleExistingVideoThumbnailSelect = (index: number, file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setExistingMedia((prev) => {
      const next = [...prev];
      const current = next[index];
      if (current?.pendingThumbnailPreviewUrl) URL.revokeObjectURL(current.pendingThumbnailPreviewUrl);
      next[index] = {
        ...next[index],
        pendingThumbnailFile: file,
        pendingThumbnailPreviewUrl: previewUrl,
      };
      return next;
    });
  };

  const handleExistingVideoThumbnailRemove = (index: number) => {
    const item = existingMedia[index];
    if (item?.thumbnailPublicId) {
      deleteUploadedMedia(item.thumbnailPublicId, "image").catch((error: unknown) => {
        console.warn("[BusinessForm] Failed to delete thumbnail:", error);
      });
    }
    if (item?.pendingThumbnailPreviewUrl) URL.revokeObjectURL(item.pendingThumbnailPreviewUrl);

    setExistingMedia((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        thumbnailUrl: undefined,
        thumbnailPublicId: undefined,
        pendingThumbnailFile: undefined,
        pendingThumbnailPreviewUrl: undefined,
      };
      return next;
    });
  };

  const handlePreviewVideoTitleChange = (index: number, title: string) => {
    setMediaPreviews((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], title };
      return next;
    });
  };

  const handlePreviewVideoThumbnailSelect = (index: number, file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setMediaPreviews((prev) => {
      const next = [...prev];
      const current = next[index];
      if (current?.thumbnailPreviewUrl) URL.revokeObjectURL(current.thumbnailPreviewUrl);
      next[index] = {
        ...next[index],
        thumbnailFile: file,
        thumbnailPreviewUrl: previewUrl,
        thumbnailUrl: undefined,
        thumbnailPublicId: undefined,
      };
      return next;
    });
  };

  const handlePreviewVideoThumbnailRemove = (index: number) => {
    setMediaPreviews((prev) => {
      const next = [...prev];
      const current = next[index];
      if (current?.thumbnailPreviewUrl) URL.revokeObjectURL(current.thumbnailPreviewUrl);
      next[index] = {
        ...next[index],
        thumbnailFile: undefined,
        thumbnailPreviewUrl: undefined,
        thumbnailUrl: undefined,
        thumbnailPublicId: undefined,
      };
      return next;
    });
  };

  return (
    <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="space-y-8">
      {/* Success/Error Message */}
      {submitMessage && (
        <div
          className={cn(
            "p-4 rounded-xl text-sm font-medium",
            submitMessage.type === "success"
              ? "bg-green-50 text-green-800 border-2 border-green-200"
              : "bg-red-50 text-red-800 border-2 border-red-200"
          )}
        >
          {submitMessage.text}
        </div>
      )}

      <fieldset disabled={isSubmitting} className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Business Name */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Business Name
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(event) => setBusinessName(event.target.value)}
              placeholder="Enter the Business name"
              className="w-full h-12 px-4 bg-white border-2 border-red-600 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 text-sm cursor-text"
            />
            {fieldErrors.businessName && <p className="mt-1 text-xs text-red-600">{fieldErrors.businessName}</p>}
          </div>

          {/* Services (max 3) */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Services (max 3)
            </label>
            {selectedServices.map((s, index) => (
              <input key={`${s}-${index}`} type="hidden" name="services" value={s} />
            ))}
            <div className="space-y-2">
              {selectedServices.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedServices.map((s, i) => (
                    <span
                    key={`${s}-${i}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-100 text-red-800 text-sm capitalize"
                    >
                      {s}
                      <button
                        type="button"
                        onClick={() => handleRemoveService(i)}
                        className="p-0.5 rounded hover:bg-red-200"
                        aria-label={`Remove ${s}`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {selectedServices.length < 3 && (
                <>
                  <select
                    onChange={(event) => {
                      const value = event.target.value;
                      if (value) handleServicesSelect(value);
                      event.target.value = "";
                    }}
                    className="w-full h-12 px-4 border-2 border-red-600 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 text-sm cursor-pointer capitalize"
                  >
                    <option value="">Select a service</option>
                    {servicesOptions
                      .filter((opt) => !selectedServices.some((s) => s.toLowerCase() === opt.toLowerCase()))
                      .map((service) => (
                        <option key={service} value={service}>
                          {service}
                        </option>
                      ))}
                  </select>
                  <input
                    type="text"
                    value={servicesInput}
                    onChange={(event) => setServicesInput(event.target.value)}
                    onKeyDown={handleServicesKeyDown}
                    placeholder="Or type new service and press Enter (max 3)"
                    className="w-full h-12 px-4 border-2 border-red-600 rounded-xl bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 text-sm"
                  />
                </>
              )}
            </div>
            {fieldErrors.services && <p className="mt-1 text-xs text-red-600">{fieldErrors.services}</p>}
          </div>

          {/* Service Hours */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Service Hours
            </label>
            <input
              type="text"
              value={serviceHours}
              onChange={(event) => setServiceHours(event.target.value)}
              placeholder="Enter the operating hours"
              className="w-full h-12 px-4 bg-white border-2 border-red-600 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 text-sm cursor-text"
            />
            <p className="mt-1 text-xs text-gray-500">E.g. 9:00 AM - 5:00 PM</p>
          </div>

          {/* Business Description */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Business Description
            </label>
            <textarea
              value={businessDescription}
              onChange={(event) => setBusinessDescription(event.target.value)}
              placeholder="Enter the Description"
              rows={5}
              className="w-full px-4 py-3 bg-white border-2 border-red-600 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 resize-none text-sm cursor-text"
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Business Type */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Business Type
            </label>
            <div className="space-y-2">
              <select
                name="businessType"
                value={selectedBusinessType}
                onChange={(event) => setSelectedBusinessType(event.target.value)}
                className="w-full h-12 px-4 border-2 border-red-600 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 text-sm cursor-pointer"
              >
                <option value="">Select or type below</option>
                {businessTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={businessTypeInput}
                onChange={(event) => setBusinessTypeInput(event.target.value)}
                onKeyDown={handleBusinessTypeKeyDown}
                placeholder="Type new business type and press Enter to add"
                className="w-full h-12 px-4 border-2 border-red-600 rounded-xl bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 text-sm"
              />
              {selectedBusinessType && (
                <div className="inline-flex items-center gap-2 rounded-full bg-red-100 text-red-800 px-3 py-1 text-sm">
                  <span>{selectedBusinessType}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedBusinessType("")}
                    className="rounded hover:bg-red-200 p-0.5"
                    aria-label="Remove selected business type"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
            {fieldErrors.businessType && <p className="mt-1 text-xs text-red-600">{fieldErrors.businessType}</p>}
          </div>

          {/* Service Areas */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Service Areas
            </label>
            <input
              type="text"
              value={serviceAreas}
              onChange={(event) => setServiceAreas(event.target.value)}
              placeholder="Enter service areas"
              className="w-full h-12 px-4 bg-white border-2 border-red-600 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 text-sm cursor-text"
            />
            <p className="mt-1 text-xs text-gray-500">E.g. City, Neighborhoods</p>
          </div>

          {/* Add Images */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Add Media (Images / Videos)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleMediaUpload}
              className="hidden"
            />

            {/* Existing Media */}
            {existingMedia.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Existing Media:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {existingMedia.map((item, index) => (
                    <div key={index} className="space-y-0">
                      <div className="relative group aspect-square rounded-xl overflow-hidden border-2 border-gray-300">
                        {item.type === "video" ? (
                          item.thumbnailUrl || item.pendingThumbnailPreviewUrl ? (
                            <img
                              src={item.pendingThumbnailPreviewUrl ?? item.thumbnailUrl}
                              alt={item.title || `Video ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <video
                              src={item.url}
                              className="w-full h-full object-cover"
                              controls
                            />
                          )
                        ) : (
                          <img
                            src={item.url}
                            alt={`Existing ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingMedia(index)}
                          className="absolute top-2 right-2 w-8 h-8 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <svg
                            className="w-4 h-4 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                      {item.type === "video" && (
                        <VideoMetadataEditor
                          title={item.title}
                          thumbnailUrl={item.pendingThumbnailPreviewUrl ?? item.thumbnailUrl}
                          onTitleChange={(title) => handleExistingVideoTitleChange(index, title)}
                          onThumbnailSelect={(file) => handleExistingVideoThumbnailSelect(index, file)}
                          onThumbnailRemove={() => handleExistingVideoThumbnailRemove(index)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Area */}
            {mediaPreviews.length === 0 && existingMedia.length === 0 ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-48 border-2 border-dashed border-red-600 rounded-xl flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center mb-3">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-700">Add New Media</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Media Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {mediaPreviews.map((preview, index) => (
                    <div key={index} className="space-y-1">
                      <div className="relative group aspect-square rounded-xl overflow-hidden border-2 border-red-600">
                        {preview.kind === "video" ? (
                          preview.thumbnailPreviewUrl ? (
                            <img
                              src={preview.thumbnailPreviewUrl}
                              alt={preview.title || `Video ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <video
                              src={preview.url}
                              className="w-full h-full object-cover"
                              controls
                            />
                          )
                        ) : (
                          <img
                            src={preview.url}
                            alt={`Uploaded ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveMediaPreview(index)}
                          className="absolute top-2 right-2 w-8 h-8 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <svg
                            className="w-4 h-4 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                      {preview.kind === "video" ? (
                        <VideoMetadataEditor
                          title={preview.title}
                          thumbnailUrl={preview.thumbnailPreviewUrl}
                          onTitleChange={(value) => handlePreviewVideoTitleChange(index, value)}
                          onThumbnailSelect={(file) => handlePreviewVideoThumbnailSelect(index, file)}
                          onThumbnailRemove={() => handlePreviewVideoThumbnailRemove(index)}
                        />
                      ) : null}
                    </div>
                  ))}
                </div>

                {/* Add More Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-12 border-2 border-dashed border-red-600 rounded-xl flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center mr-2">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    Add More Media
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </fieldset>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-3 text-base rounded-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Saving..." : isEditing ? "Save Business" : "Save Business"}
        </Button>
      </div>
    </form>
  );
}