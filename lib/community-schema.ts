export type CommunityConnection = {
  workspaceId: string;
  clientId: string;
  accountName: string | null;
  country: string | null;
  timezone: string | null;
  authType: "api_key";
  apiKeyConfigured: boolean;
  lastValidatedAt: string | null;
  updatedAt: string;
};

export type CommunityTemplate = {
  id: string;
  workspaceId: string;
  name: string;
  designJson: Record<string, unknown>;
  htmlPreview: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CommunityListSummary = {
  listId: string;
  name: string;
  unsubscribeSetting: string | null;
  confirmedOptIn: boolean | null;
  subscriberCount: number | null;
};

export type CommunityCampaignStatus = "sent" | "draft" | "scheduled";

export type CommunityCampaignSummary = {
  id: string;
  status: CommunityCampaignStatus;
  name: string;
  subject: string;
  fromName: string | null;
  fromEmail: string | null;
  replyTo: string | null;
  createdDate: string | null;
  sentDate: string | null;
  scheduledDate: string | null;
  previewUrl: string | null;
  webVersionUrl: string | null;
  recipientCount: number | null;
  openRate: number | null;
  clickRate: number | null;
  tags: string[];
};

export type CommunityDraft = {
  id: string;
  workspaceId: string;
  name: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  replyTo: string;
  listIds: string[];
  htmlContent: string | null;
  designJson: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type CampaignAnalyticsLink = {
  url: string;
  totalClicks: number;
  uniqueClicks: number;
};

export type CampaignAnalytics = {
  recipients: number | null;
  uniqueOpened: number | null;
  openRate: number | null;
  uniqueClicks: number | null;
  clickRate: number | null;
  clicksToOpenRate: number | null;
  bounced: number | null;
  unsubscribed: number | null;
  spamComplaints: number | null;
  forwards: number | null;
  likes: number | null;
  mentions: number | null;
  topLinks: CampaignAnalyticsLink[];
  webVersionUrl: string | null;
};

export type CommunityBilling = {
  credits: number | null;
  canPurchaseCredits: boolean;
  clientPays: boolean;
  baseRatePerRecipient: number | null;
  currency: string | null;
};

export type CommunityOverview = {
  connection: CommunityConnection | null;
  sharedApiKeyConfigured: boolean;
  syncError: string | null;
  account: {
    name: string | null;
    country: string | null;
    timezone: string | null;
  } | null;
  stats: {
    listCount: number;
    templateCount: number;
    sentCampaignCount: number;
    draftCampaignCount: number;
    scheduledCampaignCount: number;
  };
  lists: CommunityListSummary[];
  templates: CommunityTemplate[];
  sentCampaigns: CommunityCampaignSummary[];
  draftCampaigns: CommunityDraft[];
  scheduledCampaigns: CommunityCampaignSummary[];
  billing: CommunityBilling | null;
  fetchedAt: string;
};
