import { NextResponse } from "next/server";
import { getCampaignAnalytics } from "@/lib/community-data";
import { requireWorkspaceAccess, toErrorResponse } from "@/lib/server-auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const workspaceId = new URL(request.url).searchParams.get("workspaceId")?.trim() || null;

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId is required." }, { status: 400 });
  }

  try {
    await requireWorkspaceAccess(request, workspaceId);
    const analytics = await getCampaignAnalytics(workspaceId, id);
    return NextResponse.json({ analytics });
  } catch (error) {
    return toErrorResponse(error, "Failed to load campaign analytics.");
  }
}
