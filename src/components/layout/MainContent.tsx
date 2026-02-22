import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MainContentProps {
  children: ReactNode;
  className?: string;
}

export function MainContent({ children, className }: MainContentProps) {
  return (
    <div className={cn("flex-1 flex flex-col", className)}>
      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="h-full bg-white rounded-xl lg:rounded-3xl shadow-2xl overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
