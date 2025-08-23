"use client";

import { useCollaboration } from "@/lib/collaboration-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Wifi, WifiOff } from "lucide-react";
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

export function OnlineUsers() {
  const { onlineUsers, isConnected } = useCollaboration();

  if (!isConnected) {
    return (
      <div className="flex items-center gap-2 bg-muted/80 backdrop-blur-sm rounded-full px-3 py-2 shadow-sm border">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <WifiOff className="h-3 w-3 text-red-500" />
          <span>Offline</span>
        </div>
      </div>
    );
  }

  // Show connected status even with no other users
  const totalUsers = onlineUsers.length + 1; // +1 for current user

  return (
    <TooltipProvider>
      <div className="flex items-center gap-3 bg-background/95 backdrop-blur-sm rounded-full px-4 py-3 shadow-sm border">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <Badge variant="secondary" className="text-xs px-2 py-0.5">
            {totalUsers} {totalUsers === 1 ? 'user' : 'users'} online
          </Badge>
        </div>
        
        <div className="flex -space-x-2">
          {onlineUsers.slice(0, 5).map((user) => (
            <Tooltip key={user.id}>
              <TooltipTrigger asChild>
                <Avatar className="h-8 w-8 border-2 border-background">
                  <AvatarFallback className={`text-xs font-medium text-white ${getAvatarColor(user.id)}`}>
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>{user.name}</p>
              </TooltipContent>
            </Tooltip>
          ))}
          
          {onlineUsers.length > 5 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="h-8 w-8 border-2 border-background">
                  <AvatarFallback className="text-xs font-medium bg-muted text-muted-foreground">
                    +{onlineUsers.length - 5}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent side="top">
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