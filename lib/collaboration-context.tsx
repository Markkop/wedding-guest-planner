"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { useUser } from "@stackframe/stack";
import type { Guest } from "@/lib/types";

interface OnlineUser {
  id: string;
  name: string;
}

interface GuestUpdate {
  type: "guest_updated" | "guest_added" | "guest_deleted" | "guests_reordered" | "guest_moved" | "guests_swapped";
  userId: string;
  userName: string;
  guestId?: string;
  guestName?: string;
  updates?: Partial<Guest>;
  guest?: Guest;
  guestIds?: string[]; // For reordering
  action?: string; // For position changes (e.g., "moved to position 3")
  guest1Id?: string; // For swapping
  guest1Name?: string;
  guest2Id?: string;
  guest2Name?: string;
  timestamp: string;
  isAI?: boolean; // Flag for AI-initiated updates
}

interface CollaborationContextType {
  onlineUsers: OnlineUser[];
  isConnected: boolean;
  broadcastGuestUpdate: (update: Omit<GuestUpdate, "userId" | "userName" | "timestamp">) => void;
  onGuestUpdate: (callback: (update: GuestUpdate) => void) => () => void;
}

const CollaborationContext = createContext<CollaborationContextType | undefined>(undefined);

export function useCollaboration() {
  const context = useContext(CollaborationContext);
  if (!context) {
    throw new Error("useCollaboration must be used within a CollaborationProvider");
  }
  return context;
}

interface CollaborationProviderProps {
  children: React.ReactNode;
  organizationId?: string;
}

export function CollaborationProvider({ children, organizationId }: CollaborationProviderProps) {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const updateCallbacks = useRef<Set<(update: GuestUpdate) => void>>(new Set());
  const user = useUser();

  // Broadcast a guest update to all connected users
  const broadcastGuestUpdate = useCallback(async (update: Omit<GuestUpdate, "userId" | "userName" | "timestamp">) => {
    if (!organizationId || !user) return;

    try {
      await fetch(`/api/organizations/${organizationId}/broadcast`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...update,
          userId: user.id,
          userName: user.displayName || user.primaryEmail || "Unknown User",
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error("Failed to broadcast update:", error);
    }
  }, [organizationId, user]);

  // Register callback for guest updates
  const onGuestUpdate = useCallback((callback: (update: GuestUpdate) => void) => {
    updateCallbacks.current.add(callback);
    return () => {
      updateCallbacks.current.delete(callback);
    };
  }, []);

  // Handle incoming SSE messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      console.log("📡 SSE message received:", data);
      
      switch (data.type) {
        case "connected":
          setIsConnected(true);
          break;
          
        case "user_connected":
          if (data.user.id !== user?.id) {
            setOnlineUsers(prev => {
              const exists = prev.some(u => u.id === data.user.id);
              if (!exists) {
                return [...prev, data.user];
              }
              return prev;
            });
          }
          break;
          
        case "user_disconnected":
          setOnlineUsers(prev => prev.filter(u => u.id !== data.user.id));
          break;
          
        case "online_users":
          setOnlineUsers(data.users || []);
          break;
          
        case "guest_updated":
        case "guest_added":
        case "guest_deleted":
        case "guests_reordered":
        case "guest_moved":
        case "guests_swapped":
          // Don't process our own updates, unless they're AI-initiated
          if (data.userId !== user?.id || data.isAI) {
            updateCallbacks.current.forEach(callback => callback(data));
          }
          break;
          
        case "heartbeat":
          // Keep connection alive
          break;
          
        default:
          console.log("Unknown SSE message type:", data.type);
      }
    } catch (error) {
      console.error("Error parsing SSE message:", error);
    }
  }, [user]);

  // Connect to SSE stream
  useEffect(() => {
    if (!organizationId || !user) {
      console.log("🔌 SSE connection skipped - missing organizationId or user:", { organizationId, userId: user?.id });
      return;
    }

    console.log("🔌 Attempting SSE connection to:", `/api/organizations/${organizationId}/stream`);

    const connectSSE = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const eventSource = new EventSource(`/api/organizations/${organizationId}/stream`);
      eventSourceRef.current = eventSource;
      console.log("🔌 SSE EventSource created");

      eventSource.onopen = () => {
        console.log("SSE connection opened");
        setIsConnected(true);
      };

      eventSource.onmessage = handleMessage;

      eventSource.onerror = (error) => {
        console.error("SSE connection error:", error);
        setIsConnected(false);
        
        // Reconnect after a delay
        setTimeout(() => {
          if (eventSourceRef.current === eventSource) {
            connectSSE();
          }
        }, 3000);
      };
    };

    connectSSE();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsConnected(false);
      setOnlineUsers([]);
    };
  }, [organizationId, user, handleMessage]);

  return (
    <CollaborationContext.Provider
      value={{
        onlineUsers,
        isConnected,
        broadcastGuestUpdate,
        onGuestUpdate,
      }}
    >
      {children}
    </CollaborationContext.Provider>
  );
}

// Export for use by other components
export { CollaborationContext };