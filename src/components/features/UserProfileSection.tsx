"use client";

import { useAuth } from "@/contexts/AuthContext";

function getInitials(name: string | undefined): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
  }
  return name.slice(0, 2).toUpperCase();
}

export function UserProfileSection() {
  const { user } = useAuth();
  const initials = getInitials(user?.name);
  const displayName = user?.name || "Admin";
  const displayEmail = user?.email || "";

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 lg:p-8">
      <div className="flex items-center space-x-6">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-2xl">{initials}</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{displayName}</h2>
          <p className="text-gray-600 mt-1">{displayEmail}</p>
          {user?.role && (
            <span className="inline-block mt-2 px-2 py-1 bg-red-600 text-white text-xs font-semibold rounded">
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
