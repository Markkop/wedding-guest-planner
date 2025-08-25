"use client";

import { useCollaboration } from "@/lib/collaboration-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useUser } from "@stackframe/stack";

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
  const currentUser = useUser();

  // Don't show anything if not connected
  if (!isConnected) {
    return null;
  }

  // Create a combined list with current user and online users
  const allUsers = currentUser ? [
    {
      id: currentUser.id,
      name: `${currentUser.displayName || currentUser.primaryEmail || "You"} (you)`
    },
    ...onlineUsers
  ] : onlineUsers;

  // Always show users when connected (including just the current user)
  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        {/* All online users including current */}
        <div className="flex -space-x-2">
          {allUsers.slice(0, 5).map((user) => (
            <Tooltip key={user.id}>
              <TooltipTrigger asChild>
                <Avatar className="h-8 w-8 border-2 border-background hover:z-10 transition-all hover:scale-110">
                  <AvatarFallback className={`text-xs font-medium text-white ${getAvatarColor(user.id)}`}>
                    {getInitials(user.name.replace(" (you)", ""))}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{user.name}</p>
              </TooltipContent>
            </Tooltip>
          ))}
          
          {allUsers.length > 5 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="h-8 w-8 border-2 border-background hover:z-10 transition-all hover:scale-110">
                  <AvatarFallback className="text-xs font-medium bg-muted text-muted-foreground">
                    +{allUsers.length - 5}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <div>
                  <p className="font-medium mb-1">And {allUsers.length - 5} more:</p>
                  {allUsers.slice(5).map(user => (
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