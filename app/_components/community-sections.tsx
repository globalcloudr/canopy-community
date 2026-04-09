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
  formatShortDate,
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
      <div className="space-y-4 pt-3">
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
    <div className="rounded-lg border border-[var(--app-divider)] bg-[#f8fafc] px-4 py-3">
      <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#8ca0b3]">{label}</p>
      <p className="mt-1.5 text-[15px] font-medium text-[#0f172a]">{value}</p>
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
  description?: string;
  campaigns: CommunityCampaignSummary[];
  emptyTitle: string;
  emptyBody: string;
  action?: React.ReactNode;
}) {
  return (
    <SectionCard title={title} description={description} action={action}>
      {campaigns.length === 0 ? (
        <div className="pt-3">
          <EmptyState title={emptyTitle} body={emptyBody} />
        </div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--app-divider)] text-left text-[13px] font-medium text-[#64748b]">
              <th className="py-3 pr-4 font-medium">Campaign</th>
              <th className="hidden py-3 pr-4 font-medium md:table-cell">Recipients</th>
              <th className="hidden py-3 pr-4 font-medium md:table-cell">Opened</th>
              <th className="hidden py-3 pr-4 font-medium md:table-cell">Clicked</th>
              <th className="py-3 pr-4 text-right font-medium">
                {campaigns[0]?.status === "sent" ? "Sent" : "Edited"}
              </th>
              <th className="w-8 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--app-divider)]">
            {campaigns.map((campaign) => (
              <tr key={campaign.id} className="group">
                <td className="py-3.5 pr-4">
                  <div className="flex items-center gap-3">
                    <CampaignStatusBadge status={campaign.status} />
                    <span className="text-[14px] font-medium text-[#0f172a]">
                      {campaign.subject}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[13px] text-[#64748b] md:hidden">
                    {campaign.fromName || "School newsletter"} &middot; {getCampaignTimingLabel(campaign)}
                  </p>
                </td>
                <td className="hidden py-3.5 pr-4 text-[14px] text-[#334155] md:table-cell">
                  {campaign.recipientCount !== null
                    ? campaign.recipientCount.toLocaleString()
                    : "—"}
                </td>
                <td className="hidden py-3.5 pr-4 text-[14px] text-[#334155] md:table-cell">
                  {campaign.openRate != null ? `${campaign.openRate}%` : "—"}
                </td>
                <td className="hidden py-3.5 pr-4 text-[14px] text-[#334155] md:table-cell">
                  {campaign.clickRate != null ? `${campaign.clickRate}%` : "—"}
                </td>
                <td className="py-3.5 pr-4 text-right text-[14px] text-[#64748b]">
                  {formatShortDate(campaign.sentDate ?? campaign.createdDate)}
                </td>
                <td className="py-3.5 text-right">
                  {campaign.previewUrl || campaign.webVersionUrl ? (
                    <Button asChild variant="ghost" size="sm">
                      <a
                        href={campaign.previewUrl ?? campaign.webVersionUrl ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[13px]"
                      >
                        &#8942;
                      </a>
                    </Button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
      action={action}
    >
      {lists.length === 0 ? (
        <div className="pt-3">
          <EmptyState
            title="No lists yet"
            body="Once your school account is connected, mailing lists will appear here."
          />
        </div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--app-divider)] text-left text-[13px] font-medium text-[#64748b]">
              <th className="py-3 pr-4 font-medium">List name</th>
              <th className="hidden py-3 pr-4 font-medium md:table-cell">Opt-in</th>
              <th className="hidden py-3 pr-4 font-medium md:table-cell">Unsubscribe</th>
              <th className="py-3 text-right font-medium">Subscribers</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--app-divider)]">
            {lists.map((list) => (
              <tr key={list.listId}>
                <td className="py-3.5 pr-4">
                  <span className="text-[14px] font-medium text-[#0f172a]">{list.name}</span>
                </td>
                <td className="hidden py-3.5 pr-4 text-[14px] text-[#334155] md:table-cell">
                  {typeof list.confirmedOptIn === "boolean"
                    ? list.confirmedOptIn
                      ? "Confirmed"
                      : "Single"
                    : "—"}
                </td>
                <td className="hidden py-3.5 pr-4 text-[14px] text-[#334155] md:table-cell">
                  {list.unsubscribeSetting ?? "—"}
                </td>
                <td className="py-3.5 text-right text-[14px] font-medium text-[#334155]">
                  {typeof list.subscriberCount === "number"
                    ? list.subscriberCount.toLocaleString()
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
      action={action}
    >
      {templates.length === 0 ? (
        <div className="pt-3">
          <EmptyState
            title="No templates yet"
            body="Templates will appear here once they are available in the connected account."
          />
        </div>
      ) : (
        <div className="divide-y divide-[var(--app-divider)]">
          {templates.map((template) => (
            <div key={template.templateId} className="flex items-center gap-4 py-3.5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#e2e8f0] bg-white">
                {template.screenshotUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={template.screenshotUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[10px] uppercase tracking-[0.14em] text-[#94a3b8]">Tmpl</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium text-[#0f172a]">{template.name}</p>
                <p className="mt-0.5 text-[13px] text-[#64748b]">
                  Ready to use for future newsletters
                </p>
              </div>
              {template.previewUrl ? (
                <Button asChild variant="secondary" size="sm">
                  <a href={template.previewUrl} target="_blank" rel="noreferrer">
                    Open preview
                  </a>
                </Button>
              ) : null}
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
