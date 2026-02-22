"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";

interface ComposeSectionProps {
  onPreviewChange?: (title: string, body: string) => void;
}

export function ComposeSection({ onPreviewChange }: ComposeSectionProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");


  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch<{ id: string; successCount: number; failureCount: number }>(
        "/admin/push-notifications",
        {
          method: "POST",
          body: JSON.stringify({ title, body }),
        }
      );
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: (data) => {
      setTitle("");
      setBody("");
      queryClient.invalidateQueries({ queryKey: ["push-notifications-history"] });
      alert(`Notification sent! Success: ${data?.successCount ?? 0}, Failed: ${data?.failureCount ?? 0}`);
    },
    onError: (err) => {
      alert(err instanceof Error ? err.message : "Failed to send notification");
    },
  });

  const handleSend = () => {
    if (!title.trim()) {
      alert("Please enter a title");
      return;
    }
    if (!body.trim()) {
      alert("Please enter a body");
      return;
    }
    sendMutation.mutate();
  };

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-6 lg:p-8">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Notification Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              const t = e.target.value;
              setTitle(t);
              onPreviewChange?.(t, body);
            }}
            placeholder="Enter notification title"
            className="w-full h-12 px-4 bg-white border-2 border-red-600 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Notification Body</label>
          <textarea
            value={body}
            onChange={(e) => {
              const b = e.target.value;
              setBody(b);
              onPreviewChange?.(title, b);
            }}
            placeholder="Write description"
            rows={7}
            className="w-full px-4 py-3 bg-white border-2 border-red-600 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 text-sm"
          />
        </div>
        <div className="pt-2 flex justify-end">
          <button
            onClick={handleSend}
            disabled={sendMutation.isPending}
            className="w-auto h-12 px-6 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sendMutation.isPending ? "Sending..." : "Send Notifications"}
          </button>
        </div>
      </div>
    </section>
  );
}
