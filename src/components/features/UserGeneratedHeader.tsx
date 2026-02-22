"use client";

import { Input } from "@/components/ui/Input";
import { UserProfileDropdown } from "./UserProfileDropdown";

interface UserGeneratedHeaderProps {
  onMenuToggle: () => void;
}

export function UserGeneratedHeader({
  onMenuToggle,
}: UserGeneratedHeaderProps) {
  return (
    <header className="flex flex-col lg:flex-row lg:items-center justify-between p-6 lg:p-8 border-b border-gray-200 gap-4">
      <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 border-b-2 border-gray-900 pb-1 w-fit">
        User Generated
      </h1>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 lg:gap-6">
        <div className="w-full sm:w-64 lg:w-80">
          <Input
            placeholder="Search for anything..."
            className="w-full h-12 px-4 bg-red-600 text-white placeholder:text-white/80 rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-text"
          />
        </div>

        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer self-start"
          aria-label="Menu"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <UserProfileDropdown variant="compact" />
      </div>
    </header>
  );
}
