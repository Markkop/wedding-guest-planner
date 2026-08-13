import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth/auth-service";
import { query } from "@/lib/db";
import { broadcastToOrganization } from "../stream/route";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const user = await AuthService.requireUserFull();
    const { organizationId } = await params;

    const membership = await query(
      "SELECT 1 FROM organization_members WHERE organization_id = $1 AND user_id = $2",
      [organizationId, user.id],
    );
    if (membership.length === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // Broadcast the update to all connected users in this organization
    await broadcastToOrganization(organizationId, {
      ...body,
      userId: user.id,
      userName: user.name || user.email,
      timestamp: new Date().toISOString(),
      isAI: false,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Broadcast error:", error);
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to broadcast update" },
      { status: 500 }
    );
  }
}
