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
import { EmptyState, MiniStat, PageIntro, SectionCard } from "@/app/_components/community-ui";
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
        title="Welcome back"
        description={`Keep up with drafts, scheduled sends, and mailing lists for ${schoolName}.`}
        actions={
          <>
            <Button variant="secondary" onClick={() => void refresh()} disabled={loading}>
              {loading ? "Refreshing…" : "Refresh"}
            </Button>
            <Button asChild>
              <a href="/campaigns">View newsletters</a>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.9fr)]">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MiniStat label="Drafts" value={stats.draftCampaignCount.toLocaleString()} hint="Need review" />
          <MiniStat label="Scheduled" value={stats.scheduledCampaignCount.toLocaleString()} hint="Ready to send" />
          <MiniStat label="Sent" value={stats.sentCampaignCount.toLocaleString()} hint="Already delivered" />
          <MiniStat label="Lists" value={stats.listCount.toLocaleString()} hint="Available to use" />
        </div>

        <SectionCard
          title="Start here"
          description="The fastest way to keep your school newsletter program moving."
          className="h-full"
        >
          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <ActionLinkCard
              href="/campaigns"
              title="Review drafts"
              body="Check what is in progress and what is ready to send."
            />
            <ActionLinkCard
              href="/templates"
              title="Pick a template"
              body="See the layouts your school can keep using."
            />
            <ActionLinkCard
              href="/settings"
              title="Check connection"
              body="Update your Campaign Monitor connection if something looks off."
            />
          </div>
        </SectionCard>
      </div>

      {error ? (
        <EmptyState
          title="Your newsletter data is not ready yet"
          body={error}
        />
      ) : null}

      <ConnectionSection connection={overview?.connection ?? null} syncError={overview?.syncError ?? null} showDetails={false} />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-6">
          <CampaignTable
            title="Drafts"
            description="Newsletters still being prepared."
            campaigns={overview?.draftCampaigns ?? []}
            emptyTitle="No drafts right now"
            emptyBody="Saved drafts will appear here."
            action={<Button asChild variant="ghost"><a href="/campaigns">View all</a></Button>}
          />
          <CampaignTable
            title="Scheduled"
            description="Newsletters with a send date already set."
            campaigns={overview?.scheduledCampaigns ?? []}
            emptyTitle="Nothing scheduled"
            emptyBody="Scheduled newsletters will appear here."
          />
        </div>
        <div className="grid gap-6">
          <CampaignTable
            title="Recent sends"
            description="The latest newsletters already delivered."
            campaigns={overview?.sentCampaigns ?? []}
            emptyTitle="No newsletters yet"
            emptyBody="Sent newsletters will appear here once your school account is connected."
          />
          <TemplateListSection
            templates={(overview?.templates ?? []).slice(0, 2)}
            action={<Button asChild variant="ghost"><a href="/templates">View all</a></Button>}
          />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <AudienceListSection
          lists={(overview?.lists ?? []).slice(0, 4)}
          action={<Button asChild variant="ghost"><a href="/audiences">View all</a></Button>}
        />
        <SectionCard
          title="How list management works"
          description="Lists are visible in Community so staff can see what is available."
        >
          <div className="space-y-3 text-[14px] leading-6 text-[#617284]">
            <p>Detailed list management still happens in Campaign Monitor.</p>
            <p>Community keeps this view focused on the lists your school can use for sends and planning.</p>
            <div className="pt-1">
              <Button asChild variant="secondary">
                <a href="/settings">Review connection</a>
              </Button>
            </div>
          </div>
        </SectionCard>
      </div>
    </>
  );
}

function ActionLinkCard({
  href,
  title,
  body,
}: {
  href: string;
  title: string;
  body: string;
}) {
  return (
    <a
      href={href}
      className="rounded-[22px] border border-[var(--app-divider)] bg-[#fbfdff] px-4 py-4 transition hover:border-[#bfd3ea] hover:bg-white"
    >
      <p className="text-[15px] font-semibold tracking-[-0.02em] text-[#0f172a]">{title}</p>
      <p className="mt-1 text-[13px] leading-6 text-[#617284]">{body}</p>
    </a>
  );
}
