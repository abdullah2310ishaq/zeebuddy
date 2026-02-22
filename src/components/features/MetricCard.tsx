import { cn } from "@/lib/utils";
import { MetricCard as MetricCardType } from "@/types/dashboard";

interface MetricCardProps {
  metric: MetricCardType;
  className?: string;
}

export function MetricCard({ metric, className }: MetricCardProps) {
  return (
    <div className={cn("bg-gray-50 rounded-xl p-6", className)}>
      {/* Icon */}
      <div
        className={cn(
          "w-12 h-12 rounded-lg flex items-center justify-center mb-4",
          metric.iconColor
        )}
      >
        <span className="text-2xl">{metric.icon}</span>
      </div>

      {/* Title */}
      <h3 className="text-gray-600 text-sm font-medium mb-2">{metric.title}</h3>

      {/* Value */}
      <div className="text-2xl font-bold text-gray-900 mb-2">
        {metric.value}
      </div>

      {/* Change (optional) */}
      {metric.change != null && metric.changeType != null && (
        <div className="flex items-center">
          <svg
            className={cn(
              "w-4 h-4 mr-1",
              metric.changeType === "increase" ? "text-green-500" : "text-red-500"
            )}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span
            className={cn(
              "text-sm font-medium",
              metric.changeType === "increase" ? "text-green-600" : "text-red-600"
            )}
          >
            {metric.change}
          </span>
        </div>
      )}
    </div>
  );
}
