"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Input, Label } from "@canopy/ui";
import { cn } from "@canopy/ui";
import { ProductShell } from "@/app/_components/product-shell";
import { communityNavItems } from "@/app/_components/community-nav";
import { useCommunityOverview, useCommunityWorkspaceId, useCommunityTemplates } from "@/app/_components/community-data";
import { UnlayerEditor } from "@/app/_components/unlayer-editor";
import { supabase } from "@/lib/supabase-client";
import type { CommunityTemplate } from "@/lib/community-schema";

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
  const [designJson, setDesignJson] = useState<Record<string, unknown> | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const { templates: savedTemplates } = useCommunityTemplates();
  const [sendMode, setSendMode] = useState<"immediately" | "schedule">("immediately");
  const [scheduledDate, setScheduledDate] = useState("");
  const [confirmationEmail, setConfirmationEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [savedAsDraft, setSavedAsDraft] = useState(false);

  const billing = overview?.billing ?? null;

  // Compute totals for the confirmation dialog
  const selectedLists = lists.filter((l) => listIds.includes(l.listId));
  const totalRecipients = selectedLists.reduce((sum, l) => sum + (l.subscriberCount ?? 0), 0);
  const estimatedCost =
    billing?.baseRatePerRecipient != null && totalRecipients > 0
      ? totalRecipients * billing.baseRatePerRecipient
      : null;
  const currency = billing?.currency ?? "USD";
  const credits = billing?.credits ?? null;
  const insufficientCredits =
    credits !== null && estimatedCost !== null && credits < estimatedCost;

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

  function handleReviewClick(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setConfirming(true);
  }

  async function handleSaveAsDraft() {
    if (!workspaceId || !htmlContent) return;

    setSavingDraft(true);
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
          draft: true,
        }),
      });

      const payload = (await response.json()) as { error?: string; campaignId?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to save draft.");
      }

      setSavedAsDraft(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSavingDraft(false);
    }
  }

  async function handleConfirmSend() {
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
      setConfirming(false);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSending(false);
    }
  }

  if (savedAsDraft) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-[1.85rem] font-semibold tracking-[-0.03em] text-[#0f172a]">
            Draft saved
          </h1>
          <p className="mt-1.5 text-[15px] text-[#64748b]">
            Your campaign has been saved as a draft in Campaign Monitor. You can find it in your Campaigns page.
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="primary">
            <a href="/campaigns">View campaigns</a>
          </Button>
          <Button variant="secondary" onClick={() => setSavedAsDraft(false)}>
            Keep editing
          </Button>
        </div>
      </div>
    );
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
              setDesignJson(null);
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

      <form onSubmit={(e) => void handleReviewClick(e)} className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">

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
              <Field label="Mailing lists" required>
                <ListMultiSelect
                  lists={lists}
                  selected={listIds}
                  onChange={setListIds}
                />
              </Field>
            )}
          </FormSection>

          {/* Email content */}
          <FormSection title="Email content">
            {htmlContent ? (
              <div className={cn(
                "rounded-lg border-2 border-[#2563eb] bg-[#eff6ff] px-4 py-3"
              )}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[15px] font-semibold text-[#1d4ed8]">
                      {fileName ?? "Email designed"}
                    </p>
                    <p className="mt-0.5 text-[13px] text-[#3b82f6]">
                      {designJson ? "Designed in editor" : "Uploaded HTML file"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {designJson ? (
                      <Button variant="secondary" size="sm" onClick={() => setEditorOpen(true)}>
                        Edit design
                      </Button>
                    ) : null}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setHtmlContent(null);
                        setFileName(null);
                        setDesignJson(null);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-3">
                {/* Design your email */}
                <button
                  type="button"
                  onClick={() => setEditorOpen(true)}
                  className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-[#cbd5e1] px-4 py-8 text-center transition hover:border-[#2563eb] hover:bg-[#f8fafc]"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" className="h-7 w-7" aria-hidden="true">
                    <path d="M12 20h9" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="text-[14px] font-semibold text-[#334155]">Design your email</p>
                  <p className="text-[12px] text-[#64748b]">Open the drag-and-drop editor</p>
                </button>

                {/* Start from template */}
                <button
                  type="button"
                  onClick={() => setTemplatePickerOpen(true)}
                  className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-[#cbd5e1] px-4 py-8 text-center transition hover:border-[#2563eb] hover:bg-[#f8fafc]"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" className="h-7 w-7" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M3 9h18" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M9 21V9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="text-[14px] font-semibold text-[#334155]">Start from template</p>
                  <p className="text-[12px] text-[#64748b]">
                    {savedTemplates.length > 0
                      ? `${savedTemplates.length} template${savedTemplates.length === 1 ? "" : "s"} available`
                      : "No templates saved yet"}
                  </p>
                </button>

                {/* Upload HTML */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".html,.htm"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-[#cbd5e1] px-4 py-8 text-center transition hover:border-[#2563eb] hover:bg-[#f8fafc]"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" className="h-7 w-7" aria-hidden="true">
                    <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" strokeLinecap="round" />
                    <path d="M12 12V4m0 0-3 3m3-3 3 3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="text-[14px] font-semibold text-[#334155]">Upload HTML file</p>
                  <p className="text-[12px] text-[#64748b]">.html or .htm files</p>
                </button>
              </div>
            )}
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

          {/* Confirmation panel */}
          {confirming ? (
            <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-5">
              <h3 className="text-[15px] font-semibold text-[#0f172a]">Review before sending</h3>
              <div className="mt-4 grid gap-3">
                <ConfirmRow label="Subject" value={subject} />
                <ConfirmRow label="From" value={`${fromName} <${fromEmail}>`} />
                <ConfirmRow
                  label="Lists"
                  value={selectedLists.map((l) => l.name).join(", ")}
                />
                <ConfirmRow
                  label="Recipients"
                  value={
                    totalRecipients > 0
                      ? totalRecipients.toLocaleString()
                      : "Unknown (subscriber counts unavailable)"
                  }
                />
                {estimatedCost !== null ? (
                  <ConfirmRow
                    label="Estimated cost"
                    value={`${currency} ${estimatedCost.toFixed(2)}`}
                    highlight={insufficientCredits ? "warning" : undefined}
                  />
                ) : null}
                {credits !== null ? (
                  <ConfirmRow
                    label="Available credits"
                    value={`${currency} ${credits.toFixed(2)}`}
                    highlight={insufficientCredits ? "warning" : undefined}
                  />
                ) : null}
                {sendMode === "schedule" && scheduledDate ? (
                  <ConfirmRow label="Scheduled for" value={new Date(scheduledDate).toLocaleString()} />
                ) : (
                  <ConfirmRow label="Send time" value="Immediately" />
                )}
              </div>

              {insufficientCredits ? (
                <p className="mt-4 rounded-lg border border-[#fca5a5] bg-[#fef2f2] px-4 py-3 text-[14px] text-[#b91c1c]">
                  Your account may not have enough credits for this send. Campaign Monitor will charge your saved payment method, or the send may fail.
                </p>
              ) : null}

              <div className="mt-5 flex items-center gap-3">
                <Button
                  type="button"
                  variant="primary"
                  disabled={sending}
                  onClick={() => void handleConfirmSend()}
                >
                  {sending
                    ? "Sending…"
                    : sendMode === "schedule"
                      ? "Confirm and schedule"
                      : "Confirm and send"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={sending}
                  onClick={() => setConfirming(false)}
                >
                  Go back
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="submit"
                variant="primary"
                disabled={savingDraft || !htmlContent || listIds.length === 0 || !subject || !fromName || !fromEmail || !replyTo || !confirmationEmail || (sendMode === "schedule" && !scheduledDate)}
              >
                {sendMode === "schedule" ? "Review and schedule" : "Review and send"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={savingDraft || !htmlContent || listIds.length === 0 || !subject || !fromName || !fromEmail || !replyTo}
                onClick={() => void handleSaveAsDraft()}
              >
                {savingDraft ? "Saving…" : "Save as draft"}
              </Button>
              <Button asChild variant="secondary">
                <a href="/campaigns">Cancel</a>
              </Button>
            </div>
          )}
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

      {/* Unlayer editor overlay */}
      {editorOpen ? (
        <UnlayerEditor
          initialDesign={designJson}
          onSave={(data) => {
            setDesignJson(data.designJson);
            setHtmlContent(data.html);
            setFileName("Email designed");
            setEditorOpen(false);
          }}
          onClose={() => setEditorOpen(false)}
          saveLabel="Use this design"
        />
      ) : null}

      {/* Template picker modal */}
      {templatePickerOpen ? (
        <TemplatePicker
          templates={savedTemplates}
          onSelect={(template) => {
            setDesignJson(template.designJson);
            setTemplatePickerOpen(false);
            setEditorOpen(true);
          }}
          onClose={() => setTemplatePickerOpen(false)}
        />
      ) : null}
    </div>
  );
}

function TemplatePicker({
  templates,
  onSelect,
  onClose,
}: {
  templates: CommunityTemplate[];
  onSelect: (template: CommunityTemplate) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      <div className="mx-4 w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#e2e8f0] px-5 py-4">
          <h3 className="text-[16px] font-semibold text-[#0f172a]">Choose a template</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-[#94a3b8] hover:text-[#334155]"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5" aria-hidden="true">
              <path d="m4 4 8 8M12 4l-8 8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4">
          {templates.length === 0 ? (
            <p className="py-8 text-center text-[14px] text-[#64748b]">
              No templates saved yet. Create one from the Templates page first.
            </p>
          ) : (
            <div className="grid gap-3">
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => onSelect(template)}
                  className="flex items-center gap-4 rounded-lg border border-[#e2e8f0] p-3 text-left transition hover:border-[#2563eb] hover:bg-[#f8fafc]"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded border border-[#e2e8f0] bg-[#f8fafc]">
                    {template.htmlPreview ? (
                      <iframe
                        srcDoc={template.htmlPreview}
                        title={template.name}
                        className="pointer-events-none absolute left-0 top-0 h-[600px] w-[400px] origin-top-left"
                        style={{ transform: "scale(0.04)" }}
                        sandbox=""
                        tabIndex={-1}
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center text-[9px] text-[#94a3b8]">
                        Tmpl
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium text-[#0f172a]">{template.name}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
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

function ListMultiSelect({
  lists,
  selected,
  onChange,
}: {
  lists: { listId: string; name: string; subscriberCount: number | null }[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const allSelected = selected.length === lists.length;
  const someSelected = selected.length > 0 && !allSelected;

  const triggerLabel = allSelected
    ? "All lists"
    : selected.length === 0
      ? "Select lists…"
      : selected.length === 1
        ? (lists.find((l) => l.listId === selected[0])?.name ?? "1 list")
        : `${selected.length} lists selected`;

  const totalSelected = lists
    .filter((l) => selected.includes(l.listId))
    .reduce((sum, l) => sum + (l.subscriberCount ?? 0), 0);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center justify-between rounded-md border px-3 py-2 text-[14px] transition focus:outline-none focus:ring-2 focus:ring-[#2563eb]",
          open ? "border-[#2563eb] ring-2 ring-[#2563eb]" : "border-[#e2e8f0]",
          selected.length === 0 ? "text-[#94a3b8]" : "text-[#0f172a]"
        )}
      >
        <span>{triggerLabel}</span>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4 shrink-0 text-[#94a3b8]">
          <path d="m4 6 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open ? (
        <div className="absolute z-20 mt-1 w-full rounded-md border border-[#e2e8f0] bg-white shadow-md">
          {/* Select all row */}
          <label className="flex cursor-pointer items-center gap-3 border-b border-[#e2e8f0] px-3 py-2.5 hover:bg-[#f8fafc]">
            <input
              type="checkbox"
              className="accent-[#2563eb]"
              checked={allSelected}
              ref={(el) => { if (el) el.indeterminate = someSelected; }}
              onChange={(e) => onChange(e.target.checked ? lists.map((l) => l.listId) : [])}
            />
            <span className="text-[13px] font-semibold text-[#334155]">All lists</span>
            <span className="ml-auto text-[12px] text-[#94a3b8]">
              {lists.reduce((s, l) => s + (l.subscriberCount ?? 0), 0).toLocaleString()} subscribers
            </span>
          </label>

          {/* Individual lists */}
          {lists.map((list) => (
            <label key={list.listId} className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-[#f8fafc]">
              <input
                type="checkbox"
                className="accent-[#2563eb]"
                checked={selected.includes(list.listId)}
                onChange={(e) =>
                  onChange(
                    e.target.checked
                      ? [...selected, list.listId]
                      : selected.filter((id) => id !== list.listId)
                  )
                }
              />
              <span className="min-w-0 flex-1 truncate text-[13px] text-[#0f172a]">{list.name}</span>
              {list.subscriberCount != null ? (
                <span className="ml-auto shrink-0 text-[12px] text-[#94a3b8]">
                  {list.subscriberCount.toLocaleString()}
                </span>
              ) : null}
            </label>
          ))}

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-[#e2e8f0] px-3 py-2">
            <span className="text-[12px] text-[#64748b]">
              {selected.length === 0
                ? "No lists selected"
                : `${totalSelected.toLocaleString()} recipients`}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[12px] font-medium text-[#2563eb] hover:underline"
            >
              Done
            </button>
          </div>
        </div>
      ) : null}

      {/* Recipient count hint below the trigger */}
      {selected.length > 0 && !open ? (
        <p className="mt-1.5 text-[13px] text-[#64748b]">
          {totalSelected.toLocaleString()} recipients across {selected.length} list{selected.length === 1 ? "" : "s"}
        </p>
      ) : null}
    </div>
  );
}

function ConfirmRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: "warning";
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[var(--app-divider)] pb-2 last:border-0 last:pb-0">
      <span className="shrink-0 text-[13px] text-[#64748b]">{label}</span>
      <span
        className={cn(
          "text-right text-[14px] font-medium",
          highlight === "warning" ? "text-[#b91c1c]" : "text-[#0f172a]"
        )}
      >
        {value}
      </span>
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
