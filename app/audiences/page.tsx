"use client";


import { Button } from "@globalcloudr/canopy-ui";
import { ProductShell } from "@/app/_components/product-shell";
import { communityNavItems } from "@/app/_components/community-nav";
import { useCommunityOverview } from "@/app/_components/community-data";
import { EmptyState, PageHeader, formatShortDate } from "@/app/_components/community-ui";

export default function AudiencesPage() {
  return (
    <ProductShell activeNav="audiences" navItems={communityNavItems}>
      <AudiencesContent />
    </ProductShell>
  );
}

function AudiencesContent() {
  const { overview, error, loading, refresh } = useCommunityOverview();
  const lists = overview?.lists ?? [];

  const totalSubscribers = lists.reduce(
    (sum, l) => sum + (l.subscriberCount ?? 0),
    0
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Lists and subscribers"
        actions={
          <Button variant="secondary" onClick={() => void refresh()} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </Button>
        }
      />

      {error ? <EmptyState title="We could not load your lists" body={error} /> : null}

      <div className="flex flex-col gap-6 md:flex-row">
        {/* Stats sidebar */}
        <aside className="shrink-0 md:w-44">
          <SidebarStat label="Lists" value={lists.length} active />
          <SidebarStat label="Subscribers" value={totalSubscribers || "—"} />
        </aside>

        {/* Main content */}
        <div className="min-w-0 flex-1">
          {lists.length === 0 ? (
            <EmptyState
              title="No lists yet"
              body="Once your school account is connected, mailing lists will appear here."
            />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--app-divider)] text-left text-[13px] font-medium text-[#64748b]">
                  <th className="py-2.5 pr-4 font-medium">List name</th>
                  <th className="hidden py-2.5 pr-4 font-medium md:table-cell">Opt-in</th>
                  <th className="hidden py-2.5 pr-4 font-medium md:table-cell">Unsubscribe</th>
                  <th className="py-2.5 text-right font-medium">Subscribers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--app-divider)]">
                {lists.map((list) => (
                  <tr key={list.listId}>
                    <td className="py-3.5 pr-4">
                      <span className="text-[14px] font-medium text-[#0f172a]">
                        {list.name}
                      </span>
                    </td>
                    <td className="hidden py-3.5 pr-4 text-[14px] text-[#334155] md:table-cell">
                      {typeof list.confirmedOptIn === "boolean"
                        ? list.confirmedOptIn
                          ? "Confirmed"
                          : "Single"
                        : "—"}
                    </td>
                    <td className="hidden py-3.5 pr-4 text-[14px] text-[#334155] md:table-cell">
                      {list.unsubscribeSetting ?? "—"}
                    </td>
                    <td className="py-3.5 text-right text-[14px] font-medium text-[#334155]">
                      {list.subscriberCount != null
                        ? list.subscriberCount.toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function SidebarStat({
  label,
  value,
  active,
}: {
  label: string;
  value: number | string;
  active?: boolean;
}) {
  return (
    <div className="mb-3">
      <p
        className={
          active
            ? "text-[14px] font-semibold text-[#2563eb]"
            : "text-[14px] font-medium text-[#64748b]"
        }
      >
        {label}
      </p>
      <p
        className={
          active
            ? "text-[1.1rem] font-semibold text-[#2563eb]"
            : "text-[1.1rem] font-semibold text-[#0f172a]"
        }
      >
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
    </div>
  );
}
