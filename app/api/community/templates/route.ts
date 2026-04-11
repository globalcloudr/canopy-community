import { NextResponse } from "next/server";
import { getWorkspaceTemplates, createWorkspaceTemplate } from "@/lib/community-data";
import { requireWorkspaceAccess, toErrorResponse } from "@/lib/server-auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId")?.trim();

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId is required." }, { status: 400 });
  }

  try {
    await requireWorkspaceAccess(request, workspaceId);
    const templates = await getWorkspaceTemplates(workspaceId);
    return NextResponse.json({ templates });
  } catch (error) {
    return toErrorResponse(error, "Failed to load templates.");
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      workspaceId?: string;
      name?: string;
      designJson?: Record<string, unknown>;
      htmlPreview?: string | null;
    };

    const workspaceId = body.workspaceId?.trim();
    const name = body.name?.trim();

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required." }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json({ error: "name is required." }, { status: 400 });
    }
    if (!body.designJson || typeof body.designJson !== "object") {
      return NextResponse.json({ error: "designJson is required." }, { status: 400 });
    }

    await requireWorkspaceAccess(request, workspaceId);

    const template = await createWorkspaceTemplate({
      workspaceId,
      name,
      designJson: body.designJson,
      htmlPreview: body.htmlPreview ?? null,
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error, "Failed to create template.");
  }
}
