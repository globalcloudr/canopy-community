"use client";

import { Button } from "@canopy/ui";
import { ProductShell } from "@/app/_components/product-shell";
import { communityNavItems } from "@/app/_components/community-nav";
import { useCommunityOverview } from "@/app/_components/community-data";
import { AudienceListSection } from "@/app/_components/community-sections";
import { EmptyState, PageIntro } from "@/app/_components/community-ui";

export default function AudiencesPage() {
  return (
    <ProductShell activeNav="audiences" navItems={communityNavItems}>
      <AudiencesContent />
    </ProductShell>
  );
}

function AudiencesContent() {
  const { overview, error, loading, refresh } = useCommunityOverview();

  return (
    <>
      <PageIntro
        eyebrow="Audiences"
        title="School newsletter lists"
        description="Community keeps the audience view simple for now: it surfaces the lists already maintained in Campaign Monitor so staff know what’s available before we add deeper send planning and segmentation."
        actions={
          <Button variant="secondary" onClick={() => void refresh()} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh lists"}
          </Button>
        }
      />

      {error ? <EmptyState title="Audience lists could not be loaded" body={error} /> : null}

      <AudienceListSection lists={overview?.lists ?? []} />
    </>
  );
}
