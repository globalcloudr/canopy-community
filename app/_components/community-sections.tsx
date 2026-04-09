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
}: {
  connection: CommunityConnection | null;
  syncError: string | null;
}) {
  return (
    <SectionCard
      title="Campaign Monitor"
      description="Each workspace stores its own Campaign Monitor client connection so school users only see their own newsletters, lists, and templates."
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
        </div>
        {connection ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <ConnectionFact label="Client ID" value={connection.clientId} />
            <ConnectionFact label="Timezone" value={connection.timezone || "Not available"} />
            <ConnectionFact label="Country" value={connection.country || "Not available"} />
            <ConnectionFact label="Last validated" value={formatCompactDateTime(connection.lastValidatedAt)} />
          </div>
        ) : (
          <EmptyState
            title="Connect a school account"
            body="Add the Campaign Monitor client ID and API key for this workspace in Settings. Once connected, Community can read lists, templates, and newsletter history directly from that account."
          />
        )}
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
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="border-b border-[var(--app-divider)] text-[12px] uppercase tracking-[0.16em] text-[#8ca0b3]">
                <th className="pb-3 font-semibold">Campaign</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Audience</th>
                <th className="pb-3 font-semibold">Timing</th>
                <th className="pb-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="border-b border-[var(--app-divider)] align-top last:border-b-0">
                  <td className="py-4 pr-4">
                    <p className="text-[15px] font-semibold tracking-[-0.02em] text-[#0f172a]">
                      {campaign.subject}
                    </p>
                    <p className="mt-1 text-[13px] leading-6 text-[#617284]">
                      {campaign.fromName || "Canopy Community"}{campaign.replyTo ? ` • ${campaign.replyTo}` : ""}
                    </p>
                  </td>
                  <td className="py-4 pr-4">
                    <CampaignStatusBadge status={campaign.status} />
                  </td>
                  <td className="py-4 pr-4 text-[14px] text-[#526072]">
                    {campaign.recipientCount !== null ? `${campaign.recipientCount.toLocaleString()} recipients` : "Recipient count not available"}
                  </td>
                  <td className="py-4 pr-4 text-[14px] text-[#526072]">
                    {campaign.status === "scheduled"
                      ? formatCompactDateTime(campaign.scheduledDate)
                      : campaign.status === "sent"
                        ? formatCompactDateTime(campaign.sentDate)
                        : formatCompactDateTime(campaign.createdDate)}
                  </td>
                  <td className="py-4">
                    <div className="flex flex-wrap gap-2">
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
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
      title="Audience lists"
      description="These lists come directly from Campaign Monitor and stay scoped to the active school workspace."
      action={action}
    >
      {lists.length === 0 ? (
        <EmptyState
          title="No lists available"
          body="Once a Campaign Monitor account is connected, the workspace’s newsletter lists will appear here for planning and sending."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {lists.map((list) => (
            <div key={list.listId} className="rounded-[22px] border border-[var(--app-divider)] bg-[#f8fafc] px-5 py-5">
              <p className="text-[16px] font-semibold tracking-[-0.02em] text-[#0f172a]">{list.name}</p>
              <p className="mt-2 text-[13px] leading-6 text-[#617284]">List ID: {list.listId}</p>
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
      description="Community reads the templates already set up in Campaign Monitor so your schools can keep using the designs they know."
      action={action}
    >
      {templates.length === 0 ? (
        <EmptyState
          title="No templates found"
          body="Templates will appear here after the connected Campaign Monitor account exposes them through the client."
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
                <p className="mt-2 truncate text-[13px] leading-6 text-[#617284]">{template.templateId}</p>
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
