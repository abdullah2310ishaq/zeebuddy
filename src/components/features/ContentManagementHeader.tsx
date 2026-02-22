"use client";

import { Input } from "@/components/ui/Input";
import { UserProfileDropdown } from "./UserProfileDropdown";

interface ContentManagementHeaderProps {
  onMenuToggle: () => void;
}

export function ContentManagementHeader({
  onMenuToggle,
}: ContentManagementHeaderProps) {
  return (
    <header className="flex items-center justify-between p-6 lg:p-8 border-b border-gray-200">
      {/* Title */}
      <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
        Content Management
      </h1>

      {/* Right Side - Search and User Profile */}
      <div className="flex items-center space-x-4">
        {/* Search Bar */}
        <div className="hidden md:block">
          <Input
            placeholder="Search for anything..."
            className="w-64 h-12 px-4 bg-red-600 text-white placeholder:text-white/80 rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-text"
          />
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
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

        {/* Notification Icon */}
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
          <div className="w-8 h-8 bg-red-600 rounded-full"></div>
        </button>

        {/* User Profile */}
        <UserProfileDropdown variant="compact" />
      </div>
    </header>
  );
}
