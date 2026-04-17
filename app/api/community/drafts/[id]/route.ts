import { NextResponse } from "next/server";
import {
  deleteWorkspaceDraft,
  getWorkspaceDraft,
  updateWorkspaceDraft,
} from "@/lib/community-data";
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
    const draft = await getWorkspaceDraft(id, workspaceId);
    if (!draft) {
      return NextResponse.json({ error: "Draft not found." }, { status: 404 });
    }
    return NextResponse.json({ draft });
  } catch (error) {
    return toErrorResponse(error, "Failed to load draft.");
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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

    const draft = await updateWorkspaceDraft(id, workspaceId, {
      name: body.name?.trim(),
      subject: body.subject?.trim(),
      fromName: body.fromName?.trim(),
      fromEmail: body.fromEmail?.trim(),
      replyTo: body.replyTo?.trim(),
      listIds: body.listIds,
      htmlContent: body.htmlContent,
      designJson: body.designJson,
    });

    return NextResponse.json({ draft });
  } catch (error) {
    return toErrorResponse(error, "Failed to update draft.");
  }
}

export async function DELETE(
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
    await deleteWorkspaceDraft(id, workspaceId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error, "Failed to delete draft.");
  }
}
