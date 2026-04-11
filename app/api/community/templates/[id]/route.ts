import { NextResponse } from "next/server";
import {
  getWorkspaceTemplate,
  updateWorkspaceTemplate,
  deleteWorkspaceTemplate,
} from "@/lib/community-data";
import { requireWorkspaceAccess, toErrorResponse } from "@/lib/server-auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId")?.trim();

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId is required." }, { status: 400 });
  }

  try {
    await requireWorkspaceAccess(request, workspaceId);
    const template = await getWorkspaceTemplate(workspaceId, id);

    if (!template) {
      return NextResponse.json({ error: "Template not found." }, { status: 404 });
    }

    return NextResponse.json({ template });
  } catch (error) {
    return toErrorResponse(error, "Failed to load template.");
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const body = (await request.json()) as {
      workspaceId?: string;
      name?: string;
      designJson?: Record<string, unknown>;
      htmlPreview?: string | null;
    };

    const workspaceId = body.workspaceId?.trim();

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required." }, { status: 400 });
    }

    await requireWorkspaceAccess(request, workspaceId);

    const template = await updateWorkspaceTemplate({
      workspaceId,
      templateId: id,
      name: body.name,
      designJson: body.designJson,
      htmlPreview: body.htmlPreview,
    });

    return NextResponse.json({ template });
  } catch (error) {
    return toErrorResponse(error, "Failed to update template.");
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId")?.trim();

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId is required." }, { status: 400 });
  }

  try {
    await requireWorkspaceAccess(request, workspaceId);
    await deleteWorkspaceTemplate(workspaceId, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error, "Failed to delete template.");
  }
}
