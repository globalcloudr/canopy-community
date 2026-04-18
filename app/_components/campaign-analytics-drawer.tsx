"use client";

import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@canopy/ui";
import { formatShortDate } from "@/app/_components/community-ui";
import { supabase } from "@/lib/supabase-client";
import type { CampaignAnalytics, CommunityCampaignSummary } from "@/lib/community-schema";

// ─── Main drawer ─────────────────────────────────────────────────────────────

export function CampaignAnalyticsDrawer({
  campaign,
  workspaceId,
  onClose,
}: {
  campaign: CommunityCampaignSummary | null;
  workspaceId: string | null;
  onClose: () => void;
}) {
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  const load = useCallback(async (id: string, wsId: string) => {
    setAnalytics(null);
    setError(null);
    setLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Session expired.");
      const res = await fetch(
        `/api/community/campaigns/${encodeURIComponent(id)}/analytics?workspaceId=${wsId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const payload = (await res.json()) as { analytics?: CampaignAnalytics; error?: string };
      if (!res.ok) throw new Error(payload.error ?? "Failed to load analytics.");
      setAnalytics(payload.analytics ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (campaign && workspaceId) void load(campaign.id, workspaceId);
  }, [campaign, workspaceId, load]);

  // Reset share modal when drawer closes
  useEffect(() => {
    if (!campaign) setSharing(false);
  }, [campaign]);

  return (
    <>
      <Dialog open={!!campaign} onOpenChange={(open) => { if (!open) onClose(); }}>
        <DialogContent className="left-auto right-0 top-0 h-screen max-h-screen w-full translate-x-0 translate-y-0 overflow-hidden rounded-none border-l border-[#e2e8f0] p-0 shadow-xl sm:max-w-xl">
          <aside className="flex h-full flex-col bg-white">

            {/* Header */}
            <div className="shrink-0 border-b border-[#e2e8f0] px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <DialogTitle className="truncate text-[16px] font-semibold text-[#0f172a]">
                    {campaign?.name ?? "Campaign"}
                  </DialogTitle>
                  {campaign?.sentDate ? (
                    <p className="mt-0.5 text-[13px] text-[#64748b]">
                      Sent {formatShortDate(campaign.sentDate)}
                      {campaign.recipientCount != null
                        ? ` · ${campaign.recipientCount.toLocaleString()} recipients`
                        : ""}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-0.5 shrink-0 rounded-md p-1 text-[#94a3b8] transition hover:text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                  aria-label="Close"
                >
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5" aria-hidden="true">
                    <path d="m4 4 8 8M12 4l-8 8" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              {/* Action buttons */}
              {campaign?.webVersionUrl ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <a
                    href={campaign.webVersionUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md border border-[#e2e8f0] bg-white px-3 py-1.5 text-[13px] font-medium text-[#334155] transition hover:border-[#cbd5e1] hover:bg-[#f8fafc]"
                  >
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3.5 w-3.5" aria-hidden="true">
                      <path d="M6 3H3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-3" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M9 2h5v5M14 2 8 8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    View campaign
                  </a>
                  <button
                    type="button"
                    onClick={() => setSharing(true)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-[#e2e8f0] bg-white px-3 py-1.5 text-[13px] font-medium text-[#334155] transition hover:border-[#cbd5e1] hover:bg-[#f8fafc]"
                  >
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3.5 w-3.5" aria-hidden="true">
                      <circle cx="12" cy="3" r="1.5" />
                      <circle cx="12" cy="13" r="1.5" />
                      <circle cx="4" cy="8" r="1.5" />
                      <path d="M10.5 3.75 5.5 7.25M10.5 12.25 5.5 8.75" strokeLinecap="round" />
                    </svg>
                    Share campaign
                  </button>
                </div>
              ) : null}
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {loading ? (
                <div className="flex h-40 items-center justify-center">
                  <p className="text-[14px] text-[#64748b]">Loading analytics…</p>
                </div>
              ) : error ? (
                <p className="rounded-lg border border-[#fca5a5] bg-[#fef2f2] px-4 py-3 text-[14px] text-[#b91c1c]">
                  {error}
                </p>
              ) : analytics ? (
                <div className="flex flex-col gap-8">
                  <AnalyticsSection title="Engagement">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <StatCard label="Open rate" value={analytics.openRate != null ? `${analytics.openRate}%` : "—"} />
                      <StatCard label="Click rate" value={analytics.clickRate != null ? `${analytics.clickRate}%` : "—"} />
                      <StatCard label="Clicks to opens" value={analytics.clicksToOpenRate != null ? `${analytics.clicksToOpenRate}%` : "—"} />
                      <StatCard label="Unique opens" value={analytics.uniqueOpened?.toLocaleString() ?? "—"} />
                      <StatCard label="Unique clicks" value={analytics.uniqueClicks?.toLocaleString() ?? "—"} />
                      <StatCard label="Recipients" value={analytics.recipients?.toLocaleString() ?? "—"} />
                    </div>
                  </AnalyticsSection>

                  <AnalyticsSection title="Delivery">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <StatCard label="Bounced" value={analytics.bounced?.toLocaleString() ?? "—"} />
                      <StatCard label="Unsubscribed" value={analytics.unsubscribed?.toLocaleString() ?? "—"} />
                      <StatCard label="Spam complaints" value={analytics.spamComplaints?.toLocaleString() ?? "—"} />
                    </div>
                  </AnalyticsSection>

                  <AnalyticsSection title="Reactions">
                    <div className="grid grid-cols-3 gap-3">
                      <StatCard label="Forwards" value={analytics.forwards?.toLocaleString() ?? "—"} />
                      <StatCard label="Likes" value={analytics.likes?.toLocaleString() ?? "—"} />
                      <StatCard label="Mentions" value={analytics.mentions?.toLocaleString() ?? "—"} />
                    </div>
                  </AnalyticsSection>

                  {analytics.topLinks.length > 0 ? (
                    <AnalyticsSection title="Top links">
                      <div className="overflow-hidden rounded-lg border border-[#e2e8f0]">
                        <table className="w-full text-[13px]">
                          <thead>
                            <tr className="border-b border-[#e2e8f0] bg-[#f8fafc] text-left text-[#64748b]">
                              <th className="px-3 py-2 font-medium">URL</th>
                              <th className="px-3 py-2 text-right font-medium">Clicks</th>
                              <th className="px-3 py-2 text-right font-medium">Unique</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#e2e8f0]">
                            {analytics.topLinks.map((link, i) => (
                              <tr key={i} className="hover:bg-[#f8fafc]">
                                <td className="max-w-[220px] truncate px-3 py-2">
                                  <a
                                    href={link.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[#2563eb] hover:underline"
                                    title={link.url}
                                  >
                                    {truncateUrl(link.url)}
                                  </a>
                                </td>
                                <td className="px-3 py-2 text-right text-[#334155]">{link.totalClicks}</td>
                                <td className="px-3 py-2 text-right text-[#334155]">{link.uniqueClicks}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </AnalyticsSection>
                  ) : null}
                </div>
              ) : null}
            </div>

            {/* Share modal — inside the dialog so Radix focus trap doesn't block it */}
            {sharing && campaign?.webVersionUrl ? (
              <ShareCampaignModal
                url={campaign.webVersionUrl}
                onClose={() => setSharing(false)}
              />
            ) : null}

          </aside>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Share modal ─────────────────────────────────────────────────────────────

function ShareCampaignModal({ url, onClose }: { url: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    void navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.45)" }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Modal card */}
      <div className="relative w-full max-w-md rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e2e8f0] px-6 py-5">
          <h3 className="text-[16px] font-semibold text-[#0f172a]">Share this campaign</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-[#94a3b8] transition hover:text-[#334155]"
            aria-label="Close"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5" aria-hidden="true">
              <path d="m4 4 8 8M12 4l-8 8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-[14px] text-[#64748b]">
            Share this campaign with friends and we'll show you the results.
          </p>

          {/* URL + copy */}
          <div className="mt-4 flex items-center gap-0 overflow-hidden rounded-lg border border-[#e2e8f0]">
            <span className="min-w-0 flex-1 truncate px-3 py-2.5 font-mono text-[12px] text-[#334155]">
              {url}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="shrink-0 border-l border-[#e2e8f0] px-4 py-2.5 text-[13px] font-semibold text-[#2563eb] transition hover:bg-[#eff6ff] focus:outline-none"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          {/* Share buttons */}
          <div className="mt-4 flex gap-3">
            <a
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 rounded-lg border border-[#e2e8f0] px-4 py-2.5 text-center text-[13px] font-medium text-[#334155] transition hover:border-[#cbd5e1] hover:bg-[#f8fafc]"
            >
              Share on X
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 rounded-lg border border-[#e2e8f0] px-4 py-2.5 text-center text-[13px] font-medium text-[#334155] transition hover:border-[#cbd5e1] hover:bg-[#f8fafc]"
            >
              Share on Facebook
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AnalyticsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-[#64748b]">
        {title}
      </h4>
      {children}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3">
      <p className="text-[12px] text-[#64748b]">{label}</p>
      <p className="mt-1 text-[20px] font-semibold tracking-tight text-[#0f172a]">{value}</p>
    </div>
  );
}

function truncateUrl(url: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname + u.search;
    return u.hostname + (path.length > 30 ? path.slice(0, 30) + "…" : path);
  } catch {
    return url.length > 50 ? url.slice(0, 50) + "…" : url;
  }
}
