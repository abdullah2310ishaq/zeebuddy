"use client";

import { useState, useRef } from "react";
import { MetricCard } from "./MetricCard";
import { cn } from "@/lib/utils";
import { MetricCard as MetricCardType } from "@/types/dashboard";
import { useClickOutside } from "@/hooks/useClickOutside";

interface OverviewSectionProps {
  metrics: MetricCardType[];
  className?: string;
  dateRangeDays?: number;
  onDateRangeChange?: (days: number) => void;
}

const DATE_OPTIONS = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
  { label: "This year", days: 365 },
];

export function OverviewSection({ metrics, className, dateRangeDays = 30, onDateRangeChange }: OverviewSectionProps) {
  const [isDateRangeOpen, setIsDateRangeOpen] = useState(false);
  const dateRangeRef = useRef<HTMLDivElement>(null);

  useClickOutside(dateRangeRef, () => setIsDateRangeOpen(false));

  const currentLabel = DATE_OPTIONS.find((o) => o.days === dateRangeDays)?.label ?? "Last 30 days";

  return (
    <div className={cn("p-4 sm:p-6 lg:p-8", className)}>
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-xl font-bold text-gray-900">Overview</h2>

        {/* Date Range Selector */}
        <div className="relative" ref={dateRangeRef}>
          <button
            onClick={() => setIsDateRangeOpen(!isDateRangeOpen)}
            className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors w-full sm:w-auto cursor-pointer"
          >
            <span className="mr-2">{currentLabel}</span>
            <svg
              className={cn(
                "w-4 h-4 transition-transform",
                isDateRangeOpen && "rotate-180"
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Date Range Dropdown */}
          {isDateRangeOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              {DATE_OPTIONS.map((opt) => (
                <button
                  key={opt.days}
                  onClick={() => {
                    onDateRangeChange?.(opt.days);
                    setIsDateRangeOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {metrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </div>
    </div>
  );
}
