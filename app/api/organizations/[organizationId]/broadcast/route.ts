import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { broadcastToOrganization } from "../stream/route";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const authResult = await auth();
    if (!authResult.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { organizationId } = await params;
    const body = await request.json();

    // TODO: Verify user has access to this organization
    // For now, we'll trust the user is authorized since they're logged in

    // Broadcast the update to all connected users in this organization
    await broadcastToOrganization(organizationId, body);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Broadcast error:", error);
    return NextResponse.json(
      { error: "Failed to broadcast update" },
      { status: 500 }
    );
  }
}