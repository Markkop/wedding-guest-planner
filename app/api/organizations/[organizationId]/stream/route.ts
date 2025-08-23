import { NextRequest } from "next/server";
import { getStackServerApp } from "@/lib/auth/safe-stack";

interface ConnectedClient {
  userId: string;
  userName: string;
  writer: WritableStreamDefaultWriter;
  controller: AbortController;
  lastSeen: Date;
  organizationId: string;
}

// Store active connections per organization
const connections = new Map<string, Map<string, ConnectedClient>>();

// Cleanup inactive connections every 30 seconds
setInterval(() => {
  const now = new Date();
  for (const [orgId, orgConnections] of connections.entries()) {
    for (const [userId, client] of orgConnections.entries()) {
      // Remove connections inactive for more than 60 seconds
      if (now.getTime() - client.lastSeen.getTime() > 60000) {
        client.controller.abort();
        orgConnections.delete(userId);
        
        // Broadcast user disconnect (but avoid infinite loops by not awaiting)
        void broadcastToOrganization(orgId, {
          type: "user_disconnected",
          user: { id: client.userId, name: client.userName },
          timestamp: now.toISOString(),
        });
      }
    }
    
    // Remove empty organization maps
    if (orgConnections.size === 0) {
      connections.delete(orgId);
    }
  }
}, 30000);

export async function broadcastToOrganization(organizationId: string, data: Record<string, unknown>) {
  const orgConnections = connections.get(organizationId);
  console.log("📢 Broadcasting to org", organizationId, "with", orgConnections?.size || 0, "connections:", data);
  if (!orgConnections) return;

  const message = `data: ${JSON.stringify(data)}\n\n`;
  
  for (const [userId, client] of orgConnections.entries()) {
    try {
      await client.writer.write(new TextEncoder().encode(message));
    } catch {
      // Connection is broken, remove it
      orgConnections.delete(userId);
      client.controller.abort();
    }
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const user = await getStackServerApp().getUser();
    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { organizationId } = await params;
    
    // TODO: Verify user has access to this organization
    // For now, we'll trust the user is authorized since they're logged in

    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        
        // Send connection established
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: "connected",
          message: "Connection established"
        })}\n\n`));

        // Set up connection tracking
        const abortController = new AbortController();
        
        if (!connections.has(organizationId)) {
          connections.set(organizationId, new Map());
        }
        
        const orgConnections = connections.get(organizationId)!;
        const connectedClient: ConnectedClient = {
          userId: user.id,
          userName: user.displayName || user.primaryEmail || "Unknown User",
          writer: {
            write: async (chunk: Uint8Array) => controller.enqueue(chunk),
          } as WritableStreamDefaultWriter,
          controller: abortController,
          lastSeen: new Date(),
          organizationId,
        };
        
        // Remove existing connection for this user (if any)
        if (orgConnections.has(user.id)) {
          const existingClient = orgConnections.get(user.id)!;
          existingClient.controller.abort();
        }
        
        orgConnections.set(user.id, connectedClient);
        
        // Broadcast user connected to others
        broadcastToOrganization(organizationId, {
          type: "user_connected",
          user: { id: user.id, name: connectedClient.userName },
          timestamp: new Date().toISOString(),
        });

        // Send current online users to this client
        const onlineUsers = Array.from(orgConnections.values())
          .filter(c => c.userId !== user.id)
          .map(c => ({ id: c.userId, name: c.userName }));
        
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: "online_users",
          users: onlineUsers,
          timestamp: new Date().toISOString(),
        })}\n\n`));

        // Handle client disconnect
        abortController.signal.addEventListener("abort", () => {
          orgConnections.delete(user.id);
          
          // Broadcast user disconnect
          broadcastToOrganization(organizationId, {
            type: "user_disconnected", 
            user: { id: user.id, name: connectedClient.userName },
            timestamp: new Date().toISOString(),
          });
          
          try {
            controller.close();
          } catch {
            // Controller might already be closed
          }
        });

        // Keep connection alive with heartbeat
        const heartbeat = setInterval(() => {
          if (abortController.signal.aborted) {
            clearInterval(heartbeat);
            return;
          }
          
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: "heartbeat",
              timestamp: new Date().toISOString(),
            })}\n\n`));
            
            // Update last seen
            if (orgConnections.has(user.id)) {
              orgConnections.get(user.id)!.lastSeen = new Date();
            }
          } catch {
            clearInterval(heartbeat);
            abortController.abort();
          }
        }, 30000);
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Cache-Control",
      },
    });
  } catch {
    console.error("SSE stream error");
    return new Response("Internal Server Error", { status: 500 });
  }
}