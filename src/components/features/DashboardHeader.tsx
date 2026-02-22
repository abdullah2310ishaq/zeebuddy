"use client";

import { cn } from "@/lib/utils";
import { UserProfileDropdown } from "./UserProfileDropdown";

interface DashboardHeaderProps {
  className?: string;
  onMenuToggle?: () => void;
}

export function DashboardHeader({
  className,
  onMenuToggle,
}: DashboardHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 sm:p-6 lg:p-8 border-b border-gray-200 gap-4 lg:gap-0",
        className
      )}
    >
      {/* Left Side - Title and Mobile Menu */}
      <div className="flex items-center space-x-4">
        {/* Hamburger Menu Button - Mobile Only */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="Toggle menu"
        >
          <svg
            className="w-6 h-6 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Dashboard
        </h1>
      </div>

      {/* Right Side - Search and User Profile */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center w-full lg:w-auto space-y-4 sm:space-y-0 sm:space-x-6">
        {/* Search Bar */}
        <div className="w-full sm:w-80 relative">
          <input
            type="text"
            placeholder="Search for anything..."
            className="w-full h-12 px-4 bg-red-600 text-white placeholder:text-white/80 rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-text"
          />
        </div>

        {/* User Profile */}
        <UserProfileDropdown />
      </div>
    </div>
  );
}
