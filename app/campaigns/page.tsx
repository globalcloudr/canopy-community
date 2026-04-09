"use client";

import { Button } from "@canopy/ui";
import { ProductShell } from "@/app/_components/product-shell";
import { communityNavItems } from "@/app/_components/community-nav";
import { useCommunityOverview } from "@/app/_components/community-data";
import { CampaignTable } from "@/app/_components/community-sections";
import { EmptyState, PageIntro } from "@/app/_components/community-ui";

export default function CampaignsPage() {
  return (
    <ProductShell activeNav="campaigns" navItems={communityNavItems}>
      <CampaignsContent />
    </ProductShell>
  );
}

function CampaignsContent() {
  const { overview, error, loading, refresh } = useCommunityOverview();

  return (
    <>
      <PageIntro
        eyebrow="Campaigns"
        title="Recent newsletter activity"
        description="This first build gives Community a shared view of sent, scheduled, and draft newsletters already living in Campaign Monitor. It’s the operational surface we’ll use to add native campaign creation next."
        actions={
          <>
            <Button variant="secondary" onClick={() => void refresh()} disabled={loading}>
              {loading ? "Refreshing…" : "Refresh"}
            </Button>
            <Button asChild>
              <a href="/settings">Update connection</a>
            </Button>
          </>
        }
      />

      {error ? <EmptyState title="Campaigns could not be loaded" body={error} /> : null}

      <CampaignTable
        title="Draft campaigns"
        description="Draft campaigns are a good proxy for in-progress newsletter work while we finish the native composer."
        campaigns={overview?.draftCampaigns ?? []}
        emptyTitle="No drafts yet"
        emptyBody="When a connected account has saved drafts, they’ll appear here."
      />

      <CampaignTable
        title="Scheduled campaigns"
        description="Anything with a future send time shows up here so school staff can confirm what’s about to go out."
        campaigns={overview?.scheduledCampaigns ?? []}
        emptyTitle="Nothing is scheduled"
        emptyBody="Scheduled newsletters will appear here after they’re created in Campaign Monitor."
      />

      <CampaignTable
        title="Sent campaigns"
        description="The latest delivered newsletters, ready for review and archive linking."
        campaigns={overview?.sentCampaigns ?? []}
        emptyTitle="No sent newsletters yet"
        emptyBody="Sent campaigns will populate once a workspace account is connected."
      />
    </>
  );
}
