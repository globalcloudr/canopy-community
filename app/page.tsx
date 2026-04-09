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

export default function DashboardPage() {
  return (
    <ProductShell activeNav="dashboard" navItems={communityNavItems}>
      <DashboardContent />
    </ProductShell>
  );
}

function DashboardContent() {
  const { overview, error, loading, refresh } = useCommunityOverview();

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
        title="Newsletter operations for every school workspace"
        description="Canopy Community reads each school’s Campaign Monitor account so staff can see newsletter health, active lists, and ready-to-use templates without leaving the Canopy portfolio."
        actions={
          <>
            <Button variant="secondary" onClick={() => void refresh()} disabled={loading}>
              {loading ? "Refreshing…" : "Refresh data"}
            </Button>
            <Button asChild>
              <a href="/settings">Connection settings</a>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Lists" value={stats.listCount.toLocaleString()} hint="Audience segments currently available in Campaign Monitor." />
        <StatCard label="Templates" value={stats.templateCount.toLocaleString()} hint="Reusable newsletter layouts already available to this school." />
        <StatCard label="Sent" value={stats.sentCampaignCount.toLocaleString()} hint="Recent sent campaigns pulled from the connected account." />
        <StatCard label="Drafts" value={stats.draftCampaignCount.toLocaleString()} hint="Draft newsletters waiting for review or send." />
        <StatCard label="Scheduled" value={stats.scheduledCampaignCount.toLocaleString()} hint="Campaigns that already have a future send time." />
      </div>

      {error ? (
        <EmptyState
          title="Community data is not available yet"
          body={error}
        />
      ) : null}

      <ConnectionSection connection={overview?.connection ?? null} syncError={overview?.syncError ?? null} />

      <CampaignTable
        title="Recent sent newsletters"
        description="A quick look at what this school has already delivered to its community."
        campaigns={overview?.sentCampaigns ?? []}
        emptyTitle="No sent campaigns yet"
        emptyBody="Sent newsletters will show up here after Community can read the connected Campaign Monitor account."
        action={<Button asChild variant="ghost"><a href="/campaigns">See all campaigns</a></Button>}
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <AudienceListSection
          lists={(overview?.lists ?? []).slice(0, 4)}
          action={<Button asChild variant="ghost"><a href="/audiences">All audiences</a></Button>}
        />
        <TemplateListSection
          templates={(overview?.templates ?? []).slice(0, 4)}
          action={<Button asChild variant="ghost"><a href="/templates">All templates</a></Button>}
        />
      </div>
    </>
  );
}
