"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Input, Label } from "@canopy/ui";
import { cn } from "@canopy/ui";
import { ProductShell } from "@/app/_components/product-shell";
import { communityNavItems } from "@/app/_components/community-nav";
import { useCommunityOverview, useCommunityWorkspaceId } from "@/app/_components/community-data";
import { supabase } from "@/lib/supabase-client";

export default function ComposePage() {
  return (
    <ProductShell activeNav="compose" navItems={communityNavItems}>
      <ComposeContent />
    </ProductShell>
  );
}

function ComposeContent() {
  const { workspaceId } = useCommunityWorkspaceId();
  const { overview } = useCommunityOverview();
  const lists = overview?.lists ?? [];
  const userEmail = overview?.connection?.accountName ?? "";

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [subject, setSubject] = useState("");
  const [fromName, setFromName] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [replyTo, setReplyTo] = useState("");

  // Pre-populate sender fields from the most recent sent campaign once overview loads.
  // The fromEmail will be the school's CM-assigned sending address (e.g. info@ditnld.createsend7.com).
  const senderPrefilled = useRef(false);
  useEffect(() => {
    if (senderPrefilled.current) return;
    const lastSent = overview?.sentCampaigns[0];
    if (!lastSent) return;
    setFromName((prev) => prev || lastSent.fromName || "");
    setFromEmail((prev) => prev || lastSent.fromEmail || "");
    setReplyTo((prev) => prev || lastSent.replyTo || "");
    senderPrefilled.current = true;
  }, [overview]);
  const [listIds, setListIds] = useState<string[]>([]);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [sendMode, setSendMode] = useState<"immediately" | "schedule">("immediately");
  const [scheduledDate, setScheduledDate] = useState("");
  const [confirmationEmail, setConfirmationEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setHtmlContent(event.target?.result as string);
    };
    reader.readAsText(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!workspaceId || !htmlContent) return;

    setSending(true);
    setError(null);

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Your session has expired. Please sign in again.");

      const response = await fetch("/api/community/compose", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          workspaceId,
          subject,
          fromName,
          fromEmail,
          replyTo,
          listIds,
          htmlContent,
          scheduledDate: sendMode === "schedule" && scheduledDate ? scheduledDate : null,
          confirmationEmail,
        }),
      });

      const payload = (await response.json()) as { error?: string; campaignId?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to send campaign.");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSending(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-[1.85rem] font-semibold tracking-[-0.03em] text-[#0f172a]">
            Campaign sent!
          </h1>
          <p className="mt-1.5 text-[15px] text-[#64748b]">
            {sendMode === "schedule"
              ? "Your campaign has been scheduled. You'll receive a confirmation email when it goes out."
              : "Your campaign is on its way. You'll receive a confirmation email shortly."}
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="secondary">
            <a href="/campaigns">View campaigns</a>
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setSuccess(false);
              setSubject("");
              setFromName("");
              setFromEmail("");
              setReplyTo("");
              setListIds([]);
              setHtmlContent(null);
              setFileName(null);
              setScheduledDate("");
              setConfirmationEmail("");
              setSendMode("immediately");
            }}
          >
            Send another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[1.85rem] font-semibold tracking-[-0.03em] text-[#0f172a]">
          New campaign
        </h1>
        <p className="mt-1.5 text-[15px] text-[#64748b]">
          Upload an HTML email file, choose your list, and send.
        </p>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">

        {/* Left column — form fields */}
        <div className="flex min-w-0 flex-1 flex-col gap-6">

          {/* Campaign details */}
          <FormSection title="Campaign details">
            <div className="grid gap-4">
              <Field label="Subject line" required>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. March 2026 Newsletter"
                  required
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="From name" required>
                  <Input
                    value={fromName}
                    onChange={(e) => setFromName(e.target.value)}
                    placeholder="e.g. San Mateo ACE"
                    required
                  />
                </Field>
                <Field
                  label="From email"
                  required
                  hint="Use your school's Campaign Monitor sending address."
                >
                  <Input
                    type="email"
                    value={fromEmail}
                    onChange={(e) => setFromEmail(e.target.value)}
                    placeholder="info@yourschool.createsend.com"
                    required
                  />
                </Field>
              </div>
              <Field label="Reply-to email" required>
                <Input
                  type="email"
                  value={replyTo}
                  onChange={(e) => setReplyTo(e.target.value)}
                  placeholder="Same as from email, or a different address"
                  required
                />
              </Field>
            </div>
          </FormSection>

          {/* Recipients */}
          <FormSection title="Recipients">
            {lists.length === 0 ? (
              <p className="text-[14px] text-[#64748b]">
                No mailing lists found. Make sure your Campaign Monitor account is connected in{" "}
                <a href="/settings" className="text-[#2563eb] hover:underline">Settings</a>.
              </p>
            ) : (
              <div className="grid gap-3">
                {/* Select all */}
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#e2e8f0] px-4 py-3 hover:bg-[#f8fafc]">
                  <input
                    type="checkbox"
                    className="accent-[#2563eb]"
                    checked={listIds.length === lists.length}
                    ref={(el) => {
                      if (el) el.indeterminate = listIds.length > 0 && listIds.length < lists.length;
                    }}
                    onChange={(e) => {
                      setListIds(e.target.checked ? lists.map((l) => l.listId) : []);
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-semibold text-[#0f172a]">All lists</p>
                    <p className="text-[13px] text-[#64748b]">
                      {lists.reduce((sum, l) => sum + (l.subscriberCount ?? 0), 0).toLocaleString()} total subscribers
                    </p>
                  </div>
                </label>

                {/* Individual lists */}
                <div className="grid gap-2">
                  {lists.map((list) => (
                    <label
                      key={list.listId}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#e2e8f0] px-4 py-3 hover:bg-[#f8fafc]"
                    >
                      <input
                        type="checkbox"
                        className="accent-[#2563eb]"
                        checked={listIds.includes(list.listId)}
                        onChange={(e) => {
                          setListIds((prev) =>
                            e.target.checked
                              ? [...prev, list.listId]
                              : prev.filter((id) => id !== list.listId)
                          );
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-medium text-[#0f172a]">{list.name}</p>
                        {list.subscriberCount != null ? (
                          <p className="text-[13px] text-[#64748b]">
                            {list.subscriberCount.toLocaleString()} subscribers
                          </p>
                        ) : null}
                      </div>
                    </label>
                  ))}
                </div>

                {listIds.length > 0 ? (
                  <p className="text-[13px] text-[#64748b]">
                    {listIds.length === lists.length
                      ? "Sending to all lists"
                      : `${listIds.length} list${listIds.length === 1 ? "" : "s"} selected`}
                  </p>
                ) : null}
              </div>
            )}
          </FormSection>

          {/* Email content */}
          <FormSection title="Email content">
            <input
              ref={fileInputRef}
              type="file"
              accept=".html,.htm"
              className="hidden"
              onChange={handleFileChange}
            />
            <div
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition hover:bg-[#f8fafc]",
                htmlContent ? "border-[#2563eb] bg-[#eff6ff]" : "border-[#cbd5e1]"
              )}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
            >
              {htmlContent ? (
                <>
                  <p className="text-[15px] font-semibold text-[#1d4ed8]">{fileName}</p>
                  <p className="mt-1 text-[13px] text-[#3b82f6]">Click to replace</p>
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" className="mb-3 h-8 w-8" aria-hidden="true">
                    <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" strokeLinecap="round" />
                    <path d="M12 12V4m0 0-3 3m3-3 3 3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="text-[15px] font-semibold text-[#334155]">Upload HTML file</p>
                  <p className="mt-1 text-[13px] text-[#64748b]">Click to browse — .html or .htm files only</p>
                </>
              )}
            </div>
          </FormSection>

          {/* Send options */}
          <FormSection title="Send options">
            <div className="flex gap-6">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="sendMode"
                  value="immediately"
                  checked={sendMode === "immediately"}
                  onChange={() => setSendMode("immediately")}
                  className="accent-[#2563eb]"
                />
                <span className="text-[14px] font-medium text-[#334155]">Send immediately</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="sendMode"
                  value="schedule"
                  checked={sendMode === "schedule"}
                  onChange={() => setSendMode("schedule")}
                  className="accent-[#2563eb]"
                />
                <span className="text-[14px] font-medium text-[#334155]">Schedule</span>
              </label>
            </div>
            {sendMode === "schedule" ? (
              <div className="mt-4">
                <Field label="Send date and time" required>
                  <Input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    required
                  />
                </Field>
              </div>
            ) : null}
            <div className="mt-4">
              <Field label="Confirmation email" required hint="Campaign Monitor will send a confirmation to this address when the campaign goes out.">
                <Input
                  type="email"
                  value={confirmationEmail}
                  onChange={(e) => setConfirmationEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </Field>
            </div>
          </FormSection>

          {error ? (
            <p className="rounded-lg border border-[#fca5a5] bg-[#fef2f2] px-4 py-3 text-[14px] text-[#b91c1c]">
              {error}
            </p>
          ) : null}

          <div className="flex items-center gap-3">
            <Button
              type="submit"
              variant="primary"
              disabled={sending || !htmlContent || listIds.length === 0 || !subject || !fromName || !fromEmail || !replyTo || !confirmationEmail || (sendMode === "schedule" && !scheduledDate)}
            >
              {sending
                ? "Sending…"
                : sendMode === "schedule"
                  ? "Schedule campaign"
                  : "Send campaign"}
            </Button>
            <Button asChild variant="secondary">
              <a href="/campaigns">Cancel</a>
            </Button>
          </div>
        </div>

        {/* Right column — preview */}
        {htmlContent ? (
          <div className="shrink-0 lg:w-[420px]">
            <p className="mb-2 text-[13px] font-semibold text-[#334155]">Preview</p>
            <div className="overflow-hidden rounded-lg border border-[#e2e8f0] bg-white">
              <iframe
                srcDoc={htmlContent}
                title="Email preview"
                className="h-[600px] w-full"
                sandbox="allow-same-origin"
              />
            </div>
            <p className="mt-2 text-[12px] text-[#94a3b8]">
              Scroll inside the preview to see the full email.
            </p>
          </div>
        ) : null}

      </form>
    </div>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-4 border-b border-[var(--app-divider)] pb-2 text-[1rem] font-semibold tracking-[-0.01em] text-[#0f172a]">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label>
        {label}
        {required ? <span className="ml-1 text-[#ef4444]">*</span> : null}
      </Label>
      {hint ? <p className="text-[13px] text-[#64748b]">{hint}</p> : null}
      {children}
    </div>
  );
}
