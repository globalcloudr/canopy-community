import { NextResponse } from "next/server";
import { getSentCampaignsPaginated } from "@/lib/community-data";
import { requireWorkspaceAccess, toErrorResponse } from "@/lib/server-auth";

const PAGE_SIZE = 20;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId")?.trim() || null;
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1);

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId is required." }, { status: 400 });
  }

  try {
    await requireWorkspaceAccess(request, workspaceId);
    const result = await getSentCampaignsPaginated(workspaceId, page, PAGE_SIZE);
    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse(error, "Failed to load campaigns.");
  }
}
