import { createClient } from "@supabase/supabase-js";
import { logPortalActivity } from "@/lib/portal-activity";
import {
  createCampaignMonitorCampaign,
  getCampaignMonitorCampaignAnalytics,
  getCampaignMonitorCampaignSummary,
  getCampaignMonitorClientBilling,
  getCampaignMonitorClientDetails,
  getCampaignMonitorDraftCampaigns,
  getCampaignMonitorListStats,
  getCampaignMonitorLists,
  getCampaignMonitorScheduledCampaigns,
  getCampaignMonitorSentCampaigns,
  scheduleCampaignMonitorCampaign,
  sendCampaignMonitorCampaign,
  type CampaignMonitorApiError,
} from "@/lib/campaign-monitor";
import type { CampaignAnalytics, CommunityConnection, CommunityDraft, CommunityOverview, CommunityTemplate } from "@/lib/community-schema";

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
        api_key: params.apiKey ?? "",
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
      billing: null,
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
      billing: null,
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
      billing,
      listsRaw,
      templateCount,
      sentCampaignsResult,
      draftCampaigns,
      scheduledCampaigns,
    ] = await Promise.all([
      getCampaignMonitorClientDetails(credentials),
      getCampaignMonitorClientBilling(credentials).catch(() => null),
      getCampaignMonitorLists(credentials),
      getWorkspaceTemplateCount(workspaceId),
      getCampaignMonitorSentCampaigns(credentials),
      getWorkspaceDrafts(workspaceId),
      getCampaignMonitorScheduledCampaigns(credentials),
    ]);

    // Fan out per-list stats and per-campaign stats in parallel; individual failures fall back gracefully
    const [lists, sentCampaigns] = await Promise.all([
      Promise.all(
        listsRaw.map(async (list) => {
          try {
            const stats = await getCampaignMonitorListStats(credentials, list.listId);
            return { ...list, subscriberCount: stats.totalActiveSubscribers };
          } catch {
            return list;
          }
        })
      ),
      Promise.all(
        sentCampaignsResult.campaigns.map(async (campaign) => {
          try {
            const stats = await getCampaignMonitorCampaignSummary(credentials, campaign.id);
            return { ...campaign, openRate: stats.openRate, clickRate: stats.clickRate };
          } catch {
            return campaign;
          }
        })
      ),
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
        templateCount,
        sentCampaignCount: sentCampaignsResult.total,
        draftCampaignCount: draftCampaigns.length,
        scheduledCampaignCount: scheduledCampaigns.length,
      },
      lists,
      templates: [],
      sentCampaigns,
      draftCampaigns,
      scheduledCampaigns,
      billing,
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
      billing: null,
      fetchedAt,
    };
  }
}

// ─── Template CRUD ───────────────────────────────────────────────────────────

type CommunityTemplateRow = {
  id: string;
  workspace_id: string;
  name: string;
  design_json: Record<string, unknown>;
  html_preview: string | null;
  created_at: string;
  updated_at: string;
};

function toTemplate(row: CommunityTemplateRow): CommunityTemplate {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    designJson: row.design_json,
    htmlPreview: row.html_preview,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const TEMPLATE_COLUMNS = "id,workspace_id,name,design_json,html_preview,created_at,updated_at";

export async function getWorkspaceTemplates(workspaceId: string): Promise<CommunityTemplate[]> {
  const client = getServiceClient();
  const { data, error } = await client
    .from("community_templates")
    .select(TEMPLATE_COLUMNS)
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return ((data as CommunityTemplateRow[]) ?? []).map(toTemplate);
}

export async function getWorkspaceTemplate(
  workspaceId: string,
  templateId: string
): Promise<CommunityTemplate | null> {
  const client = getServiceClient();
  const { data, error } = await client
    .from("community_templates")
    .select(TEMPLATE_COLUMNS)
    .eq("id", templateId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? toTemplate(data as CommunityTemplateRow) : null;
}

export async function createWorkspaceTemplate(params: {
  workspaceId: string;
  name: string;
  designJson: Record<string, unknown>;
  htmlPreview: string | null;
}): Promise<CommunityTemplate> {
  const client = getServiceClient();
  const { data, error } = await client
    .from("community_templates")
    .insert({
      workspace_id: params.workspaceId,
      name: params.name,
      design_json: params.designJson,
      html_preview: params.htmlPreview,
    })
    .select(TEMPLATE_COLUMNS)
    .single();

  if (error) throw new Error(error.message);
  return toTemplate(data as CommunityTemplateRow);
}

export async function updateWorkspaceTemplate(params: {
  workspaceId: string;
  templateId: string;
  name?: string;
  designJson?: Record<string, unknown>;
  htmlPreview?: string | null;
}): Promise<CommunityTemplate> {
  const client = getServiceClient();
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (params.name !== undefined) updates.name = params.name;
  if (params.designJson !== undefined) updates.design_json = params.designJson;
  if (params.htmlPreview !== undefined) updates.html_preview = params.htmlPreview;

  const { data, error } = await client
    .from("community_templates")
    .update(updates)
    .eq("id", params.templateId)
    .eq("workspace_id", params.workspaceId)
    .select(TEMPLATE_COLUMNS)
    .single();

  if (error) throw new Error(error.message);
  return toTemplate(data as CommunityTemplateRow);
}

export async function deleteWorkspaceTemplate(
  workspaceId: string,
  templateId: string
): Promise<void> {
  const client = getServiceClient();
  const { error } = await client
    .from("community_templates")
    .delete()
    .eq("id", templateId)
    .eq("workspace_id", workspaceId);

  if (error) throw new Error(error.message);
}

async function getWorkspaceTemplateCount(workspaceId: string): Promise<number> {
  const client = getServiceClient();
  const { count, error } = await client
    .from("community_templates")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

// ─── HTML upload to Supabase Storage ─────────────────────────────────────────

const HTML_BUCKET = "community-html-uploads";
const SIGNED_URL_EXPIRY_SECONDS = 60 * 15; // 15 minutes — enough for CM to fetch once

async function uploadCampaignHtmlForSend(params: {
  workspaceId: string;
  html: string;
}): Promise<{ signedUrl: string; storagePath: string }> {
  const client = getServiceClient();
  const storagePath = `${params.workspaceId}/${Date.now()}.html`;

  const { error: uploadError } = await client.storage
    .from(HTML_BUCKET)
    .upload(storagePath, params.html, {
      contentType: "text/html; charset=utf-8",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload campaign HTML: ${uploadError.message}`);
  }

  const { data: signedData, error: signedError } = await client.storage
    .from(HTML_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_EXPIRY_SECONDS);

  if (signedError || !signedData?.signedUrl) {
    // Clean up the uploaded file if we can't sign it
    await client.storage.from(HTML_BUCKET).remove([storagePath]).catch(() => null);
    throw new Error(`Failed to generate signed URL: ${signedError?.message ?? "unknown error"}`);
  }

  return { signedUrl: signedData.signedUrl, storagePath };
}

async function deleteCampaignHtml(storagePath: string): Promise<void> {
  const client = getServiceClient();
  await client.storage.from(HTML_BUCKET).remove([storagePath]);
}

// ─── Campaign drafts (Canopy-managed) ────────────────────────────────────────

type CommunityDraftRow = {
  id: string;
  workspace_id: string;
  name: string;
  subject: string;
  from_name: string;
  from_email: string;
  reply_to: string;
  list_ids: string[];
  html_content: string | null;
  design_json: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

function toDraft(row: CommunityDraftRow): CommunityDraft {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    subject: row.subject,
    fromName: row.from_name,
    fromEmail: row.from_email,
    replyTo: row.reply_to,
    listIds: row.list_ids ?? [],
    htmlContent: row.html_content ?? null,
    designJson: row.design_json ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const DRAFT_SELECT =
  "id,workspace_id,name,subject,from_name,from_email,reply_to,list_ids,html_content,design_json,created_at,updated_at";

export async function getWorkspaceDrafts(workspaceId: string): Promise<CommunityDraft[]> {
  const client = getServiceClient();
  const { data, error } = await client
    .from("community_campaigns")
    .select(DRAFT_SELECT)
    .eq("workspace_id", workspaceId)
    .eq("status", "draft")
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as CommunityDraftRow[]).map(toDraft);
}

export async function getWorkspaceDraft(id: string, workspaceId: string): Promise<CommunityDraft | null> {
  const client = getServiceClient();
  const { data, error } = await client
    .from("community_campaigns")
    .select(DRAFT_SELECT)
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .eq("status", "draft")
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // not found
    throw new Error(error.message);
  }
  return toDraft(data as CommunityDraftRow);
}

export async function createWorkspaceDraft(params: {
  workspaceId: string;
  name: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  replyTo: string;
  listIds: string[];
  htmlContent: string | null;
  designJson: Record<string, unknown> | null;
}): Promise<CommunityDraft> {
  const client = getServiceClient();
  const now = new Date().toISOString();
  const { data, error } = await client
    .from("community_campaigns")
    .insert({
      workspace_id: params.workspaceId,
      name: params.name,
      subject: params.subject,
      from_name: params.fromName,
      from_email: params.fromEmail,
      reply_to: params.replyTo,
      list_ids: params.listIds,
      html_content: params.htmlContent,
      design_json: params.designJson,
      status: "draft",
      created_at: now,
      updated_at: now,
    })
    .select(DRAFT_SELECT)
    .single();

  if (error) throw new Error(error.message);
  return toDraft(data as CommunityDraftRow);
}

export async function updateWorkspaceDraft(
  id: string,
  workspaceId: string,
  params: Partial<{
    name: string;
    subject: string;
    fromName: string;
    fromEmail: string;
    replyTo: string;
    listIds: string[];
    htmlContent: string | null;
    designJson: Record<string, unknown> | null;
  }>
): Promise<CommunityDraft> {
  const client = getServiceClient();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (params.name !== undefined) updates.name = params.name;
  if (params.subject !== undefined) updates.subject = params.subject;
  if (params.fromName !== undefined) updates.from_name = params.fromName;
  if (params.fromEmail !== undefined) updates.from_email = params.fromEmail;
  if (params.replyTo !== undefined) updates.reply_to = params.replyTo;
  if (params.listIds !== undefined) updates.list_ids = params.listIds;
  if (params.htmlContent !== undefined) updates.html_content = params.htmlContent;
  if (params.designJson !== undefined) updates.design_json = params.designJson;

  const { data, error } = await client
    .from("community_campaigns")
    .update(updates)
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .eq("status", "draft")
    .select(DRAFT_SELECT)
    .single();

  if (error) throw new Error(error.message);
  return toDraft(data as CommunityDraftRow);
}

export async function deleteWorkspaceDraft(id: string, workspaceId: string): Promise<void> {
  const client = getServiceClient();
  const { error } = await client
    .from("community_campaigns")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw new Error(error.message);
}

// ─── Paginated sent campaigns ─────────────────────────────────────────────────

export async function getSentCampaignsPaginated(
  workspaceId: string,
  page: number,
  pageSize: number
): Promise<{ campaigns: import("@/lib/community-schema").CommunityCampaignSummary[]; total: number; page: number; pageSize: number }> {
  const connectionRow = await getCampaignMonitorConnection(workspaceId);
  if (!connectionRow) throw new Error("No Campaign Monitor connection found for this workspace.");

  const apiKey = resolveCampaignMonitorApiKey({ storedApiKey: connectionRow.api_key });
  if (!apiKey) throw new Error("Campaign Monitor API access is not configured.");

  const credentials = { clientId: connectionRow.client_id, apiKey };
  const result = await getCampaignMonitorSentCampaigns(credentials, pageSize, page);

  const campaigns = await Promise.all(
    result.campaigns.map(async (campaign) => {
      try {
        const stats = await getCampaignMonitorCampaignSummary(credentials, campaign.id);
        return { ...campaign, openRate: stats.openRate, clickRate: stats.clickRate };
      } catch {
        return campaign;
      }
    })
  );

  return { campaigns, total: result.total, page, pageSize };
}

// ─── Compose and send campaign ────────────────────────────────────────────────

export type ComposeCampaignParams = {
  workspaceId: string;
  name: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  replyTo: string;
  listIds: string[];
  htmlContent: string;
  scheduledDate?: string | null;
  confirmationEmail: string;
  draft?: boolean;
};

export async function composeCampaign(params: ComposeCampaignParams) {
  const connectionRow = await getCampaignMonitorConnection(params.workspaceId);

  if (!connectionRow) {
    throw new Error("No Campaign Monitor connection found for this workspace.");
  }

  const apiKey = resolveCampaignMonitorApiKey({
    storedApiKey: connectionRow.api_key,
  });

  if (!apiKey) {
    throw new Error("Campaign Monitor API key is not configured.");
  }

  const credentials = {
    clientId: connectionRow.client_id,
    apiKey,
  };

  // 1. Upload HTML to Supabase Storage and get a short-lived signed URL
  const { signedUrl, storagePath } = await uploadCampaignHtmlForSend({
    workspaceId: params.workspaceId,
    html: params.htmlContent,
  });

  try {
    // 2. Create the draft campaign in Campaign Monitor
    // CM fetches the HTML from the signed URL at this point
    const { campaignId } = await createCampaignMonitorCampaign(credentials, {
      name: params.name,
      subject: params.subject,
      fromName: params.fromName,
      fromEmail: params.fromEmail,
      replyTo: params.replyTo,
      htmlUrl: signedUrl,
      listIds: params.listIds,
    });

    // 3. Send or schedule (skip if saving as draft)
    if (!params.draft) {
      if (params.scheduledDate) {
        await scheduleCampaignMonitorCampaign(
          credentials,
          campaignId,
          params.confirmationEmail,
          params.scheduledDate
        );
      } else {
        await sendCampaignMonitorCampaign(
          credentials,
          campaignId,
          params.confirmationEmail
        );
      }
    }

    // Log to portal nerve center (fire and forget)
    void logPortalActivity({
      workspace_id: params.workspaceId,
      product_key:  "community_canopy",
      event_type:   params.draft
        ? "draft"
        : params.scheduledDate
        ? "newsletter_queued"
        : "newsletter_sent",
      title:         params.subject || params.name,
      scheduled_for: params.scheduledDate && !params.draft
        ? new Date(params.scheduledDate).toISOString()
        : null,
      event_url: `/auth/launch/community?path=/campaigns/${campaignId}`,
    });

    return { campaignId, draft: params.draft === true };
  } finally {
    // 4. Always delete the HTML file from storage — CM has already fetched it
    await deleteCampaignHtml(storagePath).catch(() => null);
  }
}

// ─── Campaign analytics ───────────────────────────────────────────────────────

export async function getCampaignAnalytics(
  workspaceId: string,
  campaignId: string
): Promise<CampaignAnalytics> {
  const connectionRow = await getCampaignMonitorConnection(workspaceId);
  if (!connectionRow) throw new Error("No Campaign Monitor connection found for this workspace.");

  const apiKey = resolveCampaignMonitorApiKey({ storedApiKey: connectionRow.api_key });
  if (!apiKey) throw new Error("Campaign Monitor API access is not configured.");

  const credentials = { clientId: connectionRow.client_id, apiKey };
  return getCampaignMonitorCampaignAnalytics(credentials, campaignId);
}
