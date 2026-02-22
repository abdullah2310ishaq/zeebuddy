"use client";

import { cn } from "@/lib/utils";
import { Contributor } from "@/types/dashboard";

interface TopContributorsSectionProps {
  contributors: Contributor[];
  className?: string;
}

export function TopContributorsSection({
  contributors,
  className,
}: TopContributorsSectionProps) {
  return (
    <div className={cn("p-4 sm:p-6 lg:p-8 mt-8", className)}>
      <h2 className="text-xl font-bold text-gray-900 mb-4 sm:mb-6">
        Top contributors
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {contributors.map((contributor) => (
          <div
            key={contributor.id}
            className="flex flex-col items-center p-6 bg-gray-50 rounded-xl border border-gray-100"
          >
            <img
              src={contributor.avatar}
              alt=""
              className="w-16 h-16 rounded-full object-cover mb-3"
            />
            <h3 className="font-semibold text-gray-900 text-center">
              {contributor.name}
            </h3>
            <p className="text-sm text-gray-500 text-center mt-1">
              {contributor.roleOrStat}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
