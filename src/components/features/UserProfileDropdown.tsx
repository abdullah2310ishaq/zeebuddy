"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useClickOutside } from "@/hooks/useClickOutside";
import { cn } from "@/lib/utils";

function getInitials(name: string | undefined): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
  }
  return name.slice(0, 2).toUpperCase();
}

interface UserProfileDropdownProps {
  variant?: "default" | "compact";
  className?: string;
}

export function UserProfileDropdown({ variant = "default", className }: UserProfileDropdownProps) {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setIsOpen(false));

  const initials = getInitials(user?.name);
  const displayName = user?.name || "Admin";
  const displaySubtitle = user?.email || (user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "");

  return (
    <div className={cn("relative", className)} ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center space-x-3 rounded-lg p-2 transition-colors cursor-pointer",
          variant === "compact" ? "hover:bg-gray-100" : "hover:bg-gray-50"
        )}
      >
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shrink-0">
          <span className="text-white font-semibold text-sm sm:text-lg">{initials}</span>
        </div>
        <div className={cn("flex flex-col items-start text-left", variant === "compact" ? "hidden md:block" : "")}>
          <div className="flex items-center">
            <span className="text-gray-900 font-medium">{displayName}</span>
            <svg
              className={cn(
                "w-4 h-4 ml-2 text-red-500 transition-transform shrink-0",
                isOpen && "rotate-180"
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <span className="text-sm text-gray-500">{displaySubtitle}</span>
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          <Link
            href="/settings"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
            onClick={() => setIsOpen(false)}
          >
            Settings
          </Link>
          <hr className="my-2" />
          <button
            onClick={signOut}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
