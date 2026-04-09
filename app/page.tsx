"use client";

import { Button } from "@canopy/ui";
import { ProductShell } from "@/app/_components/product-shell";
import { communityNavItems } from "@/app/_components/community-nav";
import { useCommunityOverview } from "@/app/_components/community-data";
import {
  ConnectionSection,
  CampaignTable,
  AudienceListSection,
  TemplateListSection,
} from "@/app/_components/community-sections";
import { EmptyState, PageIntro, StatCard } from "@/app/_components/community-ui";
import { useProductShell } from "@/app/_components/product-shell";

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

  const stats = overview?.stats ?? {
    listCount: 0,
    templateCount: 0,
    sentCampaignCount: 0,
    draftCampaignCount: 0,
    scheduledCampaignCount: 0,
  };

  return (
    <>
      <PageIntro
        eyebrow="Canopy Community"
        title="School newsletters in one place"
        description={`See recent sends, mailing lists, and templates for ${schoolName} without leaving Canopy.`}
        actions={
          <>
            <Button variant="secondary" onClick={() => void refresh()} disabled={loading}>
              {loading ? "Refreshing…" : "Refresh"}
            </Button>
            <Button asChild>
              <a href="/settings">Manage connection</a>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-12">
        <StatCard
          className="xl:col-span-4"
          label="Sent"
          value={stats.sentCampaignCount.toLocaleString()}
          hint="Newsletters already delivered."
        />
        <StatCard
          className="xl:col-span-4"
          label="Scheduled"
          value={stats.scheduledCampaignCount.toLocaleString()}
          hint="Newsletters queued to send."
        />
        <StatCard
          className="xl:col-span-4"
          label="Drafts"
          value={stats.draftCampaignCount.toLocaleString()}
          hint="Drafts waiting for review."
        />
        <StatCard
          className="xl:col-span-6"
          label="Lists"
          value={stats.listCount.toLocaleString()}
          hint="Mailing lists available to this school."
        />
        <StatCard
          className="xl:col-span-6"
          label="Templates"
          value={stats.templateCount.toLocaleString()}
          hint="Ready-to-use newsletter layouts."
        />
      </div>

      {error ? (
        <EmptyState
          title="Your newsletter data is not ready yet"
          body={error}
        />
      ) : null}

      <ConnectionSection connection={overview?.connection ?? null} syncError={overview?.syncError ?? null} />

      <CampaignTable
        title="Recent newsletters"
        description="A quick look at what this school has recently sent."
        campaigns={overview?.sentCampaigns ?? []}
        emptyTitle="No newsletters yet"
        emptyBody="Sent newsletters will appear here once your school account is connected."
        action={<Button asChild variant="ghost"><a href="/campaigns">View all</a></Button>}
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <AudienceListSection
          lists={(overview?.lists ?? []).slice(0, 4)}
          action={<Button asChild variant="ghost"><a href="/audiences">View all</a></Button>}
        />
        <TemplateListSection
          templates={(overview?.templates ?? []).slice(0, 4)}
          action={<Button asChild variant="ghost"><a href="/templates">View all</a></Button>}
        />
      </div>
    </>
  );
}
