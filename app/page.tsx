"use client";

import { Button, cn } from "@canopy/ui";
import { ProductShell } from "@/app/_components/product-shell";
import { communityNavItems } from "@/app/_components/community-nav";
import { useCommunityOverview } from "@/app/_components/community-data";
import { EmptyState, formatCompactDateTime } from "@/app/_components/community-ui";
import { useProductShell } from "@/app/_components/product-shell";
import type {
  CommunityCampaignSummary,
  CommunityConnection,
  CommunityListSummary,
  CommunityTemplateSummary,
} from "@/lib/community-schema";

export default function DashboardPage() {
  return (
    <ProductShell activeNav="dashboard" navItems={communityNavItems}>
      <DashboardContent />
    </ProductShell>
  );
}

function DashboardContent() {
  const { overview, error, loading, refresh } = useCommunityOverview();
  const { activeWorkspace } = useProductShell();
  const schoolName = activeWorkspace?.name ?? "your school";

  const draftCount = overview?.stats.draftCampaignCount ?? 0;
  const scheduledCount = overview?.stats.scheduledCampaignCount ?? 0;
  const sentCount = overview?.stats.sentCampaignCount ?? 0;
  const listCount = overview?.stats.listCount ?? 0;

  return (
    <div className="flex flex-col gap-5">
      <DashboardHeader
        schoolName={schoolName}
        summary={buildSummaryLine({
          draftCount,
          scheduledCount,
          sentCount,
          listCount,
        })}
        loading={loading}
        onRefresh={() => void refresh()}
      />

      <DashboardNotice
        connection={overview?.connection ?? null}
        syncError={overview?.syncError ?? null}
      />

      {error ? <EmptyState title="We could not load your newsletter data" body={error} /> : null}

      <DashboardSection
        title="Drafts"
        count={draftCount}
        actionHref="/campaigns"
        actionLabel="View all drafts"
      >
        <CampaignRows
          campaigns={overview?.draftCampaigns ?? []}
          emptyTitle="No drafts right now"
          emptyBody="Draft newsletters will show up here as soon as they are saved."
          kind="draft"
        />
      </DashboardSection>

      <DashboardSection
        title="Scheduled"
        count={scheduledCount}
        actionHref="/campaigns"
        actionLabel="View scheduled"
      >
        <CampaignRows
          campaigns={overview?.scheduledCampaigns ?? []}
          emptyTitle="Nothing scheduled"
          emptyBody="Scheduled newsletters will appear here once a send date is set."
          kind="scheduled"
        />
      </DashboardSection>

      <DashboardSection
        title="Recent sends"
        count={sentCount}
        actionHref="/campaigns"
        actionLabel="View sent newsletters"
      >
        <CampaignRows
          campaigns={overview?.sentCampaigns ?? []}
          emptyTitle="No sent newsletters yet"
          emptyBody="Sent newsletters will appear here once your school account is connected."
          kind="sent"
        />
      </DashboardSection>

      <DashboardSection
        title="Lists"
        count={listCount}
        actionHref="/audiences"
        actionLabel="See all lists"
      >
        <ListRows lists={overview?.lists ?? []} />
      </DashboardSection>

      <DashboardSection
        title="Templates"
        count={overview?.templates.length ?? 0}
        actionHref="/templates"
        actionLabel="See all templates"
      >
        <TemplateRows templates={overview?.templates ?? []} />
      </DashboardSection>
    </div>
  );
}

function DashboardHeader({
  schoolName,
  summary,
  loading,
  onRefresh,
}: {
  schoolName: string;
  summary: string;
  loading: boolean;
  onRefresh: () => void;
}) {
  return (
    <section className="rounded-[30px] border border-[var(--app-surface-border)] bg-white px-6 py-6 sm:px-8 sm:py-7">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="max-w-3xl">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#0f766e]">
            Canopy Community
          </p>
          <h1 className="mt-2 text-[2.25rem] font-semibold tracking-[-0.05em] text-[#0f172a] sm:text-[2.7rem]">
            Welcome back
          </h1>
          <p className="mt-3 text-[16px] leading-7 text-[#526072]">
            {summary} for {schoolName}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 md:justify-end">
          <Button variant="secondary" onClick={onRefresh} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </Button>
          <Button asChild>
            <a href="/campaigns">View newsletters</a>
          </Button>
        </div>
      </div>
    </section>
  );
}

function DashboardNotice({
  connection,
  syncError,
}: {
  connection: CommunityConnection | null;
  syncError: string | null;
}) {
  if (syncError) {
    return (
      <StatusNotice
        tone="warning"
        title="Connection needs attention"
        body={syncError}
        actionHref="/settings"
        actionLabel="Open settings"
      />
    );
  }

  if (!connection) {
    return (
      <StatusNotice
        tone="info"
        title="Connect your school account"
        body="Add your Campaign Monitor connection in Settings to load newsletters, lists, and templates."
        actionHref="/settings"
        actionLabel="Connect account"
      />
    );
  }

  return null;
}

function StatusNotice({
  tone,
  title,
  body,
  actionHref,
  actionLabel,
}: {
  tone: "info" | "warning";
  title: string;
  body: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <section
      className={cn(
        "flex flex-col gap-3 rounded-[22px] border px-5 py-4 sm:flex-row sm:items-center sm:justify-between",
        tone === "warning"
          ? "border-[#f3d9a2] bg-[#fffaf0]"
          : "border-[#d9e5f3] bg-[#f8fbff]"
      )}
    >
      <div>
        <p className="text-[15px] font-semibold tracking-[-0.02em] text-[#0f172a]">{title}</p>
        <p className="mt-1 text-[14px] leading-6 text-[#617284]">{body}</p>
      </div>
      <Button asChild variant="secondary">
        <a href={actionHref}>{actionLabel}</a>
      </Button>
    </section>
  );
}

function DashboardSection({
  title,
  count,
  actionHref,
  actionLabel,
  children,
}: {
  title: string;
  count: number;
  actionHref: string;
  actionLabel: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-[var(--app-surface-border)] bg-white px-6 py-5 sm:px-7">
      <div className="flex flex-col gap-2 border-b border-[var(--app-divider)] pb-4 sm:flex-row sm:items-baseline sm:justify-between">
        <div className="flex items-baseline gap-3">
          <h2 className="text-[1.45rem] font-semibold tracking-[-0.04em] text-[#0f172a]">
            {title}
          </h2>
          <span className="text-[14px] font-medium text-[#6b7b8d]">{count}</span>
        </div>
        <a
          href={actionHref}
          className="text-[14px] font-medium text-[#3568b8] transition hover:text-[#1d4ed8]"
        >
          {actionLabel}
        </a>
      </div>
      <div className="pt-2">{children}</div>
    </section>
  );
}

function CampaignRows({
  campaigns,
  emptyTitle,
  emptyBody,
  kind,
}: {
  campaigns: CommunityCampaignSummary[];
  emptyTitle: string;
  emptyBody: string;
  kind: "draft" | "scheduled" | "sent";
}) {
  const visibleCampaigns = campaigns.slice(0, 4);

  if (visibleCampaigns.length === 0) {
    return <EmptyState title={emptyTitle} body={emptyBody} />;
  }

  return (
    <div className="divide-y divide-[var(--app-divider)]">
      {visibleCampaigns.map((campaign) => (
        <div key={campaign.id} className="grid gap-3 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold tracking-[-0.02em] text-[#0f172a]">
              {campaign.subject}
            </p>
            <p className="mt-1 text-[13px] leading-6 text-[#617284]">
              {buildCampaignMeta(campaign, kind)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            {campaign.recipientCount !== null && kind === "sent" ? (
              <span className="text-[13px] font-medium text-[#526072]">
                {campaign.recipientCount.toLocaleString()} recipients
              </span>
            ) : null}
            {campaign.previewUrl ? (
              <Button asChild variant="secondary" size="sm">
                <a href={campaign.previewUrl} target="_blank" rel="noreferrer">
                  Preview
                </a>
              </Button>
            ) : campaign.webVersionUrl ? (
              <Button asChild variant="secondary" size="sm">
                <a href={campaign.webVersionUrl} target="_blank" rel="noreferrer">
                  Open
                </a>
              </Button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function ListRows({
  lists,
}: {
  lists: CommunityListSummary[];
}) {
  const visibleLists = lists.slice(0, 5);

  if (visibleLists.length === 0) {
    return (
      <EmptyState
        title="No lists yet"
        body="Once your school account is connected, mailing lists will appear here."
      />
    );
  }

  return (
    <div className="divide-y divide-[var(--app-divider)]">
      {visibleLists.map((list) => (
        <div key={list.listId} className="grid gap-2 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold tracking-[-0.02em] text-[#0f172a]">
              {list.name}
            </p>
            <p className="mt-1 text-[13px] leading-6 text-[#617284]">
              {buildListMeta(list)}
            </p>
          </div>
          <span className="text-[13px] font-medium text-[#526072]">
            Managed in Campaign Monitor
          </span>
        </div>
      ))}
    </div>
  );
}

function TemplateRows({
  templates,
}: {
  templates: CommunityTemplateSummary[];
}) {
  const visibleTemplates = templates.slice(0, 4);

  if (visibleTemplates.length === 0) {
    return (
      <EmptyState
        title="No templates yet"
        body="Templates will appear here once they are available in the connected account."
      />
    );
  }

  return (
    <div className="divide-y divide-[var(--app-divider)]">
      {visibleTemplates.map((template) => (
        <div key={template.templateId} className="grid gap-3 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold tracking-[-0.02em] text-[#0f172a]">
              {template.name}
            </p>
            <p className="mt-1 text-[13px] leading-6 text-[#617284]">
              Ready to use for future school newsletters.
            </p>
          </div>
          {template.previewUrl ? (
            <Button asChild variant="secondary" size="sm">
              <a href={template.previewUrl} target="_blank" rel="noreferrer">
                Preview
              </a>
            </Button>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function buildSummaryLine({
  draftCount,
  scheduledCount,
  sentCount,
  listCount,
}: {
  draftCount: number;
  scheduledCount: number;
  sentCount: number;
  listCount: number;
}) {
  const parts = [
    summarizeCount(draftCount, "draft"),
    summarizeCount(scheduledCount, "scheduled send"),
    summarizeCount(sentCount, "recent send"),
    summarizeCount(listCount, "list"),
  ];

  return parts.join(" • ");
}

function summarizeCount(count: number, singular: string) {
  const label = count === 1 ? singular : `${singular}s`;
  return `${count} ${label}`;
}

function buildCampaignMeta(
  campaign: CommunityCampaignSummary,
  kind: "draft" | "scheduled" | "sent"
) {
  if (kind === "draft") {
    return `Last updated ${formatCompactDateTime(campaign.createdDate)}`;
  }

  if (kind === "scheduled") {
    return `Scheduled for ${formatCompactDateTime(campaign.scheduledDate)}`;
  }

  return `Sent ${formatCompactDateTime(campaign.sentDate)}`;
}

function buildListMeta(list: CommunityListSummary) {
  const parts: string[] = [];

  if (typeof list.confirmedOptIn === "boolean") {
    parts.push(list.confirmedOptIn ? "Confirmed opt-in" : "Single opt-in");
  }

  if (list.unsubscribeSetting) {
    parts.push(`Unsubscribe: ${list.unsubscribeSetting}`);
  }

  return parts.join(" • ") || "Available for future sends";
}
