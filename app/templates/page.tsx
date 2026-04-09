"use client";

import { Button } from "@canopy/ui";
import { ProductShell } from "@/app/_components/product-shell";
import { communityNavItems } from "@/app/_components/community-nav";
import { useCommunityOverview } from "@/app/_components/community-data";
import { TemplateListSection } from "@/app/_components/community-sections";
import { EmptyState, PageIntro } from "@/app/_components/community-ui";

export default function TemplatesPage() {
  return (
    <ProductShell activeNav="templates" navItems={communityNavItems}>
      <TemplatesContent />
    </ProductShell>
  );
}

function TemplatesContent() {
  const { overview, error, loading, refresh } = useCommunityOverview();

  return (
    <>
      <PageIntro
        eyebrow="Templates"
        title="Newsletter layouts already assigned to the school"
        description="Templates stay managed in Campaign Monitor, while Community gives school staff a focused place to review what’s available for future newsletter sends."
        actions={
          <Button variant="secondary" onClick={() => void refresh()} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh templates"}
          </Button>
        }
      />

      {error ? <EmptyState title="Templates could not be loaded" body={error} /> : null}

      <TemplateListSection templates={overview?.templates ?? []} />
    </>
  );
}
