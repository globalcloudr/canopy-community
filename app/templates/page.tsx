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
        title="Your newsletter templates"
        description="Review the layouts your school can keep using for future sends."
        actions={
          <Button variant="secondary" onClick={() => void refresh()} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </Button>
        }
      />

      {error ? <EmptyState title="We could not load your templates" body={error} /> : null}

      <TemplateListSection templates={overview?.templates ?? []} />
    </>
  );
}
