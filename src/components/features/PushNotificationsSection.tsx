"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface PushNotificationsSectionProps {
  enabled: boolean;
  onToggle?: (enabled: boolean) => void;
  className?: string;
}

export function PushNotificationsSection({
  enabled: initialEnabled,
  onToggle,
  className,
}: PushNotificationsSectionProps) {
  const [enabled, setEnabled] = useState(initialEnabled);

  const handleToggle = () => {
    const next = !enabled;
    setEnabled(next);
    onToggle?.(next);
  };

  return (
    <div className={cn("p-4 sm:p-6 lg:p-8", className)}>
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">
        Push notifications to users
      </h2>
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg max-w-md">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full flex items-center justify-center mr-4 bg-orange-100 text-orange-600">
            <span className="text-lg" aria-hidden>🔔</span>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">
              Push notifications to users
            </h3>
            <span
              className={cn(
                "text-sm",
                enabled ? "text-green-600" : "text-gray-500"
              )}
            >
              {enabled ? "Enabled" : "Disabled"}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2",
            enabled ? "bg-green-500" : "bg-gray-300"
          )}
          aria-label={enabled ? "Disable push notifications" : "Enable push notifications"}
          role="switch"
          aria-checked={enabled}
        >
          <span
            className={cn(
              "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
              enabled ? "translate-x-6" : "translate-x-1"
            )}
          />
        </button>
      </div>
    </div>
  );
}
