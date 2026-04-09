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
        eyebrow="Lists"
        title="Your mailing lists"
        description="Review the mailing lists your school already uses. Detailed list management stays in Campaign Monitor."
        actions={
          <Button variant="secondary" onClick={() => void refresh()} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </Button>
        }
      />

      {error ? <EmptyState title="We could not load your lists" body={error} /> : null}

      <AudienceListSection lists={overview?.lists ?? []} />
    </>
  );
}
