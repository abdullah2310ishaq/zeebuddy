"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { SIDEBAR_GRADIENT } from "@/constants/colors";

export default function NotFound() {
  const router = useRouter();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{ background: SIDEBAR_GRADIENT }}
    >
      <div className="text-center max-w-md">
        <p className="text-white/90 text-6xl sm:text-8xl font-bold tracking-tight">
          404
        </p>
        <h1 className="text-white text-xl sm:text-2xl font-semibold mt-4">
          Oops, wrong page
        </h1>
        <p className="text-white/90 text-sm sm:text-base mt-2">
          This page does not exist. Navigate back to continue.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 rounded-full bg-white text-red-600 font-semibold hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Go to previous page
          </button>
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-full bg-white/20 text-white font-semibold hover:bg-white/30 transition-colors text-center border border-white/40"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
