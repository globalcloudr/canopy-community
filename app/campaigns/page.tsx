"use client";

import { useState, useMemo } from "react";
import { Button, Input } from "@globalcloudr/canopy-ui";
import { cn } from "@globalcloudr/canopy-ui";
import { ProductShell } from "@/app/_components/product-shell";
import { useCommunityOverview, useCommunityWorkspaceId, useSentCampaigns } from "@/app/_components/community-data";
import { EmptyState, PageHeader, formatShortDate } from "@/app/_components/community-ui";
import { CampaignAnalyticsDrawer } from "@/app/_components/campaign-analytics-drawer";
import type { CommunityCampaignSummary, CommunityDraft } from "@/lib/community-schema";

type CampaignView = "overview" | "drafts" | "sent" | "scheduled";

export default function CampaignsPage() {
  return (
    <ProductShell activeNav="campaigns">
      <CampaignsContent />
    </ProductShell>
  );
}

function CampaignsContent() {
  const { workspaceId } = useCommunityWorkspaceId();
  const { overview, error, loading, refresh } = useCommunityOverview();
  const sentPaginated = useSentCampaigns();
  const [view, setView] = useState<CampaignView>("overview");
  const [search, setSearch] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState<CommunityCampaignSummary | null>(null);

  const drafts = overview?.draftCampaigns ?? [];
  const scheduled = overview?.scheduledCampaigns ?? [];
  // Overview tab uses the cached overview data (first 8); sent tab uses paginated data
  const overviewSent = overview?.sentCampaigns ?? [];

  const filteredDrafts = useFilteredCampaigns(drafts, search);
  const filteredSent = useFilteredCampaigns(overviewSent, search);
  const filteredScheduled = useFilteredCampaigns(scheduled, search);

  const viewItems: { key: CampaignView; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "drafts", label: "Drafts" },
    { key: "sent", label: "Sent" },
    { key: "scheduled", label: "Scheduled" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Campaigns"
        actions={
          <>
            <Button variant="secondary" onClick={() => void refresh()} disabled={loading}>
              {loading ? "Refreshing…" : "Refresh"}
            </Button>
            <Button asChild variant="accent">
              <a href="/compose">Create a campaign</a>
            </Button>
          </>
        }
      />

      {error ? <EmptyState title="We could not load your newsletters" body={error} /> : null}

      <div className="flex flex-col gap-6 md:flex-row">
        {/* Sidebar filter panel */}
        <aside className="shrink-0 md:w-44">
          <p className="mb-2 text-[13px] font-semibold text-[var(--ink-2)]">View by</p>
          <nav className="flex flex-row gap-1 md:flex-col">
            {viewItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setView(item.key)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-left text-[14px] font-medium transition",
                  view === item.key
                    ? "text-[var(--accent)]"
                    : "text-[var(--text-muted)] hover:text-[var(--ink-2)]"
                )}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <div className="min-w-0 flex-1">
          {/* Search bar */}
          <div className="mb-6 flex items-center gap-3">
            <Input
              placeholder="Search campaign name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
          </div>

          {/* Campaign sections based on view */}
          {(view === "overview" || view === "drafts") && filteredDrafts.length > 0 ? (
            <CampaignSection title="Recent drafts" columnLabel="Edited" withAction>
              {filteredDrafts.map((c) => (
                <DraftRow key={c.id} campaign={c} />
              ))}
            </CampaignSection>
          ) : null}

          {view === "drafts" && filteredDrafts.length === 0 ? (
            <EmptyState title="No drafts" body="Saved drafts will appear here." />
          ) : null}

          {(view === "overview" || view === "scheduled") && filteredScheduled.length > 0 ? (
            <CampaignSection title="Scheduled" columnLabel="Scheduled for">
              {filteredScheduled.map((c) => (
                <ScheduledRow key={c.id} campaign={c} />
              ))}
            </CampaignSection>
          ) : null}

          {view === "scheduled" && filteredScheduled.length === 0 ? (
            <EmptyState title="Nothing scheduled" body="Scheduled newsletters will appear here." />
          ) : null}

          {view === "overview" ? (
            <SentSection campaigns={filteredSent} onSelect={setSelectedCampaign} />
          ) : null}

          {view === "sent" ? (
            <SentSectionPaginated
              campaigns={sentPaginated.campaigns}
              total={sentPaginated.total}
              page={sentPaginated.page}
              pageSize={sentPaginated.pageSize}
              loading={sentPaginated.loading}
              onPageChange={sentPaginated.setPage}
              onSelect={setSelectedCampaign}
            />
          ) : null}
        </div>
      </div>

      <CampaignAnalyticsDrawer
        campaign={selectedCampaign}
        workspaceId={workspaceId}
        onClose={() => setSelectedCampaign(null)}
      />
    </div>
  );
}

function useFilteredCampaigns<T extends { name: string; subject?: string }>(campaigns: T[], search: string): T[] {
  return useMemo(() => {
    if (!search.trim()) return campaigns;
    const q = search.toLowerCase();
    return campaigns.filter(
      (c) =>
        (c.subject?.toLowerCase().includes(q) ?? false) ||
        c.name.toLowerCase().includes(q)
    );
  }, [campaigns, search]);
}

function CampaignSection({
  title,
  columnLabel,
  withAction,
  children,
}: {
  title: string;
  columnLabel: string;
  withAction?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      <h3 className="mb-1 text-[1rem] font-semibold tracking-[-0.01em] text-[var(--ink)]">
        {title}
      </h3>
      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--app-divider)] text-left text-[13px] font-medium text-[var(--text-muted)]">
            <th className="py-2.5 font-medium">Campaign</th>
            <th className="py-2.5 text-right font-medium">{columnLabel}</th>
            {withAction ? <th className="py-2.5 pl-4" /> : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--app-divider)]">{children}</tbody>
      </table>
    </div>
  );
}

function DraftRow({ campaign }: { campaign: CommunityDraft }) {
  return (
    <tr className="group hover:bg-[var(--surface-muted)]">
      <td className="py-3 pr-4">
        <span className="text-[14px] font-medium text-[var(--ink)]">
          {campaign.name || "Untitled draft"}
        </span>
      </td>
      <td className="py-3 text-right text-[14px] text-[var(--text-muted)]">
        {formatShortDate(campaign.updatedAt)}
      </td>
      <td className="py-3 pl-4 text-right">
        <a
          href={`/compose?draft=${campaign.id}`}
          className="text-[13px] font-medium text-[var(--accent)] hover:underline"
        >
          Continue
        </a>
      </td>
    </tr>
  );
}

function ScheduledRow({ campaign }: { campaign: CommunityCampaignSummary }) {
  const href = campaign.previewUrl ?? "https://app.createsend.com";
  return (
    <tr className="group hover:bg-[var(--surface-muted)]">
      <td className="py-3 pr-4">
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="text-[14px] font-medium text-[var(--ink)] hover:text-[var(--accent)] hover:underline"
        >
          {campaign.name}
        </a>
      </td>
      <td className="py-3 text-right text-[14px] text-[var(--text-muted)]">
        {formatShortDate(campaign.scheduledDate)}
      </td>
    </tr>
  );
}

function SentTableHeaders() {
  return (
    <tr className="border-b border-[var(--app-divider)] text-left text-[13px] font-medium text-[var(--text-muted)]">
      <th className="py-2.5 font-medium">Campaign</th>
      <th className="hidden py-2.5 text-right font-medium md:table-cell">Recipients</th>
      <th className="hidden py-2.5 text-right font-medium md:table-cell">Opened</th>
      <th className="hidden py-2.5 text-right font-medium md:table-cell">Clicked</th>
      <th className="py-2.5 text-right font-medium">Sent</th>
    </tr>
  );
}

function SentRow({ c, onSelect }: { c: CommunityCampaignSummary; onSelect: (c: CommunityCampaignSummary) => void }) {
  return (
    <tr
      className="group cursor-pointer hover:bg-[var(--surface-muted)]"
      onClick={() => onSelect(c)}
    >
      <td className="py-3 pr-4">
        <span className="text-[14px] font-medium text-[var(--ink)] group-hover:text-[var(--accent)]">
          {c.name}
        </span>
      </td>
      <td className="hidden py-3 pr-4 text-right text-[14px] text-[var(--ink-2)] md:table-cell">
        {c.recipientCount?.toLocaleString() ?? "—"}
      </td>
      <td className="hidden py-3 pr-4 text-right text-[14px] text-[var(--ink-2)] md:table-cell">
        {c.openRate != null ? `${c.openRate}%` : "—"}
      </td>
      <td className="hidden py-3 pr-4 text-right text-[14px] text-[var(--ink-2)] md:table-cell">
        {c.clickRate != null ? `${c.clickRate}%` : "—"}
      </td>
      <td className="py-3 text-right text-[14px] text-[var(--text-muted)]">
        {formatShortDate(c.sentDate)}
      </td>
    </tr>
  );
}

function SentSection({
  campaigns,
  onSelect,
}: {
  campaigns: CommunityCampaignSummary[];
  onSelect: (c: CommunityCampaignSummary) => void;
}) {
  if (campaigns.length === 0) {
    return (
      <div className="mb-8">
        <h3 className="mb-3 text-[1rem] font-semibold tracking-[-0.01em] text-[var(--ink)]">
          Recently sent
        </h3>
        <EmptyState title="No sent newsletters yet" body="Sent newsletters will appear here once your account is connected." />
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h3 className="mb-1 text-[1rem] font-semibold tracking-[-0.01em] text-[var(--ink)]">
        Recently sent
      </h3>
      <table className="w-full">
        <thead><SentTableHeaders /></thead>
        <tbody className="divide-y divide-[var(--app-divider)]">
          {campaigns.map((c) => <SentRow key={c.id} c={c} onSelect={onSelect} />)}
        </tbody>
      </table>
    </div>
  );
}

function SentSectionPaginated({
  campaigns,
  total,
  page,
  pageSize,
  loading,
  onPageChange,
  onSelect,
}: {
  campaigns: CommunityCampaignSummary[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  onPageChange: (page: number) => void;
  onSelect: (c: CommunityCampaignSummary) => void;
}) {
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="mb-8">
      <div className="mb-1 flex items-baseline justify-between">
        <h3 className="text-[1rem] font-semibold tracking-[-0.01em] text-[var(--ink)]">
          Sent campaigns
        </h3>
        {total > 0 && (
          <span className="text-[13px] text-[var(--text-muted)]">
            {total.toLocaleString()} total
          </span>
        )}
      </div>

      {loading && campaigns.length === 0 ? (
        <p className="py-6 text-center text-[14px] text-[var(--text-muted)]">Loading…</p>
      ) : campaigns.length === 0 ? (
        <EmptyState title="No sent newsletters yet" body="Sent newsletters will appear here once your account is connected." />
      ) : (
        <>
          <table className="w-full">
            <thead><SentTableHeaders /></thead>
            <tbody className={cn("divide-y divide-[var(--app-divider)]", loading ? "opacity-50" : "")}>
              {campaigns.map((c) => <SentRow key={c.id} c={c} onSelect={onSelect} />)}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <Button
                variant="secondary"
                disabled={page <= 1 || loading}
                onClick={() => onPageChange(page - 1)}
              >
                Previous
              </Button>
              <span className="text-[14px] text-[var(--text-muted)]">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="secondary"
                disabled={page >= totalPages || loading}
                onClick={() => onPageChange(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

