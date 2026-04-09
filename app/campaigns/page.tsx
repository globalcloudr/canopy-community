"use client";

import { useState, useMemo } from "react";
import { Button, Input } from "@canopy/ui";
import { cn } from "@canopy/ui";
import { ProductShell } from "@/app/_components/product-shell";
import { communityNavItems } from "@/app/_components/community-nav";
import { useCommunityOverview } from "@/app/_components/community-data";
import { EmptyState, PageHeader, formatShortDate } from "@/app/_components/community-ui";
import type { CommunityCampaignSummary } from "@/lib/community-schema";

type CampaignView = "overview" | "drafts" | "sent" | "scheduled";

export default function CampaignsPage() {
  return (
    <ProductShell activeNav="campaigns" navItems={communityNavItems}>
      <CampaignsContent />
    </ProductShell>
  );
}

function CampaignsContent() {
  const { overview, error, loading, refresh } = useCommunityOverview();
  const [view, setView] = useState<CampaignView>("overview");
  const [search, setSearch] = useState("");

  const drafts = overview?.draftCampaigns ?? [];
  const sent = overview?.sentCampaigns ?? [];
  const scheduled = overview?.scheduledCampaigns ?? [];

  const filteredDrafts = useFilteredCampaigns(drafts, search);
  const filteredSent = useFilteredCampaigns(sent, search);
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
          <Button variant="secondary" onClick={() => void refresh()} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </Button>
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
            <CampaignSection title="Recent drafts" columnLabel="Edited">
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
                <DraftRow key={c.id} campaign={c} />
              ))}
            </CampaignSection>
          ) : null}

          {view === "scheduled" && filteredScheduled.length === 0 ? (
            <EmptyState title="Nothing scheduled" body="Scheduled newsletters will appear here." />
          ) : null}

          {(view === "overview" || view === "sent") ? (
            <SentSection campaigns={filteredSent} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function useFilteredCampaigns(campaigns: CommunityCampaignSummary[], search: string) {
  return useMemo(() => {
    if (!search.trim()) return campaigns;
    const q = search.toLowerCase();
    return campaigns.filter(
      (c) =>
        c.subject.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q)
    );
  }, [campaigns, search]);
}

function CampaignSection({
  title,
  columnLabel,
  children,
}: {
  title: string;
  columnLabel: string;
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
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--app-divider)]">{children}</tbody>
      </table>
    </div>
  );
}

function DraftRow({ campaign }: { campaign: CommunityCampaignSummary }) {
  const dateValue =
    campaign.status === "scheduled"
      ? campaign.scheduledDate
      : campaign.createdDate;

  return (
    <tr>
      <td className="py-3 pr-4 text-[14px] font-medium text-[#0f172a]">
        {campaign.subject}
      </td>
      <td className="py-3 text-right text-[14px] text-[#64748b]">
        {formatShortDate(dateValue)}
      </td>
    </tr>
  );
}

function SentSection({
  campaigns,
}: {
  campaigns: CommunityCampaignSummary[];
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
        <thead>
          <tr className="border-b border-[var(--app-divider)] text-left text-[13px] font-medium text-[#64748b]">
            <th className="py-2.5 font-medium">Campaign</th>
            <th className="hidden py-2.5 text-right font-medium md:table-cell">Recipients</th>
            <th className="hidden py-2.5 text-right font-medium md:table-cell">Opened</th>
            <th className="hidden py-2.5 text-right font-medium md:table-cell">Clicked</th>
            <th className="py-2.5 text-right font-medium">Sent</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--app-divider)]">
          {campaigns.map((c) => (
            <tr key={c.id}>
              <td className="py-3 pr-4 text-[14px] font-medium text-[#0f172a]">
                {c.subject}
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
          ))}
        </tbody>
      </table>
    </div>
  );
}
