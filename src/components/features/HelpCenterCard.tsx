"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { HELP_CENTER } from "@/constants/menu";

interface HelpCenterCardProps {
  href?: string;
  className?: string;
}

export function HelpCenterCard({
  href = HELP_CENTER.href,
  className,
}: HelpCenterCardProps) {
  return (
    <div
      className={cn(
        "min-h-screen w-full flex flex-col items-center justify-center px-4 py-16 sm:py-20",
        "bg-transparent",
        className
      )}
    >
      <div className="w-full max-w-xl relative flex flex-col items-center">
        {/* Help icon - circle overlapping card top, bigger */}
        <div
          className={cn(
            "absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10",
            "w-20 h-20 sm:w-24 sm:h-24 rounded-full",
            "bg-red-500 border-4 sm:border-[5px] border-white",
            "flex items-center justify-center",
            "shadow-[0_0_16px_rgba(255,255,255,0.45)]"
          )}
          aria-hidden
        >
          <span className="text-white text-3xl sm:text-4xl font-bold">?</span>
        </div>

        {/* Red card - bigger */}
        <div
          className={cn(
            "w-full rounded-[32px] sm:rounded-[40px] overflow-hidden",
            "bg-red-500 shadow-xl",
            "pt-14 pb-10 px-10 sm:px-14",
            "relative"
          )}
          style={{ boxShadow: "0 16px 56px rgba(0,0,0,0.25)" }}
        >
          {/* Subtle darker red decorative shapes */}
          <div
            className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-20 -translate-y-1/2 translate-x-1/2 bg-red-700 pointer-events-none"
            aria-hidden
          />
          <div
            className="absolute bottom-0 left-0 w-52 h-52 rounded-full opacity-20 translate-y-1/2 -translate-x-1/2 bg-red-700 pointer-events-none"
            aria-hidden
          />

          <div className="relative flex flex-col items-center text-center">
            <h2 className="text-white text-3xl sm:text-4xl md:text-5xl font-bold mb-5 mt-2">
              {HELP_CENTER.title}
            </h2>
            <p className="text-white text-base sm:text-lg leading-relaxed max-w-[340px] sm:max-w-[380px] mb-10">
              {HELP_CENTER.description}
            </p>
            <Link
              href={href}
              className={cn(
                "inline-flex items-center justify-center",
                "px-10 py-4 rounded-full font-semibold text-lg",
                "bg-white text-red-500 hover:bg-gray-100 transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-red-500",
                "cursor-pointer no-underline"
              )}
            >
              {HELP_CENTER.buttonText}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
