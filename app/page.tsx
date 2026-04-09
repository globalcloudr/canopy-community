"use client";

import { Button, cn } from "@canopy/ui";
import { ProductShell } from "@/app/_components/product-shell";
import { communityNavItems } from "@/app/_components/community-nav";
import { useCommunityOverview } from "@/app/_components/community-data";
import { EmptyState, formatShortDate, formatCompactDateTime } from "@/app/_components/community-ui";
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
        <Button onClick={() => void refresh()} variant="primary" disabled={loading}>
          {loading ? "Refreshing…" : "Create"}
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
        <SentRows campaigns={overview?.sentCampaigns ?? []} />
      </DashboardSection>

      {/* Lists */}
      <DashboardSection
        title="Lists"
        actionHref="/audiences"
        actionLabel="See all subscriber lists"
      >
        <ListRows lists={overview?.lists ?? []} />
      </DashboardSection>

      {/* Templates */}
      <DashboardSection
        title="Templates"
        actionHref="/templates"
        actionLabel="See all templates"
      >
        <TemplateRows templates={overview?.templates ?? []} />
      </DashboardSection>
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

/* ── Draft campaigns — card style with thumbnail placeholder ───────────── */

function DraftRows({
  campaigns,
}: {
  campaigns: CommunityCampaignSummary[];
}) {
  const visible = campaigns.slice(0, 4);

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
        <div key={campaign.id} className="flex items-center gap-4 py-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[#e2e8f0] bg-[#f1f5f9]">
            <svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" className="h-5 w-5" aria-hidden="true">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m6 9 6 4 6-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-medium text-[#0f172a]">
              {campaign.subject}
            </p>
            <p className="mt-0.5 text-[13px] text-[#64748b]">
              Last edited {formatShortDate(campaign.createdDate)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Sent campaigns — table with Recipients / Opened / Clicked ─────────── */

function SentRows({
  campaigns,
}: {
  campaigns: CommunityCampaignSummary[];
}) {
  const visible = campaigns.slice(0, 5);

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
        <tr className="border-b border-[var(--app-divider)] text-left text-[13px] font-medium text-[#64748b]">
          <th className="py-3 pr-4 font-medium">Campaign</th>
          <th className="hidden py-3 pr-4 text-right font-medium md:table-cell">Recipients</th>
          <th className="hidden py-3 pr-4 text-right font-medium md:table-cell">Opened</th>
          <th className="hidden py-3 pr-4 text-right font-medium md:table-cell">Clicked</th>
          <th className="py-3 text-right font-medium">Sent</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[var(--app-divider)]">
        {visible.map((campaign) => (
          <tr key={campaign.id} className="group">
            <td className="py-3.5 pr-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#e2e8f0] bg-[#f1f5f9]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" className="h-4 w-4" aria-hidden="true">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="m6 9 6 4 6-4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium text-[#0f172a]">
                    {campaign.subject}
                  </p>
                  <p className="mt-0.5 text-[13px] text-[#64748b] md:hidden">
                    {campaign.recipientCount?.toLocaleString() ?? "—"} recipients &middot; {formatShortDate(campaign.sentDate)}
                  </p>
                </div>
              </div>
            </td>
            <td className="hidden py-3.5 pr-4 text-right text-[14px] text-[#334155] md:table-cell">
              {campaign.recipientCount?.toLocaleString() ?? "—"}
            </td>
            <td className="hidden py-3.5 pr-4 text-right text-[14px] text-[#334155] md:table-cell">
              {campaign.openRate != null ? `${campaign.openRate}%` : "—"}
            </td>
            <td className="hidden py-3.5 pr-4 text-right text-[14px] text-[#334155] md:table-cell">
              {campaign.clickRate != null ? `${campaign.clickRate}%` : "—"}
            </td>
            <td className="py-3.5 text-right text-[14px] text-[#64748b]">
              {formatShortDate(campaign.sentDate)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ── Lists — name + subscriber count ───────────────────────────────────── */

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
        <div key={list.listId} className="flex items-center justify-between py-3.5">
          <div className="min-w-0">
            <p className="truncate text-[14px] font-medium text-[#0f172a]">
              {list.name}
            </p>
          </div>
          <span className="ml-4 shrink-0 text-[14px] text-[#64748b]">
            {list.subscriberCount != null
              ? `${list.subscriberCount.toLocaleString()} Subscribers`
              : "Managed in Campaign Monitor"}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Templates — simple list ───────────────────────────────────────────── */

function TemplateRows({
  templates,
}: {
  templates: CommunityTemplateSummary[];
}) {
  const visible = templates.slice(0, 4);

  if (visible.length === 0) {
    return (
      <div className="pt-4">
        <EmptyState
          title="No templates yet"
          body="Templates will appear here once they are available in the connected account."
        />
      </div>
    );
  }

  return (
    <div className="divide-y divide-[var(--app-divider)]">
      {visible.map((template) => (
        <div key={template.templateId} className="flex items-center gap-4 py-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#e2e8f0] bg-white">
            {template.screenshotUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={template.screenshotUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-[9px] uppercase tracking-[0.12em] text-[#94a3b8]">Tmpl</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-medium text-[#0f172a]">
              {template.name}
            </p>
          </div>
          {template.previewUrl ? (
            <Button asChild variant="ghost" size="sm">
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
