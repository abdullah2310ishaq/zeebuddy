"use client";

import React, { useState, useRef, ChangeEvent, FormEvent } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { saveBusinessMongo, updateBusinessMongo } from "@/actions/business-mongo";

interface Business {
  id: string;
  businessName: string;
  services: string | string[];
  serviceHours: string;
  businessDescription: string;
  businessType: string;
  serviceAreas: string;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}
import { useQueryClient } from "@tanstack/react-query";

interface ImagePreview {
  url: string;
  file: File;
}

interface BusinessFormProps {
  business?: Business | null;
  onSuccess?: () => void;
}

export function BusinessForm({ business, onSuccess }: BusinessFormProps = {}) {
  const queryClient = useQueryClient();
  const isEditing = !!business;
  const [selectedBusinessType, setSelectedBusinessType] = useState<string>(business?.businessType || "");
  const [selectedServices, setSelectedServices] = useState<string[]>(() => {
    const s = business?.services;
    if (Array.isArray(s)) return s.slice(0, 3);
    if (typeof s === 'string' && s.trim()) return [s.trim()];
    return [];
  });
  const [existingImages, setExistingImages] = useState<string[]>(business?.images || []);
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const businessTypeInputRef = useRef<HTMLInputElement>(null);
  const servicesInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [businessTypes, setBusinessTypes] = useState<string[]>(() => {
    const defaults = ["Restaurant", "Retail", "Service"];
    if (business?.businessType && !defaults.includes(business.businessType)) {
      return [...defaults, business.businessType];
    }
    return defaults;
  });
  const [businessTypeInput, setBusinessTypeInput] = useState("");
  const [servicesOptions, setServicesOptions] = useState<string[]>(() => {
    const defaults = ["care", "food", "bath", "groom"];
    const s = business?.services;
    const arr = Array.isArray(s) ? s : typeof s === 'string' && s ? [s] : [];
    arr.forEach((svc) => {
      const lower = String(svc).toLowerCase();
      if (lower && !defaults.includes(lower)) defaults.push(lower);
    });
    return defaults;
  });
  const [servicesInput, setServicesInput] = useState("");

  const handleBusinessTypeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter" || !businessTypeInput.trim()) return;
    e.preventDefault();
    const name = businessTypeInput.trim();
    const existing = businessTypes.find((t) => t.toLowerCase() === name.toLowerCase());
    if (existing) {
      setSelectedBusinessType(existing);
      setBusinessTypeInput("");
      return;
    }
    setBusinessTypes((prev) => [...prev, name]);
    setSelectedBusinessType(name);
    setBusinessTypeInput("");
  };

  const handleServicesKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter" || !servicesInput.trim()) return;
    e.preventDefault();
    const name = servicesInput.trim().toLowerCase();
    if (selectedServices.length >= 3) return;
    const already = selectedServices.some((s) => s.toLowerCase() === name);
    if (already) {
      setServicesInput("");
      return;
    }
    const existingOpt = servicesOptions.find((s) => s.toLowerCase() === name);
    if (!existingOpt) setServicesOptions((prev) => [...prev, name]);
    setSelectedServices((prev) => [...prev, name].slice(0, 3));
    setServicesInput("");
  };

  const handleServicesSelect = (service: string) => {
    const lower = service.toLowerCase();
    if (selectedServices.some((s) => s.toLowerCase() === lower)) return;
    if (selectedServices.length >= 3) return;
    setSelectedServices((prev) => [...prev, lower].slice(0, 3));
  };

  const handleRemoveService = (index: number) => {
    setSelectedServices((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newPreviews: ImagePreview[] = Array.from(files).map((file) => ({
        url: URL.createObjectURL(file),
        file: file,
      }));
      setImagePreviews((prev) => [...prev, ...newPreviews]);
    }
    // Reset input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setImagePreviews((prev) => {
      const newPreviews = [...prev];
      URL.revokeObjectURL(newPreviews[index].url);
      newPreviews.splice(index, 1);
      return newPreviews;
    });
  };

  const handleBusinessTypeSelect = (type: string) => {
    setSelectedBusinessType(type);
  };

  const handleRemoveExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedServices.length === 0) {
      setSubmitMessage({ type: 'error', text: 'Select at least one service (max 3).' });
      return;
    }
    setIsSubmitting(true);
    setSubmitMessage(null);

    const formData = new FormData(e.currentTarget);
    
    // Add existing images to form data
    formData.append('existingImages', JSON.stringify(existingImages));
    
    // Add new images to form data
    imagePreviews.forEach((preview) => {
      formData.append('images', preview.file);
    });

    try {
      let result;
      if (isEditing && business) {
        result = await updateBusinessMongo(business.id, formData);
      } else {
        result = await saveBusinessMongo(formData);
      }
      
      if (result.success) {
            setSubmitMessage({ type: 'success', text: result.message });
        queryClient.invalidateQueries({ queryKey: ["businesses"] });
        
        if (onSuccess) {
          onSuccess();
        } else {
          // Reset form only if not editing
          if (!isEditing) {
            formRef.current?.reset();
            setSelectedBusinessType('');
            setSelectedServices([]);
            setImagePreviews([]);
            setExistingImages([]);
            // Clear image previews URLs
            imagePreviews.forEach((preview) => {
              URL.revokeObjectURL(preview.url);
            });
          }
        }
      } else {
        setSubmitMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setSubmitMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'An error occurred while saving the business',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
      {/* Success/Error Message */}
      {submitMessage && (
        <div
          className={cn(
            "p-4 rounded-xl text-sm font-medium",
            submitMessage.type === 'success'
              ? "bg-green-50 text-green-800 border-2 border-green-200"
              : "bg-red-50 text-red-800 border-2 border-red-200"
          )}
        >
          {submitMessage.text}
        </div>
      )}

      {/* Form Fields */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Business Name */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Business Name
            </label>
            <input
              type="text"
              name="businessName"
              defaultValue={business?.businessName || ""}
              placeholder="Enter the Business name"
              required
              className="w-full h-12 px-4 bg-white border-2 border-red-600 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 text-sm cursor-text"
            />
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
                      key={i}
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
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v) handleServicesSelect(v);
                      e.target.value = '';
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
                    ref={servicesInputRef}
                    type="text"
                    value={servicesInput}
                    onChange={(e) => setServicesInput(e.target.value)}
                    onKeyDown={handleServicesKeyDown}
                    placeholder="Or type new service and press Enter (max 3)"
                    className="w-full h-12 px-4 border-2 border-red-600 rounded-xl bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 text-sm"
                  />
                </>
              )}
            </div>
          </div>

          {/* Service Hours */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Service Hours
            </label>
            <input
              type="text"
              name="serviceHours"
              defaultValue={business?.serviceHours || ""}
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
              name="businessDescription"
              defaultValue={business?.businessDescription || ""}
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
                onChange={(e) => setSelectedBusinessType(e.target.value)}
                required
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
                ref={businessTypeInputRef}
                type="text"
                value={businessTypeInput}
                onChange={(e) => setBusinessTypeInput(e.target.value)}
                onKeyDown={handleBusinessTypeKeyDown}
                placeholder="Type new business type and press Enter to add"
                className="w-full h-12 px-4 border-2 border-red-600 rounded-xl bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 text-sm"
              />
            </div>
          </div>

          {/* Service Areas */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Service Areas
            </label>
            <input
              type="text"
              name="serviceAreas"
              defaultValue={business?.serviceAreas || ""}
              placeholder="Enter service areas"
              className="w-full h-12 px-4 bg-white border-2 border-red-600 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 text-sm cursor-text"
            />
            <p className="mt-1 text-xs text-gray-500">E.g. City, Neighborhoods</p>
          </div>

          {/* Add Images */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Add Images
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />

            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Existing Images:</p>
                <div className="grid grid-cols-2 gap-4">
                  {existingImages.map((imageUrl, index) => (
                    <div
                      key={index}
                      className="relative group aspect-square rounded-xl overflow-hidden border-2 border-gray-300"
                    >
                      <img
                        src={imageUrl}
                        alt={`Existing ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingImage(index)}
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
                  ))}
                </div>
              </div>
            )}

            {/* Image Upload Area */}
            {imagePreviews.length === 0 && existingImages.length === 0 ? (
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
                <p className="text-sm font-medium text-gray-700">Add New Image</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Image Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div
                      key={index}
                      className="relative group aspect-square rounded-xl overflow-hidden border-2 border-red-600"
                    >
                      <img
                        src={preview.url}
                        alt={`Uploaded ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
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
                    Add More Images
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-3 text-base rounded-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Saving..." : isEditing ? "Update Business" : "Add New Business"}
        </Button>
      </div>
    </form>
  );
}