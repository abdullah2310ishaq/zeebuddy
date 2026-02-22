"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { BusinessForm } from "./BusinessForm";
import { BusinessList } from "./BusinessList";

type Tab = "add" | "list";

export function BusinessTabs() {
  const [activeTab, setActiveTab] = useState<Tab>("add");

  return (
    <div className="space-y-6">
      {/* Tabs - pill / circular edges */}
      <div className="border-b-2 border-gray-200">
        <nav className="flex gap-2">
          <button
            onClick={() => setActiveTab("add")}
            className={cn(
              "px-5 py-3 text-sm font-medium rounded-full transition-colors cursor-pointer",
              activeTab === "add"
                ? "bg-red-600 text-white"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            )}
          >
            Add Business
          </button>
          <button
            onClick={() => setActiveTab("list")}
            className={cn(
              "px-5 py-3 text-sm font-medium rounded-full transition-colors cursor-pointer",
              activeTab === "list"
                ? "bg-red-600 text-white"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            )}
          >
            View All Businesses
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "add" && <BusinessForm />}
        {activeTab === "list" && <BusinessList />}
      </div>
    </div>
  );
}

