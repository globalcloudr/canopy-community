"use client";

import { useState } from "react";
import { Button, cn } from "@globalcloudr/canopy-ui";
import { ProductShell } from "@/app/_components/product-shell";
import { communityNavItems } from "@/app/_components/community-nav";
import { useCommunityOverview, useCommunityWorkspaceId } from "@/app/_components/community-data";
import { EmptyState, formatShortDate, formatCompactDateTime } from "@/app/_components/community-ui";
import { useProductShell } from "@/app/_components/product-shell";
import { CampaignAnalyticsDrawer } from "@/app/_components/campaign-analytics-drawer";
import type {
  CommunityCampaignSummary,
  CommunityConnection,
  CommunityDraft,
  CommunityListSummary,
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
  const { workspaceId } = useCommunityWorkspaceId();
  const { activeWorkspace } = useProductShell();
  const [selectedCampaign, setSelectedCampaign] = useState<CommunityCampaignSummary | null>(null);

  const draftCount = overview?.stats.draftCampaignCount ?? 0;
  const scheduledCount = overview?.stats.scheduledCampaignCount ?? 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[1.85rem] font-semibold tracking-[-0.03em] text-[#0f172a] sm:text-[2.1rem]">
            Welcome back
          </h1>
          {(draftCount > 0 || scheduledCount > 0) ? (
            <p className="mt-1.5 text-[15px] text-[#64748b]">
              {draftCount > 0 ? `You have ${draftCount} draft campaign${draftCount === 1 ? "" : "s"} in progress.` : null}
              {scheduledCount > 0 ? ` ${scheduledCount} scheduled.` : null}
            </p>
          ) : null}
        </div>
        <Button asChild variant="primary">
          <a href="/compose">Create campaign</a>
        </Button>
      </div>

      <DashboardNotice
        connection={overview?.connection ?? null}
        syncError={overview?.syncError ?? null}
      />

      {error ? <EmptyState title="We could not load your newsletter data" body={error} /> : null}

      {/* Drafts */}
      <DashboardSection
        title="Drafts"
        actionHref="/campaigns"
        actionLabel="See all draft campaigns"
      >
        <DraftRows campaigns={overview?.draftCampaigns ?? []} />
      </DashboardSection>

      {/* Sent */}
      <DashboardSection
        title="Sent"
        actionHref="/campaigns"
        actionLabel="See all sent campaigns"
      >
        <SentRows campaigns={overview?.sentCampaigns ?? []} onSelect={setSelectedCampaign} />
      </DashboardSection>

      {/* Lists */}
      <DashboardSection
        title="Lists"
        actionHref="/audiences"
        actionLabel="See all subscriber lists"
      >
        <ListRows lists={overview?.lists ?? []} />
      </DashboardSection>

      <CampaignAnalyticsDrawer
        campaign={selectedCampaign}
        workspaceId={workspaceId}
        onClose={() => setSelectedCampaign(null)}
      />
    </div>
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
        body="Add your Campaign Monitor connection in Settings to create your first campaign."
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
        "flex flex-col gap-3 rounded-lg border px-5 py-4 sm:flex-row sm:items-center sm:justify-between",
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
  actionHref,
  actionLabel,
  children,
}: {
  title: string;
  actionHref: string;
  actionLabel: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-baseline justify-between border-b border-[var(--app-divider)] pb-3">
        <h2 className="text-[1.15rem] font-semibold tracking-[-0.02em] text-[#0f172a]">
          {title}
        </h2>
        <a
          href={actionHref}
          className="text-[14px] font-medium text-[#3568b8] transition hover:text-[#1d4ed8]"
        >
          {actionLabel}
        </a>
      </div>
      <div>{children}</div>
    </section>
  );
}

/* ── Draft campaigns ────────────────────────────────────────────────────── */

function DraftRows({
  campaigns,
}: {
  campaigns: CommunityDraft[];
}) {
  const visible = campaigns.slice(0, 3);

  if (visible.length === 0) {
    return (
      <div className="pt-4">
        <EmptyState title="No drafts right now" body="Draft newsletters will show up here as soon as they are saved." />
      </div>
    );
  }

  return (
    <div className="divide-y divide-[var(--app-divider)]">
      {visible.map((campaign) => (
        <div key={campaign.id} className="flex items-center gap-4 py-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded border border-[#e2e8f0] bg-[#f8fafc]">
            <svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" className="h-4 w-4" aria-hidden="true">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m6 9 6 4 6-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-medium text-[#0f172a]">
              {campaign.name || "Untitled draft"}
            </p>
            <p className="mt-0.5 text-[13px] text-[#64748b]">
              Last edited {formatShortDate(campaign.updatedAt)}
            </p>
          </div>
          <a
            href={`/compose?draft=${campaign.id}`}
            className="shrink-0 text-[13px] font-medium text-[#2563eb] hover:underline"
          >
            Continue
          </a>
        </div>
      ))}
    </div>
  );
}

/* ── Sent campaigns ─────────────────────────────────────────────────────── */

function SentRows({
  campaigns,
  onSelect,
}: {
  campaigns: CommunityCampaignSummary[];
  onSelect: (c: CommunityCampaignSummary) => void;
}) {
  const visible = campaigns.slice(0, 3);

  if (visible.length === 0) {
    return (
      <div className="pt-4">
        <EmptyState title="No sent newsletters yet" body="Sent newsletters will appear here once your school account is connected." />
      </div>
    );
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-[var(--app-divider)]">
          <th className="pb-2 text-left text-[12px] font-medium text-[#94a3b8]">Campaign</th>
          <th className="hidden pb-2 text-right text-[12px] font-medium text-[#94a3b8] md:table-cell">Recipients</th>
          <th className="hidden pb-2 text-right text-[12px] font-medium text-[#94a3b8] md:table-cell">Opened</th>
          <th className="hidden pb-2 text-right text-[12px] font-medium text-[#94a3b8] md:table-cell">Clicked</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[var(--app-divider)]">
        {visible.map((campaign) => (
          <tr
            key={campaign.id}
            className="group cursor-pointer hover:bg-[#f8fafc]"
            onClick={() => onSelect(campaign)}
          >
            <td className="py-3 pr-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-[#e2e8f0] bg-[#f8fafc]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" className="h-4 w-4" aria-hidden="true">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="m6 9 6 4 6-4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium text-[#0f172a] group-hover:text-[#2563eb]">
                    {campaign.name || campaign.subject}
                  </p>
                  <p className="mt-0.5 text-[13px] text-[#64748b]">
                    Sent {formatShortDate(campaign.sentDate)}
                  </p>
                </div>
              </div>
            </td>
            <td className="hidden py-3 pr-6 text-right text-[14px] text-[#334155] md:table-cell">
              {campaign.recipientCount?.toLocaleString() ?? "—"}
            </td>
            <td className="hidden py-3 pr-6 text-right text-[14px] text-[#334155] md:table-cell">
              {campaign.openRate != null ? `${campaign.openRate}%` : "—"}
            </td>
            <td className="hidden py-3 text-right text-[14px] text-[#334155] md:table-cell">
              {campaign.clickRate != null ? `${campaign.clickRate}%` : "—"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ── Lists ──────────────────────────────────────────────────────────────── */

function ListRows({
  lists,
}: {
  lists: CommunityListSummary[];
}) {
  const visible = lists.slice(0, 5);

  if (visible.length === 0) {
    return (
      <div className="pt-4">
        <EmptyState
          title="No lists yet"
          body="Once your school account is connected, mailing lists will appear here."
        />
      </div>
    );
  }

  return (
    <div className="divide-y divide-[var(--app-divider)]">
      {visible.map((list) => (
        <a
          key={list.listId}
          href="/audiences"
          className="flex items-center justify-between py-4 hover:bg-[#f8fafc] -mx-4 px-4 transition-colors"
        >
          <p className="truncate text-[14px] font-medium text-[#0f172a]">
            {list.name}
          </p>
          {list.subscriberCount != null ? (
            <div className="ml-4 shrink-0 text-right">
              <p className="text-[14px] font-medium text-[#0f172a]">
                {list.subscriberCount.toLocaleString()}
              </p>
              <p className="text-[12px] text-[#64748b]">Subscribers</p>
            </div>
          ) : null}
        </a>
      ))}
    </div>
  );
}

