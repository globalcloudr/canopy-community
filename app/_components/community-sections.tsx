import {
  BodyText,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@globalcloudr/canopy-ui";
import type {
  CommunityCampaignSummary,
  CommunityConnection,
  CommunityListSummary,
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
      title="Account Activation"
      description="Connect your school account and start creating and sending newsletters."
      action={<SecondaryButtonLink href="/settings" label={connection ? "Manage connection" : "Connect account"} />}
    >
      <div className="space-y-4 pt-3">
        <SyncErrorNotice message={syncError} />
        <div className="flex flex-wrap items-center gap-3">
          <ConnectionBadge connected={Boolean(connection)} />
          {connection?.accountName ? (
            <p className="text-[14px] text-[#526072]">
              Connected account: <span className="font-medium text-[var(--ink)]">{connection.accountName}</span>
            </p>
          ) : null}
          {connection?.lastValidatedAt ? (
            <p className="text-[14px] text-[#526072]">
              Last checked: <span className="font-medium text-[var(--ink)]">{formatCompactDateTime(connection.lastValidatedAt)}</span>
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
      </div>
    </SectionCard>
  );
}

function ConnectionFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--app-divider)] bg-[var(--surface-muted)] px-4 py-3">
      <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#8ca0b3]">{label}</p>
      <p className="mt-1.5 text-[15px] font-medium text-[var(--ink)]">{value}</p>
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
            <tr className="border-b border-[var(--app-divider)] text-left text-[13px] font-medium text-[var(--text-muted)]">
              <th className="py-3 pr-4 font-medium">Campaign</th>
              <th className="hidden py-3 pr-4 text-right font-medium md:table-cell">Recipients</th>
              <th className="hidden py-3 pr-4 text-right font-medium md:table-cell">Opened</th>
              <th className="hidden py-3 pr-4 text-right font-medium md:table-cell">Clicked</th>
              <th className="py-3 pr-4 text-right font-medium">
                {campaigns[0]?.status === "sent" ? "Sent" : "Edited"}
              </th>
              <th className="w-8 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--app-divider)]">
            {campaigns.map((campaign) => {
              const primaryUrl = campaign.webVersionUrl ?? campaign.previewUrl;
              return (
                <tr key={campaign.id} className="group hover:bg-[var(--surface-muted)]">
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-3">
                      <CampaignStatusBadge status={campaign.status} />
                      {primaryUrl ? (
                        <a
                          href={primaryUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[14px] font-medium text-[var(--ink)] hover:text-[var(--accent)] hover:underline"
                        >
                          {campaign.subject}
                        </a>
                      ) : (
                        <span className="text-[14px] font-medium text-[var(--ink)]">
                          {campaign.subject}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[13px] text-[var(--text-muted)] md:hidden">
                      {campaign.fromName || "School newsletter"} &middot; {getCampaignTimingLabel(campaign)}
                    </p>
                  </td>
                  <td className="hidden py-3.5 pr-4 text-right text-[14px] text-[var(--ink-2)] md:table-cell">
                    {campaign.recipientCount !== null
                      ? campaign.recipientCount.toLocaleString()
                      : "—"}
                  </td>
                  <td className="hidden py-3.5 pr-4 text-right text-[14px] text-[var(--ink-2)] md:table-cell">
                    {campaign.openRate != null ? `${campaign.openRate}%` : "—"}
                  </td>
                  <td className="hidden py-3.5 pr-4 text-right text-[14px] text-[var(--ink-2)] md:table-cell">
                    {campaign.clickRate != null ? `${campaign.clickRate}%` : "—"}
                  </td>
                  <td className="py-3.5 pr-4 text-right text-[14px] text-[var(--text-muted)]">
                    {formatShortDate(campaign.sentDate ?? campaign.createdDate)}
                  </td>
                  <td className="py-3.5">
                    <CampaignActionsMenu campaign={campaign} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </SectionCard>
  );
}

const CM_HOME = "https://app.createsend.com";

function CampaignActionsMenu({ campaign }: { campaign: CommunityCampaignSummary }) {
  const items: { label: string; href: string }[] = [];

  if (campaign.webVersionUrl) {
    items.push({ label: "View newsletter", href: campaign.webVersionUrl });
  }
  if (campaign.previewUrl) {
    items.push({ label: "Preview", href: campaign.previewUrl });
  }
  items.push({
    label: campaign.status === "sent" ? "Open in Campaign Monitor" : "Edit in Campaign Monitor",
    href: CM_HOME,
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-7 w-7 items-center justify-center rounded text-[var(--faint)] opacity-0 transition hover:bg-[var(--rule)] hover:text-[var(--ink-2)] group-hover:opacity-100"
          aria-label="Campaign actions"
        >
          <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
            <circle cx="8" cy="3" r="1.25" />
            <circle cx="8" cy="8" r="1.25" />
            <circle cx="8" cy="13" r="1.25" />
          </svg>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 bg-white">
        {items.map((item) => (
          <DropdownMenuItem key={item.label} asChild>
            <a href={item.href} target="_blank" rel="noreferrer">
              {item.label}
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
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
            <tr className="border-b border-[var(--app-divider)] text-left text-[13px] font-medium text-[var(--text-muted)]">
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
                  <span className="text-[14px] font-medium text-[var(--ink)]">{list.name}</span>
                </td>
                <td className="hidden py-3.5 pr-4 text-[14px] text-[var(--ink-2)] md:table-cell">
                  {typeof list.confirmedOptIn === "boolean"
                    ? list.confirmedOptIn
                      ? "Confirmed"
                      : "Single"
                    : "—"}
                </td>
                <td className="hidden py-3.5 pr-4 text-[14px] text-[var(--ink-2)] md:table-cell">
                  {list.unsubscribeSetting ?? "—"}
                </td>
                <td className="py-3.5 text-right text-[14px] font-medium text-[var(--ink-2)]">
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
