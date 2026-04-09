import { NextResponse } from "next/server";
import {
  deleteCampaignMonitorConnection,
  getCampaignMonitorConnection,
  resolveWorkspaceCampaignMonitorApiKey,
  upsertCampaignMonitorConnection,
  validateCampaignMonitorConnection,
} from "@/lib/community-data";
import { CampaignMonitorApiError } from "@/lib/campaign-monitor";
import { requireWorkspaceAccess, toErrorResponse } from "@/lib/server-auth";

function toWorkspaceId(request: Request) {
  return new URL(request.url).searchParams.get("workspaceId")?.trim() || null;
}

export async function GET(request: Request) {
  const workspaceId = toWorkspaceId(request);

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId is required." }, { status: 400 });
  }

  try {
    await requireWorkspaceAccess(request, workspaceId);
    const connection = await getCampaignMonitorConnection(workspaceId);
    return NextResponse.json({
      sharedApiKeyConfigured: Boolean(process.env.CAMPAIGN_MONITOR_API_KEY?.trim()),
      connection: connection
        ? {
            workspaceId: connection.workspace_id,
            clientId: connection.client_id,
            accountName: connection.account_name,
            country: connection.country,
            timezone: connection.timezone,
            authType: connection.auth_type === "api_key" ? "api_key" : "api_key",
            apiKeyConfigured:
              Boolean(process.env.CAMPAIGN_MONITOR_API_KEY?.trim()) || Boolean(connection.api_key),
            lastValidatedAt: connection.last_validated_at,
            updatedAt: connection.updated_at,
          }
        : null,
    });
  } catch (error) {
    return toErrorResponse(error, "Failed to load Campaign Monitor settings.");
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as {
      workspaceId?: string;
      clientId?: string;
      apiKey?: string;
    };

    const workspaceId = body.workspaceId?.trim();
    const clientId = body.clientId?.trim();
    const apiKey = body.apiKey?.trim();

    if (!workspaceId || !clientId) {
      return NextResponse.json(
        { error: "workspaceId and clientId are required." },
        { status: 400 }
      );
    }

    await requireWorkspaceAccess(request, workspaceId);
    const existingConnection = await getCampaignMonitorConnection(workspaceId);
    const resolvedApiKey = await resolveWorkspaceCampaignMonitorApiKey({
      workspaceId,
      providedApiKey: apiKey,
    });

    if (!resolvedApiKey) {
      return NextResponse.json(
        { error: "No Campaign Monitor API key is configured. Add CAMPAIGN_MONITOR_API_KEY to the server or provide a workspace override key." },
        { status: 400 }
      );
    }

    const details = await validateCampaignMonitorConnection({ clientId, apiKey: resolvedApiKey });
    const connection = await upsertCampaignMonitorConnection({
      workspaceId,
      clientId: details.clientId,
      apiKey:
        apiKey ||
        (process.env.CAMPAIGN_MONITOR_API_KEY?.trim()
          ? null
          : existingConnection?.api_key?.trim() || null),
      accountName: details.name,
      country: details.country,
      timezone: details.timezone,
    });

    return NextResponse.json({ connection });
  } catch (error) {
    if (error instanceof CampaignMonitorApiError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status >= 400 && error.status < 500 ? error.status : 502 }
      );
    }

    return toErrorResponse(error, "Failed to save Campaign Monitor settings.");
  }
}

export async function DELETE(request: Request) {
  const workspaceId = toWorkspaceId(request);

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId is required." }, { status: 400 });
  }

  try {
    await requireWorkspaceAccess(request, workspaceId);
    await deleteCampaignMonitorConnection(workspaceId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error, "Failed to remove Campaign Monitor settings.");
  }
}
