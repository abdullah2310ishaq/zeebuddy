"use client";

export function GeneralSection() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6 lg:gap-8">
      <div>
        <div className="flex items-center space-x-2 mb-2">
          <h2 className="text-xl font-bold text-gray-900">General</h2>
          <button
            type="button"
            className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors cursor-pointer"
            aria-label="General section info"
          >
            <svg
              className="w-3 h-3 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        </div>
        <p className="text-sm text-gray-600">
          You can change your payment credentials here.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="text-sm text-gray-500">No additional general options.</p>
      </div>
    </div>
  );
}
