import { cn } from "@/lib/utils";
import { DeviceItem } from "@/types/dashboard";

interface DeviceListProps {
  devices: DeviceItem[];
  className?: string;
}

export function DeviceList({ devices, className }: DeviceListProps) {
  return (
    <div className={cn("p-4 sm:p-6 lg:p-8", className)}>
      {/* Section Title */}
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">
        Active device
      </h2>

      {/* Device Items */}
      <div className="space-y-4">
        {devices.map((device) => (
          <div
            key={device.id}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center">
              {/* Icon */}
              <div className="w-10 h-10 bg-gray-300 rounded-lg flex items-center justify-center mr-4">
                <span className="text-gray-600 text-lg">
                  {device.icon === "iphone" && "📱"}
                  {device.icon === "macbook" && "💻"}
                </span>
              </div>

              {/* Content */}
              <div>
                <h3 className="font-medium text-gray-900">{device.name}</h3>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm text-green-600 capitalize">
                    {device.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Options Menu */}
            <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer">
              <svg
                className="w-5 h-5 text-gray-600"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="5" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="12" cy="19" r="2" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
