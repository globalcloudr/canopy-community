import type {
  CommunityCampaignSummary,
  CommunityListSummary,
  CommunityTemplateSummary,
} from "@/lib/community-schema";

const CAMPAIGN_MONITOR_API_BASE_URL =
  process.env.CAMPAIGN_MONITOR_API_BASE_URL?.trim() ||
  "https://api.createsend.com/api/v3.3";

export class CampaignMonitorApiError extends Error {
  status: number;
  code: number | null;

  constructor(message: string, status: number, code: number | null = null) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

type CampaignMonitorCredentials = {
  clientId: string;
  apiKey: string;
};

type CampaignMonitorErrorPayload = {
  Code?: number | string | null;
  Message?: string | null;
};

type CampaignMonitorClientDetails = {
  // Flat structure (some API versions / access levels)
  ClientID?: string;
  Name?: string | null;
  Country?: string | null;
  TimeZone?: string | null;
  // Nested structure returned by GET /clients/{id}.json
  BasicDetails?: {
    ClientID?: string | null;
    CompanyName?: string | null;
    ContactName?: string | null;
    EmailAddress?: string | null;
    Country?: string | null;
    TimeZone?: string | null;
  } | null;
};

type CampaignMonitorListRow = {
  ListID?: string | null;
  Name?: string | null;
  UnsubscribeSetting?: string | null;
  ConfirmedOptIn?: boolean | null;
  Title?: string | null;
};

type CampaignMonitorTemplateRow = {
  TemplateID?: string | null;
  Name?: string | null;
  PreviewURL?: string | null;
  ScreenshotURL?: string | null;
};

type CampaignMonitorCampaignRow = {
  CampaignID?: string | null;
  Name?: string | null;
  Subject?: string | null;
  FromName?: string | null;
  FromEmail?: string | null;
  ReplyTo?: string | null;
  PreviewURL?: string | null;
  WebVersionURL?: string | null;
  SentDate?: string | null;
  CreatedDate?: string | null;
  DateCreated?: string | null;
  DateScheduled?: string | null;
  ScheduledDate?: string | null;
  TotalRecipients?: number | null;
  RecipientCount?: number | null;
  UniqueOpened?: number | null;
  Clicks?: number | null;
  Tags?: string[] | null;
};

type CampaignMonitorPagedResponse<T> = {
  Results?: T[] | null;
  TotalNumberOfRecords?: number | null;
};

function encodeBasicAuth(apiKey: string) {
  return Buffer.from(`${apiKey}:x`).toString("base64");
}

function computeRate(count: number | null, total: number | null): number | null {
  if (count === null || total === null || total === 0) return null;
  return Math.round((count / total) * 1000) / 10;
}

function normalizeNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function toCampaignSummary(
  row: CampaignMonitorCampaignRow,
  status: CommunityCampaignSummary["status"]
): CommunityCampaignSummary | null {
  const id = row.CampaignID?.trim();
  if (!id) {
    return null;
  }

  return {
    id,
    status,
    name: row.Name?.trim() || row.Subject?.trim() || "Untitled campaign",
    subject: row.Subject?.trim() || "Untitled campaign",
    fromName: row.FromName?.trim() || null,
    fromEmail: row.FromEmail?.trim() || null,
    replyTo: row.ReplyTo?.trim() || null,
    createdDate: row.CreatedDate ?? row.DateCreated ?? null,
    sentDate: row.SentDate ?? null,
    scheduledDate: row.DateScheduled ?? row.ScheduledDate ?? null,
    previewUrl: row.PreviewURL?.trim() || null,
    webVersionUrl: row.WebVersionURL?.trim() || null,
    recipientCount: normalizeNumber(row.TotalRecipients ?? row.RecipientCount),
    openRate: computeRate(normalizeNumber(row.UniqueOpened), normalizeNumber(row.TotalRecipients ?? row.RecipientCount)),
    clickRate: computeRate(normalizeNumber(row.Clicks), normalizeNumber(row.TotalRecipients ?? row.RecipientCount)),
    tags: Array.isArray(row.Tags) ? row.Tags.filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0) : [],
  };
}

async function parseError(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  let message = `Campaign Monitor request failed with status ${response.status}.`;
  let code: number | null = null;

  if (contentType.includes("application/json")) {
    const payload = (await response.json().catch(() => null)) as CampaignMonitorErrorPayload | null;
    const normalizedCode = normalizeNumber(payload?.Code);
    if (normalizedCode !== null) {
      code = normalizedCode;
    }
    if (payload?.Message?.trim()) {
      message = payload.Message.trim();
    }
  } else {
    const text = await response.text().catch(() => "");
    if (text.trim()) {
      message = text.trim();
    }
  }

  throw new CampaignMonitorApiError(message, response.status, code);
}

async function requestJson<T>(
  path: string,
  credentials: CampaignMonitorCredentials,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(`${CAMPAIGN_MONITOR_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${encodeBasicAuth(credentials.apiKey)}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    await parseError(response);
  }

  return response.json() as Promise<T>;
}

function extractPagedResults<T>(payload: T[] | CampaignMonitorPagedResponse<T>) {
  if (Array.isArray(payload)) {
    return {
      results: payload,
      total: payload.length,
    };
  }

  return {
    results: payload.Results ?? [],
    total: normalizeNumber(payload.TotalNumberOfRecords) ?? (payload.Results?.length ?? 0),
  };
}

export async function getCampaignMonitorClientDetails(
  credentials: CampaignMonitorCredentials
) {
  const payload = await requestJson<CampaignMonitorClientDetails>(
    `/clients/${encodeURIComponent(credentials.clientId)}.json`,
    credentials
  );

  // CM returns details nested under BasicDetails for most access levels
  const basic = payload.BasicDetails;

  return {
    clientId: basic?.ClientID?.trim() || payload.ClientID?.trim() || credentials.clientId,
    name: basic?.CompanyName?.trim() || payload.Name?.trim() || null,
    country: basic?.Country?.trim() || payload.Country?.trim() || null,
    timezone: basic?.TimeZone?.trim() || payload.TimeZone?.trim() || null,
  };
}

export async function getCampaignMonitorLists(
  credentials: CampaignMonitorCredentials
): Promise<CommunityListSummary[]> {
  const payload = await requestJson<CampaignMonitorListRow[]>(
    `/clients/${encodeURIComponent(credentials.clientId)}/lists.json`,
    credentials
  );

  const results: CommunityListSummary[] = [];

  for (const row of payload) {
    const listId = row.ListID?.trim();
    if (!listId) continue;

    results.push({
      listId,
      name: row.Name?.trim() || row.Title?.trim() || "Untitled list",
      unsubscribeSetting: row.UnsubscribeSetting?.trim() || null,
      confirmedOptIn:
        typeof row.ConfirmedOptIn === "boolean" ? row.ConfirmedOptIn : null,
      subscriberCount: null,
    });
  }

  return results;
}

export async function getCampaignMonitorTemplates(
  credentials: CampaignMonitorCredentials
): Promise<CommunityTemplateSummary[]> {
  const payload = await requestJson<CampaignMonitorTemplateRow[]>(
    `/clients/${encodeURIComponent(credentials.clientId)}/templates.json`,
    credentials
  );

  return payload
    .map((row) => {
      const templateId = row.TemplateID?.trim();
      if (!templateId) {
        return null;
      }

      return {
        templateId,
        name: row.Name?.trim() || "Untitled template",
        previewUrl: row.PreviewURL?.trim() || null,
        screenshotUrl: row.ScreenshotURL?.trim() || null,
      };
    })
    .filter((row): row is CommunityTemplateSummary => row !== null);
}

export async function getCampaignMonitorSentCampaigns(
  credentials: CampaignMonitorCredentials,
  pageSize = 8
) {
  const payload = await requestJson<
    CampaignMonitorCampaignRow[] | CampaignMonitorPagedResponse<CampaignMonitorCampaignRow>
  >(
    `/clients/${encodeURIComponent(credentials.clientId)}/campaigns.json?page=1&pagesize=${pageSize}&orderdirection=desc`,
    credentials
  );

  const extracted = extractPagedResults(payload);
  return {
    campaigns: extracted.results
      .map((row) => toCampaignSummary(row, "sent"))
      .filter((row): row is CommunityCampaignSummary => row !== null),
    total: extracted.total,
  };
}

export async function getCampaignMonitorDraftCampaigns(
  credentials: CampaignMonitorCredentials
) {
  const payload = await requestJson<CampaignMonitorCampaignRow[]>(
    `/clients/${encodeURIComponent(credentials.clientId)}/drafts.json`,
    credentials
  );

  return payload
    .map((row) => toCampaignSummary(row, "draft"))
    .filter((row): row is CommunityCampaignSummary => row !== null);
}

export async function getCampaignMonitorScheduledCampaigns(
  credentials: CampaignMonitorCredentials
) {
  const payload = await requestJson<CampaignMonitorCampaignRow[]>(
    `/clients/${encodeURIComponent(credentials.clientId)}/scheduled.json`,
    credentials
  );

  return payload
    .map((row) => toCampaignSummary(row, "scheduled"))
    .filter((row): row is CommunityCampaignSummary => row !== null);
}

// ─── Client billing details ───────────────────────────────────────────────────

type CampaignMonitorClientDetailsWithBilling = {
  ClientID?: string;
  Name?: string | null;
  Country?: string | null;
  TimeZone?: string | null;
  BillingDetails?: {
    Credits?: number | null;
    CanPurchaseCredits?: boolean | null;
    ClientPays?: boolean | null;
    BaseRatePerRecipient?: number | null;
    Currency?: string | null;
  } | null;
};

export async function getCampaignMonitorClientBilling(
  credentials: CampaignMonitorCredentials
) {
  const payload = await requestJson<CampaignMonitorClientDetailsWithBilling>(
    `/clients/${encodeURIComponent(credentials.clientId)}.json`,
    credentials
  );

  const billing = payload.BillingDetails;

  return {
    credits: normalizeNumber(billing?.Credits),
    canPurchaseCredits: billing?.CanPurchaseCredits ?? false,
    clientPays: billing?.ClientPays ?? true,
    baseRatePerRecipient: normalizeNumber(billing?.BaseRatePerRecipient),
    currency: billing?.Currency?.trim() || null,
  };
}

// ─── Campaign creation and sending ───────────────────────────────────────────

type CreateCampaignParams = {
  name: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  replyTo: string;
  htmlUrl: string;
  listIds: string[];
};

type CreateCampaignResponse = {
  campaignId: string;
};

export async function createCampaignMonitorCampaign(
  credentials: CampaignMonitorCredentials,
  params: CreateCampaignParams
): Promise<CreateCampaignResponse> {
  const body = {
    Name: params.name,
    Subject: params.subject,
    FromName: params.fromName,
    FromEmail: params.fromEmail,
    ReplyTo: params.replyTo,
    HtmlUrl: params.htmlUrl,
    ListIDs: params.listIds,
  };

  const campaignId = await requestJson<string>(
    `/campaigns/${encodeURIComponent(credentials.clientId)}.json`,
    credentials,
    { method: "POST", body: JSON.stringify(body) }
  );

  return { campaignId };
}

export async function sendCampaignMonitorCampaign(
  credentials: CampaignMonitorCredentials,
  campaignId: string,
  confirmationEmail: string
): Promise<void> {
  await requestJson<unknown>(
    `/campaigns/${encodeURIComponent(campaignId)}/send.json`,
    credentials,
    {
      method: "POST",
      body: JSON.stringify({
        ConfirmationEmail: confirmationEmail,
        SendDate: "Immediately",
      }),
    }
  );
}

export async function scheduleCampaignMonitorCampaign(
  credentials: CampaignMonitorCredentials,
  campaignId: string,
  confirmationEmail: string,
  scheduledDate: string
): Promise<void> {
  await requestJson<unknown>(
    `/campaigns/${encodeURIComponent(campaignId)}/schedule.json`,
    credentials,
    {
      method: "POST",
      body: JSON.stringify({
        ConfirmationEmail: confirmationEmail,
        ScheduledDate: scheduledDate,
      }),
    }
  );
}

type CampaignMonitorListStatsResponse = {
  TotalActiveSubscribers?: number | null;
  NewActiveSubscribersToday?: number | null;
  NewActiveSubscribersYesterday?: number | null;
  NewActiveSubscribersThisWeek?: number | null;
  NewActiveSubscribersThisMonth?: number | null;
  NewActiveSubscribersThisYear?: number | null;
  TotalUnsubscribes?: number | null;
  TotalDeleted?: number | null;
  TotalBounces?: number | null;
};

export async function getCampaignMonitorListStats(
  credentials: CampaignMonitorCredentials,
  listId: string
): Promise<{ totalActiveSubscribers: number | null }> {
  const payload = await requestJson<CampaignMonitorListStatsResponse>(
    `/lists/${encodeURIComponent(listId)}/stats.json`,
    credentials
  );

  return {
    totalActiveSubscribers: normalizeNumber(payload.TotalActiveSubscribers),
  };
}
