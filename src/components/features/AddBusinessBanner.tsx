"use client";

import { useState } from "react";
import { COLORS } from "@/constants/colors";

function formatCurrentDate(): string {
  const now = new Date();
  return now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function AddBusinessBanner() {
  const [imageError, setImageError] = useState(false);
  const appGradientHorizontal = `linear-gradient(90deg, ${COLORS.GRADIENT_START} 0%, ${COLORS.GRADIENT_END} 100%)`;

  return (
    <div
      className="relative rounded-2xl p-8 lg:p-12 overflow-hidden"
      style={{ background: appGradientHorizontal }}
    >
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between relative z-10">
        {/* Left Side - Text Content */}
        <div className="flex-1 mb-6 lg:mb-0 lg:mr-8">
          <p className="text-white/80 text-sm mb-2">{formatCurrentDate()}</p>
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-3">
            Add New Business
          </h2>
          <p className="text-white/90 text-base lg:text-lg">
            Always stay updated in your Admin portal!
          </p>
        </div>

        {/* Right Side - college.png or fallback illustration */}
        <div className="flex-shrink-0 flex items-end justify-end">
          {!imageError ? (
            <img
              src="/college.png"
              alt=""
              className="h-32 w-auto lg:h-40 object-contain object-right"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-32 h-32 lg:w-40 lg:h-40 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-6xl lg:text-7xl" aria-hidden>👨‍💼</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
