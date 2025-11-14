import { NextRequest } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

interface ConnectedClient {
  userId: string;
  userName: string;
  writer: WritableStreamDefaultWriter;
  controller: AbortController;
  lastSeen: Date;
  organizationId: string;
}

// Store active connections per organization (session-scoped, not global)
const sessionConnections = new Map<string, Map<string, ConnectedClient>>();

// Connection timeout in milliseconds (2 minutes to reduce memory costs)
const CONNECTION_TIMEOUT = 2 * 60 * 1000;
const HEARTBEAT_INTERVAL = 25000; // 25 seconds

export async function broadcastToOrganization(organizationId: string, data: Record<string, unknown>) {
  const orgConnections = sessionConnections.get(organizationId);
  console.log("📢 Broadcasting to org", organizationId, "with", orgConnections?.size || 0, "connections:", data);
  if (!orgConnections) return;

  const message = `data: ${JSON.stringify(data)}\n\n`;
  const encoder = new TextEncoder();

  for (const [userId, client] of orgConnections.entries()) {
    try {
      await client.writer.write(encoder.encode(message));
    } catch {
      // Connection is broken, remove it
      orgConnections.delete(userId);
      client.controller.abort();
    }
  }
}

// Optimized cleanup function that only runs when needed
async function cleanupExpiredConnections() {
  const now = new Date();

  for (const [orgId, orgConnections] of sessionConnections.entries()) {
    for (const [userId, client] of orgConnections.entries()) {
      if (now.getTime() - client.lastSeen.getTime() > CONNECTION_TIMEOUT) {
        client.controller.abort();
        orgConnections.delete(userId);

        // Broadcast user disconnect (non-blocking)
        broadcastToOrganization(orgId, {
          type: "user_disconnected",
          user: { id: client.userId, name: client.userName },
          timestamp: now.toISOString(),
        }).catch(() => { }); // Ignore errors
      }
    }

    // Remove empty organization maps
    if (orgConnections.size === 0) {
      sessionConnections.delete(orgId);
    }
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const authResult = await auth();
    if (!authResult.userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const user = await currentUser();
    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { organizationId } = await params;

    // TODO: Verify user has access to this organization
    // For now, we'll trust the user is authorized since they're logged in

    let cleanupTimer: NodeJS.Timeout | null = null;
    let heartbeatTimer: NodeJS.Timeout | null = null;

    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();

        // Send connection established
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: "connected",
          message: "Connection established",
          timeout: CONNECTION_TIMEOUT / 1000 // Send timeout in seconds to client
        })}\n\n`));

        // Set up connection tracking
        const abortController = new AbortController();

        if (!sessionConnections.has(organizationId)) {
          sessionConnections.set(organizationId, new Map());
        }

        const orgConnections = sessionConnections.get(organizationId)!;
        const userName = user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : user.emailAddresses?.[0]?.emailAddress || "Unknown User";
        const connectedClient: ConnectedClient = {
          userId: user.id,
          userName: userName,
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
        }).catch(() => { }); // Non-blocking

        // Send current online users to this client
        const onlineUsers = Array.from(orgConnections.values())
          .filter(c => c.userId !== user.id)
          .map(c => ({ id: c.userId, name: c.userName }));

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: "online_users",
          users: onlineUsers,
          timestamp: new Date().toISOString(),
        })}\n\n`));

        // Auto-disconnect after CONNECTION_TIMEOUT to free memory
        const connectionTimer = setTimeout(() => {
          console.log(`Auto-disconnecting user ${user.id} after ${CONNECTION_TIMEOUT}ms`);
          abortController.abort();
        }, CONNECTION_TIMEOUT);

        // Handle client disconnect
        abortController.signal.addEventListener("abort", () => {
          clearTimeout(connectionTimer);
          if (heartbeatTimer) clearInterval(heartbeatTimer);
          if (cleanupTimer) clearTimeout(cleanupTimer);

          orgConnections.delete(user.id);

          // Broadcast user disconnect (non-blocking background task)
          broadcastToOrganization(organizationId, {
            type: "user_disconnected",
            user: { id: user.id, name: connectedClient.userName },
            timestamp: new Date().toISOString(),
          }).catch(() => { }); // Ignore errors

          try {
            controller.close();
          } catch {
            // Controller might already be closed
          }
        });

        // Shorter heartbeat with automatic cleanup
        heartbeatTimer = setInterval(() => {
          if (abortController.signal.aborted) {
            if (heartbeatTimer) clearInterval(heartbeatTimer);
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
            if (heartbeatTimer) clearInterval(heartbeatTimer);
            abortController.abort();
          }
        }, HEARTBEAT_INTERVAL);

        // Run cleanup periodically but only while this connection exists
        cleanupTimer = setTimeout(() => {
          cleanupExpiredConnections().catch(() => { }); // Non-blocking background cleanup
        }, HEARTBEAT_INTERVAL);
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Cache-Control",
        "X-Accel-Buffering": "no", // Disable nginx buffering
      },
    });
  } catch (error) {
    console.error("SSE stream error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}