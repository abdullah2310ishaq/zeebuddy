"use client";

import { useAuth } from "@/contexts/AuthContext";

export function PersonalInfoSection() {
  const { user } = useAuth();
  const authType = user?.authType ?? "google";

  if (authType === "google") {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 lg:p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Account</h2>
        <p className="text-sm text-gray-600 mb-4">
          You are logged in using Google.
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Email</label>
            <p className="text-gray-600">{user?.email || "—"}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 lg:p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-2">Account</h2>
      <p className="text-sm text-gray-600 mb-6">
        Update your email and password.
      </p>
      <div className="space-y-6 max-w-md">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Email</label>
          <input
            type="email"
            defaultValue={user?.email || ""}
            readOnly
            className="w-full h-12 px-4 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-700 cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Change Password</label>
          <input
            type="password"
            placeholder="Enter new password"
            className="w-full h-12 px-4 bg-white border-2 border-red-600 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 text-sm cursor-text"
          />
          <p className="mt-1 text-xs text-gray-500">Leave blank to keep current password</p>
        </div>
      </div>
    </div>
  );
}
