"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { Button, Dialog, DialogContent, DialogTitle, Input } from "@canopy/ui";
import { cn } from "@canopy/ui";
import { ProductShell } from "@/app/_components/product-shell";
import { communityNavItems } from "@/app/_components/community-nav";
import { useCommunityOverview, useCommunityWorkspaceId, useSentCampaigns } from "@/app/_components/community-data";
import { EmptyState, PageHeader, formatShortDate } from "@/app/_components/community-ui";
import { supabase } from "@/lib/supabase-client";
import type { CampaignAnalytics, CommunityCampaignSummary, CommunityDraft } from "@/lib/community-schema";

type CampaignView = "overview" | "drafts" | "sent" | "scheduled";

export default function CampaignsPage() {
  return (
    <ProductShell activeNav="campaigns" navItems={communityNavItems}>
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
            <Button asChild variant="primary">
              <a href="/compose">Create a campaign</a>
            </Button>
          </>
        }
      />

      {error ? <EmptyState title="We could not load your newsletters" body={error} /> : null}

      <div className="flex flex-col gap-6 md:flex-row">
        {/* Sidebar filter panel */}
        <aside className="shrink-0 md:w-44">
          <p className="mb-2 text-[13px] font-semibold text-[#334155]">View by</p>
          <nav className="flex flex-row gap-1 md:flex-col">
            {viewItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setView(item.key)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-left text-[14px] font-medium transition",
                  view === item.key
                    ? "text-[#2563eb]"
                    : "text-[#64748b] hover:text-[#334155]"
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
      <h3 className="mb-1 text-[1rem] font-semibold tracking-[-0.01em] text-[#0f172a]">
        {title}
      </h3>
      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--app-divider)] text-left text-[13px] font-medium text-[#64748b]">
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
    <tr className="group hover:bg-[#f8fafc]">
      <td className="py-3 pr-4">
        <span className="text-[14px] font-medium text-[#0f172a]">
          {campaign.name || "Untitled draft"}
        </span>
      </td>
      <td className="py-3 text-right text-[14px] text-[#64748b]">
        {formatShortDate(campaign.updatedAt)}
      </td>
      <td className="py-3 pl-4 text-right">
        <a
          href={`/compose?draft=${campaign.id}`}
          className="text-[13px] font-medium text-[#2563eb] hover:underline"
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
    <tr className="group hover:bg-[#f8fafc]">
      <td className="py-3 pr-4">
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="text-[14px] font-medium text-[#0f172a] hover:text-[#2563eb] hover:underline"
        >
          {campaign.name}
        </a>
      </td>
      <td className="py-3 text-right text-[14px] text-[#64748b]">
        {formatShortDate(campaign.scheduledDate)}
      </td>
    </tr>
  );
}

function SentTableHeaders() {
  return (
    <tr className="border-b border-[var(--app-divider)] text-left text-[13px] font-medium text-[#64748b]">
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
      className="group cursor-pointer hover:bg-[#f8fafc]"
      onClick={() => onSelect(c)}
    >
      <td className="py-3 pr-4">
        <span className="text-[14px] font-medium text-[#0f172a] group-hover:text-[#2563eb]">
          {c.name}
        </span>
      </td>
      <td className="hidden py-3 pr-4 text-right text-[14px] text-[#334155] md:table-cell">
        {c.recipientCount?.toLocaleString() ?? "—"}
      </td>
      <td className="hidden py-3 pr-4 text-right text-[14px] text-[#334155] md:table-cell">
        {c.openRate != null ? `${c.openRate}%` : "—"}
      </td>
      <td className="hidden py-3 pr-4 text-right text-[14px] text-[#334155] md:table-cell">
        {c.clickRate != null ? `${c.clickRate}%` : "—"}
      </td>
      <td className="py-3 text-right text-[14px] text-[#64748b]">
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
        <h3 className="mb-3 text-[1rem] font-semibold tracking-[-0.01em] text-[#0f172a]">
          Recently sent
        </h3>
        <EmptyState title="No sent newsletters yet" body="Sent newsletters will appear here once your account is connected." />
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h3 className="mb-1 text-[1rem] font-semibold tracking-[-0.01em] text-[#0f172a]">
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
        <h3 className="text-[1rem] font-semibold tracking-[-0.01em] text-[#0f172a]">
          Sent campaigns
        </h3>
        {total > 0 && (
          <span className="text-[13px] text-[#64748b]">
            {total.toLocaleString()} total
          </span>
        )}
      </div>

      {loading && campaigns.length === 0 ? (
        <p className="py-6 text-center text-[14px] text-[#64748b]">Loading…</p>
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
              <span className="text-[14px] text-[#64748b]">
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

// ─── Campaign Analytics Drawer ────────────────────────────────────────────────

function CampaignAnalyticsDrawer({
  campaign,
  workspaceId,
  onClose,
}: {
  campaign: CommunityCampaignSummary | null;
  workspaceId: string | null;
  onClose: () => void;
}) {
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (id: string, wsId: string) => {
    setAnalytics(null);
    setError(null);
    setLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Session expired.");
      const res = await fetch(`/api/community/campaigns/${encodeURIComponent(id)}/analytics?workspaceId=${wsId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = (await res.json()) as { analytics?: CampaignAnalytics; error?: string };
      if (!res.ok) throw new Error(payload.error ?? "Failed to load analytics.");
      setAnalytics(payload.analytics ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (campaign && workspaceId) void load(campaign.id, workspaceId);
  }, [campaign, workspaceId, load]);

  return (
    <Dialog open={!!campaign} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="left-auto right-0 top-0 h-screen max-h-screen w-full translate-x-0 translate-y-0 overflow-hidden rounded-none border-l border-[#e2e8f0] p-0 shadow-xl sm:max-w-xl">
        <aside className="flex h-full flex-col bg-white">
          {/* Header */}
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#e2e8f0] px-6 py-5">
            <div className="min-w-0">
              <DialogTitle className="truncate text-[16px] font-semibold text-[#0f172a]">
                {campaign?.name ?? "Campaign"}
              </DialogTitle>
              {campaign?.sentDate ? (
                <p className="mt-0.5 text-[13px] text-[#64748b]">
                  Sent {formatShortDate(campaign.sentDate)}
                  {campaign.recipientCount != null ? ` · ${campaign.recipientCount.toLocaleString()} recipients` : ""}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-0.5 shrink-0 rounded-md p-1 text-[#94a3b8] transition hover:text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
              aria-label="Close"
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5" aria-hidden="true">
                <path d="m4 4 8 8M12 4l-8 8" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {loading ? (
              <div className="flex h-40 items-center justify-center">
                <p className="text-[14px] text-[#64748b]">Loading analytics…</p>
              </div>
            ) : error ? (
              <p className="rounded-lg border border-[#fca5a5] bg-[#fef2f2] px-4 py-3 text-[14px] text-[#b91c1c]">{error}</p>
            ) : analytics ? (
              <div className="flex flex-col gap-8">
                <AnalyticsSection title="Engagement">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <StatCard label="Open rate" value={analytics.openRate != null ? `${analytics.openRate}%` : "—"} />
                    <StatCard label="Click rate" value={analytics.clickRate != null ? `${analytics.clickRate}%` : "—"} />
                    <StatCard label="Clicks to opens" value={analytics.clicksToOpenRate != null ? `${analytics.clicksToOpenRate}%` : "—"} />
                    <StatCard label="Unique opens" value={analytics.uniqueOpened?.toLocaleString() ?? "—"} />
                    <StatCard label="Unique clicks" value={analytics.uniqueClicks?.toLocaleString() ?? "—"} />
                    <StatCard label="Recipients" value={analytics.recipients?.toLocaleString() ?? "—"} />
                  </div>
                </AnalyticsSection>

                <AnalyticsSection title="Delivery">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <StatCard label="Bounced" value={analytics.bounced?.toLocaleString() ?? "—"} />
                    <StatCard label="Unsubscribed" value={analytics.unsubscribed?.toLocaleString() ?? "—"} />
                    <StatCard label="Spam complaints" value={analytics.spamComplaints?.toLocaleString() ?? "—"} />
                  </div>
                </AnalyticsSection>

                <AnalyticsSection title="Reactions">
                  <div className="grid grid-cols-3 gap-3">
                    <StatCard label="Forwards" value={analytics.forwards?.toLocaleString() ?? "—"} />
                    <StatCard label="Likes" value={analytics.likes?.toLocaleString() ?? "—"} />
                    <StatCard label="Mentions" value={analytics.mentions?.toLocaleString() ?? "—"} />
                  </div>
                </AnalyticsSection>

                {analytics.topLinks.length > 0 ? (
                  <AnalyticsSection title="Top links">
                    <div className="overflow-hidden rounded-lg border border-[#e2e8f0]">
                      <table className="w-full text-[13px]">
                        <thead>
                          <tr className="border-b border-[#e2e8f0] bg-[#f8fafc] text-left text-[#64748b]">
                            <th className="px-3 py-2 font-medium">URL</th>
                            <th className="px-3 py-2 text-right font-medium">Clicks</th>
                            <th className="px-3 py-2 text-right font-medium">Unique</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e2e8f0]">
                          {analytics.topLinks.map((link, i) => (
                            <tr key={i} className="hover:bg-[#f8fafc]">
                              <td className="max-w-[220px] truncate px-3 py-2">
                                <a
                                  href={link.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[#2563eb] hover:underline"
                                  title={link.url}
                                >
                                  {truncateUrl(link.url)}
                                </a>
                              </td>
                              <td className="px-3 py-2 text-right text-[#334155]">{link.totalClicks}</td>
                              <td className="px-3 py-2 text-right text-[#334155]">{link.uniqueClicks}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </AnalyticsSection>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* Footer */}
          {campaign?.webVersionUrl ? (
            <div className="shrink-0 border-t border-[#e2e8f0] px-6 py-4">
              <a
                href={campaign.webVersionUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[13px] font-medium text-[#2563eb] hover:underline"
              >
                View full report in Campaign Monitor →
              </a>
            </div>
          ) : null}
        </aside>
      </DialogContent>
    </Dialog>
  );
}

function AnalyticsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-[#64748b]">{title}</h4>
      {children}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3">
      <p className="text-[12px] text-[#64748b]">{label}</p>
      <p className="mt-1 text-[20px] font-semibold tracking-tight text-[#0f172a]">{value}</p>
    </div>
  );
}

function truncateUrl(url: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname + u.search;
    return u.hostname + (path.length > 30 ? path.slice(0, 30) + "…" : path);
  } catch {
    return url.length > 50 ? url.slice(0, 50) + "…" : url;
  }
}
