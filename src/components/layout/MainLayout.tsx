"use client";

import { ReactNode, useEffect } from "react";
import { cn } from "@/lib/utils";
import { BACKGROUND_GRADIENT } from "@/constants/colors";

interface MainLayoutProps {
  children: ReactNode;
  className?: string;
}

export function MainLayout({ children, className }: MainLayoutProps) {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlMinHeight = html.style.minHeight;
    const prevBodyBg = body.style.background;
    const prevBodyMinHeight = body.style.minHeight;
    const prevHtmlBg = html.style.background;

    html.style.minHeight = "100%";
    html.style.background = BACKGROUND_GRADIENT;
    body.style.minHeight = "100vh";
    body.style.background = BACKGROUND_GRADIENT;

    return () => {
      html.style.minHeight = prevHtmlMinHeight;
      html.style.background = prevHtmlBg;
      body.style.minHeight = prevBodyMinHeight;
      body.style.background = prevBodyBg;
    };
  }, []);

  return (
    <div
      className={cn("min-h-screen min-h-[100dvh] w-full flex")}
      style={{ background: BACKGROUND_GRADIENT }}
    >
      {children}
    </div>
  );
}
