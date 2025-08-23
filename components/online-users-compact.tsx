"use client";

import { useCollaboration } from "@/lib/collaboration-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map(part => part.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(userId: string): string {
  // Generate consistent colors based on user ID
  const colors = [
    "bg-red-500",
    "bg-blue-500", 
    "bg-green-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500",
    "bg-orange-500",
    "bg-cyan-500",
  ];
  
  const hash = userId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

export function OnlineUsersCompact() {
  const { onlineUsers, isConnected } = useCollaboration();

  // Don't show anything if not connected
  if (!isConnected) {
    return null;
  }

  // Don't show if it's just the current user
  if (onlineUsers.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        {/* Other online users */}
        <div className="flex -space-x-2">
          {onlineUsers.slice(0, 5).map((user) => (
            <Tooltip key={user.id}>
              <TooltipTrigger asChild>
                <Avatar className="h-8 w-8 border-2 border-background hover:z-10 transition-all hover:scale-110">
                  <AvatarFallback className={`text-xs font-medium text-white ${getAvatarColor(user.id)}`}>
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{user.name}</p>
              </TooltipContent>
            </Tooltip>
          ))}
          
          {onlineUsers.length > 5 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="h-8 w-8 border-2 border-background hover:z-10 transition-all hover:scale-110">
                  <AvatarFallback className="text-xs font-medium bg-muted text-muted-foreground">
                    +{onlineUsers.length - 5}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <div>
                  <p className="font-medium mb-1">And {onlineUsers.length - 5} more:</p>
                  {onlineUsers.slice(5).map(user => (
                    <p key={user.id} className="text-sm">{user.name}</p>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}