import { BodyText, Button } from "@canopy/ui";
import type {
  CommunityCampaignSummary,
  CommunityConnection,
  CommunityListSummary,
  CommunityTemplateSummary,
} from "@/lib/community-schema";
import {
  CampaignStatusBadge,
  ConnectionBadge,
  EmptyState,
  SectionCard,
  SecondaryButtonLink,
  SyncErrorNotice,
  formatCompactDateTime,
  formatDate,
} from "@/app/_components/community-ui";

export function ConnectionSection({
  connection,
  syncError,
  showDetails = true,
}: {
  connection: CommunityConnection | null;
  syncError: string | null;
  showDetails?: boolean;
}) {
  return (
    <SectionCard
      title="Campaign Monitor"
      description="Connect your school's Campaign Monitor account to bring in newsletters, lists, and templates."
      action={<SecondaryButtonLink href="/settings" label={connection ? "Manage connection" : "Connect account"} />}
    >
      <div className="space-y-4">
        <SyncErrorNotice message={syncError} />
        <div className="flex flex-wrap items-center gap-3">
          <ConnectionBadge connected={Boolean(connection)} />
          {connection?.accountName ? (
            <p className="text-[14px] text-[#526072]">
              Connected account: <span className="font-medium text-[#0f172a]">{connection.accountName}</span>
            </p>
          ) : null}
          {connection?.lastValidatedAt ? (
            <p className="text-[14px] text-[#526072]">
              Last checked: <span className="font-medium text-[#0f172a]">{formatCompactDateTime(connection.lastValidatedAt)}</span>
            </p>
          ) : null}
        </div>
        {connection && showDetails ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <ConnectionFact label="Timezone" value={connection.timezone || "Not available"} />
            <ConnectionFact label="Country" value={connection.country || "Not available"} />
            <ConnectionFact label="Updated" value={formatCompactDateTime(connection.updatedAt)} />
          </div>
        ) : null}
        {!connection ? (
          <EmptyState
            title="Connect your school account"
            body="Add the school's Campaign Monitor Client ID in Settings. Once connected, Community will bring in recent sends, mailing lists, and templates."
          />
        ) : null}
      </div>
    </SectionCard>
  );
}

function ConnectionFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-[var(--app-divider)] bg-[#f8fafc] px-4 py-4">
      <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#8ca0b3]">{label}</p>
      <p className="mt-2 text-[15px] font-medium text-[#0f172a]">{value}</p>
    </div>
  );
}

export function CampaignTable({
  title,
  description,
  campaigns,
  emptyTitle,
  emptyBody,
  action,
}: {
  title: string;
  description: string;
  campaigns: CommunityCampaignSummary[];
  emptyTitle: string;
  emptyBody: string;
  action?: React.ReactNode;
}) {
  return (
    <SectionCard title={title} description={description} action={action}>
      {campaigns.length === 0 ? (
        <EmptyState title={emptyTitle} body={emptyBody} />
      ) : (
        <div className="space-y-3">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="grid gap-3 rounded-[22px] border border-[var(--app-divider)] bg-[#fbfdff] px-4 py-4 md:grid-cols-[minmax(0,1fr)_auto]"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[15px] font-semibold tracking-[-0.02em] text-[#0f172a]">
                    {campaign.subject}
                  </p>
                  <CampaignStatusBadge status={campaign.status} />
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-[#617284]">
                  <span>{campaign.fromName || "School newsletter"}</span>
                  {campaign.recipientCount !== null ? (
                    <span>{campaign.recipientCount.toLocaleString()} recipients</span>
                  ) : null}
                  <span>{getCampaignTimingLabel(campaign)}</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 md:justify-end">
                {campaign.previewUrl ? (
                  <Button asChild variant="secondary" size="sm">
                    <a href={campaign.previewUrl} target="_blank" rel="noreferrer">
                      Preview
                    </a>
                  </Button>
                ) : null}
                {campaign.webVersionUrl ? (
                  <Button asChild variant="ghost" size="sm">
                    <a href={campaign.webVersionUrl} target="_blank" rel="noreferrer">
                      Web view
                    </a>
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

function getCampaignTimingLabel(campaign: CommunityCampaignSummary) {
  if (campaign.status === "scheduled") {
    return `Scheduled ${formatCompactDateTime(campaign.scheduledDate)}`;
  }

  if (campaign.status === "sent") {
    return `Sent ${formatCompactDateTime(campaign.sentDate)}`;
  }

  return `Updated ${formatCompactDateTime(campaign.createdDate)}`;
}

export function AudienceListSection({
  lists,
  action,
}: {
  lists: CommunityListSummary[];
  action?: React.ReactNode;
}) {
  return (
    <SectionCard
      title="Mailing lists"
      description="See the mailing lists already set up for this school."
      action={action}
    >
      {lists.length === 0 ? (
        <EmptyState
          title="No lists yet"
          body="Once your school account is connected, mailing lists will appear here."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {lists.map((list) => (
            <div key={list.listId} className="rounded-[22px] border border-[var(--app-divider)] bg-[#f8fafc] px-5 py-5">
              <p className="text-[16px] font-semibold tracking-[-0.02em] text-[#0f172a]">{list.name}</p>
              <p className="mt-2 text-[13px] leading-6 text-[#617284]">
                Managed in Campaign Monitor and available for future sends.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-[12px] text-[#526072]">
                {list.unsubscribeSetting ? (
                  <span className="rounded-full border border-[#d7e2ec] px-3 py-1">Unsubscribe: {list.unsubscribeSetting}</span>
                ) : null}
                {typeof list.confirmedOptIn === "boolean" ? (
                  <span className="rounded-full border border-[#d7e2ec] px-3 py-1">
                    {list.confirmedOptIn ? "Confirmed opt-in" : "Single opt-in"}
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

export function TemplateListSection({
  templates,
  action,
}: {
  templates: CommunityTemplateSummary[];
  action?: React.ReactNode;
}) {
  return (
    <SectionCard
      title="Newsletter templates"
      description="Keep using the newsletter layouts your school already has."
      action={action}
    >
      {templates.length === 0 ? (
        <EmptyState
          title="No templates yet"
          body="Templates will appear here once they are available in the connected account."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {templates.map((template) => (
            <div key={template.templateId} className="flex gap-4 rounded-[22px] border border-[var(--app-divider)] bg-[#f8fafc] p-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#d7e2ec] bg-white">
                {template.screenshotUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={template.screenshotUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[11px] uppercase tracking-[0.16em] text-[#94a3b8]">Template</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[16px] font-semibold tracking-[-0.02em] text-[#0f172a]">{template.name}</p>
                <p className="mt-2 text-[13px] leading-6 text-[#617284]">
                  Ready to use for future school newsletters.
                </p>
                {template.previewUrl ? (
                  <div className="mt-3">
                    <Button asChild variant="secondary" size="sm">
                      <a href={template.previewUrl} target="_blank" rel="noreferrer">
                        Open preview
                      </a>
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

export function DataTimestamp({
  value,
}: {
  value: string | null;
}) {
  return (
    <BodyText muted>
      Last refreshed {formatDate(value)}
    </BodyText>
  );
}
