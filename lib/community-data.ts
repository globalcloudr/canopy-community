import { createClient } from "@supabase/supabase-js";
import {
  getCampaignMonitorClientDetails,
  getCampaignMonitorDraftCampaigns,
  getCampaignMonitorLists,
  getCampaignMonitorScheduledCampaigns,
  getCampaignMonitorSentCampaigns,
  getCampaignMonitorTemplates,
  type CampaignMonitorApiError,
} from "@/lib/campaign-monitor";
import type { CommunityConnection, CommunityOverview } from "@/lib/community-schema";

type CampaignMonitorConnectionRow = {
  workspace_id: string;
  client_id: string;
  api_key: string | null;
  auth_type: string | null;
  account_name: string | null;
  country: string | null;
  timezone: string | null;
  last_validated_at: string | null;
  updated_at: string;
};

function getSharedCampaignMonitorApiKey() {
  const value = process.env.CAMPAIGN_MONITOR_API_KEY?.trim();
  return value ? value : null;
}

function hasSharedCampaignMonitorApiKey() {
  return Boolean(getSharedCampaignMonitorApiKey());
}

function resolveCampaignMonitorApiKey(options: {
  providedApiKey?: string | null;
  storedApiKey?: string | null;
}) {
  return (
    options.providedApiKey?.trim() ||
    getSharedCampaignMonitorApiKey() ||
    options.storedApiKey?.trim() ||
    null
  );
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase environment variables are not configured.");
  }

  return createClient(url, key);
}

function toConnection(
  row: CampaignMonitorConnectionRow,
  sharedApiKeyConfigured = false
): CommunityConnection {
  return {
    workspaceId: row.workspace_id,
    clientId: row.client_id,
    accountName: row.account_name,
    country: row.country,
    timezone: row.timezone,
    authType: row.auth_type === "api_key" ? "api_key" : "api_key",
    apiKeyConfigured: sharedApiKeyConfigured || Boolean(row.api_key?.trim()),
    lastValidatedAt: row.last_validated_at,
    updatedAt: row.updated_at,
  };
}

export async function getCampaignMonitorConnection(workspaceId: string) {
  const client = getServiceClient();
  const { data, error } = await client
    .from("community_campaign_monitor_connections")
    .select(
      "workspace_id,client_id,api_key,auth_type,account_name,country,timezone,last_validated_at,updated_at"
    )
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as CampaignMonitorConnectionRow | null) ?? null;
}

export async function upsertCampaignMonitorConnection(params: {
  workspaceId: string;
  clientId: string;
  apiKey: string | null;
  accountName: string | null;
  country: string | null;
  timezone: string | null;
}) {
  const client = getServiceClient();
  const now = new Date().toISOString();

  const { data, error } = await client
    .from("community_campaign_monitor_connections")
    .upsert(
      {
        workspace_id: params.workspaceId,
        client_id: params.clientId,
        api_key: params.apiKey,
        auth_type: "api_key",
        account_name: params.accountName,
        country: params.country,
        timezone: params.timezone,
        last_validated_at: now,
        updated_at: now,
      },
      { onConflict: "workspace_id" }
    )
    .select(
      "workspace_id,client_id,api_key,auth_type,account_name,country,timezone,last_validated_at,updated_at"
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return toConnection(data as CampaignMonitorConnectionRow);
}

export async function deleteCampaignMonitorConnection(workspaceId: string) {
  const client = getServiceClient();
  const { error } = await client
    .from("community_campaign_monitor_connections")
    .delete()
    .eq("workspace_id", workspaceId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function validateCampaignMonitorConnection(params: {
  clientId: string;
  apiKey: string;
}) {
  return getCampaignMonitorClientDetails({
    clientId: params.clientId,
    apiKey: params.apiKey,
  });
}

export async function resolveWorkspaceCampaignMonitorApiKey(params: {
  workspaceId: string;
  providedApiKey?: string | null;
}) {
  const connection = await getCampaignMonitorConnection(params.workspaceId);
  return resolveCampaignMonitorApiKey({
    providedApiKey: params.providedApiKey,
    storedApiKey: connection?.api_key ?? null,
  });
}

export async function getCommunityOverview(
  workspaceId: string
): Promise<CommunityOverview> {
  const connectionRow = await getCampaignMonitorConnection(workspaceId);
  const fetchedAt = new Date().toISOString();
  const sharedApiKeyConfigured = hasSharedCampaignMonitorApiKey();

  if (!connectionRow) {
    return {
      connection: null,
      sharedApiKeyConfigured,
      syncError: null,
      account: null,
      stats: {
        listCount: 0,
        templateCount: 0,
        sentCampaignCount: 0,
        draftCampaignCount: 0,
        scheduledCampaignCount: 0,
      },
      lists: [],
      templates: [],
      sentCampaigns: [],
      draftCampaigns: [],
      scheduledCampaigns: [],
      fetchedAt,
    };
  }

  const connection = toConnection(connectionRow, sharedApiKeyConfigured);
  const apiKey = resolveCampaignMonitorApiKey({
    storedApiKey: connectionRow.api_key,
  });

  if (!apiKey) {
    return {
      connection,
      sharedApiKeyConfigured,
      syncError: "Campaign Monitor API access is not configured yet. Add CAMPAIGN_MONITOR_API_KEY on the server or save a workspace override key.",
      account: {
        name: connection.accountName,
        country: connection.country,
        timezone: connection.timezone,
      },
      stats: {
        listCount: 0,
        templateCount: 0,
        sentCampaignCount: 0,
        draftCampaignCount: 0,
        scheduledCampaignCount: 0,
      },
      lists: [],
      templates: [],
      sentCampaigns: [],
      draftCampaigns: [],
      scheduledCampaigns: [],
      fetchedAt,
    };
  }

  const credentials = {
    clientId: connectionRow.client_id,
    apiKey,
  };

  try {
    const [
      account,
      lists,
      templates,
      sentCampaignsResult,
      draftCampaigns,
      scheduledCampaigns,
    ] = await Promise.all([
      getCampaignMonitorClientDetails(credentials),
      getCampaignMonitorLists(credentials),
      getCampaignMonitorTemplates(credentials),
      getCampaignMonitorSentCampaigns(credentials),
      getCampaignMonitorDraftCampaigns(credentials),
      getCampaignMonitorScheduledCampaigns(credentials),
    ]);

    return {
      connection: {
        ...connection,
        accountName: account.name,
        country: account.country,
        timezone: account.timezone,
      },
      sharedApiKeyConfigured,
      syncError: null,
      account,
      stats: {
        listCount: lists.length,
        templateCount: templates.length,
        sentCampaignCount: sentCampaignsResult.total,
        draftCampaignCount: draftCampaigns.length,
        scheduledCampaignCount: scheduledCampaigns.length,
      },
      lists,
      templates,
      sentCampaigns: sentCampaignsResult.campaigns,
      draftCampaigns,
      scheduledCampaigns,
      fetchedAt,
    };
  } catch (error) {
    const syncError =
      error instanceof Error
        ? error.message
        : "Campaign Monitor data could not be loaded.";

    return {
      connection,
      sharedApiKeyConfigured,
      syncError,
      account: {
        name: connection.accountName,
        country: connection.country,
        timezone: connection.timezone,
      },
      stats: {
        listCount: 0,
        templateCount: 0,
        sentCampaignCount: 0,
        draftCampaignCount: 0,
        scheduledCampaignCount: 0,
      },
      lists: [],
      templates: [],
      sentCampaigns: [],
      draftCampaigns: [],
      scheduledCampaigns: [],
      fetchedAt,
    };
  }
}
