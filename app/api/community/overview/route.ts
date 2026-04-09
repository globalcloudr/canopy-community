import { NextResponse } from "next/server";
import { getCommunityOverview } from "@/lib/community-data";
import { requireWorkspaceAccess, toErrorResponse } from "@/lib/server-auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId")?.trim();

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId is required." }, { status: 400 });
  }

  try {
    await requireWorkspaceAccess(request, workspaceId);
    const overview = await getCommunityOverview(workspaceId);
    return NextResponse.json({ overview });
  } catch (error) {
    return toErrorResponse(error, "Failed to load Canopy Community overview.");
  }
}
