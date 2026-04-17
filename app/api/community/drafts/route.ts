import { NextResponse } from "next/server";
import { createWorkspaceDraft, getWorkspaceDrafts } from "@/lib/community-data";
import { requireWorkspaceAccess, toErrorResponse } from "@/lib/server-auth";

export async function GET(request: Request) {
  const workspaceId = new URL(request.url).searchParams.get("workspaceId")?.trim() || null;

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId is required." }, { status: 400 });
  }

  try {
    await requireWorkspaceAccess(request, workspaceId);
    const drafts = await getWorkspaceDrafts(workspaceId);
    return NextResponse.json({ drafts });
  } catch (error) {
    return toErrorResponse(error, "Failed to load drafts.");
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      workspaceId?: string;
      name?: string;
      subject?: string;
      fromName?: string;
      fromEmail?: string;
      replyTo?: string;
      listIds?: string[];
      htmlContent?: string | null;
      designJson?: Record<string, unknown> | null;
    };

    const workspaceId = body.workspaceId?.trim();
    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required." }, { status: 400 });
    }

    await requireWorkspaceAccess(request, workspaceId);

    const draft = await createWorkspaceDraft({
      workspaceId,
      name: body.name?.trim() ?? "",
      subject: body.subject?.trim() ?? "",
      fromName: body.fromName?.trim() ?? "",
      fromEmail: body.fromEmail?.trim() ?? "",
      replyTo: body.replyTo?.trim() ?? "",
      listIds: body.listIds ?? [],
      htmlContent: body.htmlContent ?? null,
      designJson: body.designJson ?? null,
    });

    return NextResponse.json({ draft });
  } catch (error) {
    return toErrorResponse(error, "Failed to save draft.");
  }
}
