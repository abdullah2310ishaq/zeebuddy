import { cn } from "@/lib/utils";
import { UserProfile } from "@/types/dashboard";

interface UserListProps {
  users: UserProfile[];
  className?: string;
}

export function UserList({ users, className }: UserListProps) {
  return (
    <div className={cn("p-4 sm:p-6 lg:p-8", className)}>
      {/* Section Title */}
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">
        Recent Users
      </h2>

      {/* User Items */}
      <div className="space-y-3">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex items-center p-3 bg-gray-50 rounded-lg"
          >
            {/* Avatar */}
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
              <span className="text-white font-semibold text-xs">
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </span>
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-gray-900 text-sm">{user.name}</h3>
              <p className="text-xs text-gray-500">{user.location}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
