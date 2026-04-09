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

export type CommunityTemplateSummary = {
  templateId: string;
  name: string;
  previewUrl: string | null;
  screenshotUrl: string | null;
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
  templates: CommunityTemplateSummary[];
  sentCampaigns: CommunityCampaignSummary[];
  draftCampaigns: CommunityCampaignSummary[];
  scheduledCampaigns: CommunityCampaignSummary[];
  billing: CommunityBilling | null;
  fetchedAt: string;
};
