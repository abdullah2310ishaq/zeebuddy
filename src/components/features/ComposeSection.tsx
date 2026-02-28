"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";

interface DeliveryLog {
  index: number;
  success: boolean;
  messageId?: string;
  errorCode?: string;
  errorMessage?: string;
}

interface SendResult {
  id?: string;
  successCount: number;
  failureCount: number;
  totalTokens?: number;
  message?: string;
  deliveryLogs?: DeliveryLog[];
}

interface ComposeSectionProps {
  onPreviewChange?: (title: string, body: string) => void;
}

export function ComposeSection({ onPreviewChange }: ComposeSectionProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [lastResult, setLastResult] = useState<SendResult | null>(null);

  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch<SendResult>("/admin/push-notifications", {
        method: "POST",
        body: JSON.stringify({ title, body }),
      });
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: (data) => {
      setTitle("");
      setBody("");
      setLastResult(data ?? null);
      queryClient.invalidateQueries({ queryKey: ["push-notifications-history"] });
    },
    onError: (err) => {
      setLastResult({
        successCount: 0,
        failureCount: 0,
        deliveryLogs: [],
        message: err instanceof Error ? err.message : "Failed to send notification",
      });
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

        {/* Detailed logs from last send */}
        {lastResult && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Last send result</h3>
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 font-mono text-sm space-y-2">
              <p>
                <span className="text-gray-600">Summary:</span> Success: {lastResult.successCount}, Failed:{" "}
                {lastResult.failureCount}
                {lastResult.totalTokens != null && ` (${lastResult.totalTokens} token(s) total)`}
              </p>
              {lastResult.message && (
                <p className="text-amber-700">{lastResult.message}</p>
              )}
              {lastResult.deliveryLogs && lastResult.deliveryLogs.length > 0 && (
                <div className="mt-3">
                  <p className="text-gray-600 mb-2">Per-token delivery:</p>
                  <ul className="space-y-1.5 list-none">
                    {lastResult.deliveryLogs.map((log) => (
                      <li key={log.index} className="flex flex-wrap gap-x-2 gap-y-0.5">
                        <span className="text-gray-700">Token #{log.index}:</span>
                        {log.success ? (
                          <span className="text-green-700">OK</span>
                        ) : (
                          <>
                            <span className="text-red-700">Failed</span>
                            {log.errorCode && (
                              <span className="text-red-600">code={log.errorCode}</span>
                            )}
                            {log.errorMessage && (
                              <span className="text-red-600 break-all">message={log.errorMessage}</span>
                            )}
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                  {lastResult.deliveryLogs.some(
                    (l) =>
                      !l.success &&
                      (l.errorCode?.includes("mismatched-credential") || l.errorMessage?.toLowerCase().includes("senderid"))
                  ) && (
                    <p className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600">
                      <strong>SenderId mismatch?</strong> Even with the same Firebase project, this usually means the
                      stored FCM token is old (e.g. from a previous build). Have the user open the app and sign in again
                      so a new token is sent via <code className="bg-gray-200 px-1 rounded">POST /api/v1/user/fcm-token</code>.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
