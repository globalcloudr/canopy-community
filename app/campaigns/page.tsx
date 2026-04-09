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
        title="Your newsletter activity"
        description="Review drafts, scheduled sends, and recent newsletters for your school."
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

      {error ? <EmptyState title="We could not load your newsletters" body={error} /> : null}

      <CampaignTable
        title="Drafts"
        description="Newsletters still being prepared."
        campaigns={overview?.draftCampaigns ?? []}
        emptyTitle="No drafts yet"
        emptyBody="Saved drafts will appear here."
      />

      <CampaignTable
        title="Scheduled"
        description="Newsletters that already have a send date."
        campaigns={overview?.scheduledCampaigns ?? []}
        emptyTitle="Nothing scheduled"
        emptyBody="Scheduled newsletters will appear here."
      />

      <CampaignTable
        title="Sent"
        description="Recently delivered newsletters from your school."
        campaigns={overview?.sentCampaigns ?? []}
        emptyTitle="No sent newsletters yet"
        emptyBody="Sent newsletters will appear here once your account is connected."
      />
    </>
  );
}
