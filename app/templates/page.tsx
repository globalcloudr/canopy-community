"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@globalcloudr/canopy-ui";
import { cn } from "@globalcloudr/canopy-ui";
import { ProductShell } from "@/app/_components/product-shell";
import { communityNavItems } from "@/app/_components/community-nav";
import {
  useCommunityTemplates,
  useCommunityWorkspaceId,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "@/app/_components/community-data";
import { UnlayerEditor } from "@/app/_components/unlayer-editor";
import { PageHeader, EmptyState, formatCompactDateTime, formatShortDate } from "@/app/_components/community-ui";
import type { CommunityTemplate } from "@/lib/community-schema";

export default function TemplatesPage() {
  return (
    <ProductShell activeNav="templates" navItems={communityNavItems}>
      <TemplatesContent />
    </ProductShell>
  );
}

function TemplatesContent() {
  const { workspaceId } = useCommunityWorkspaceId();
  const { templates, error, loading, refresh } = useCommunityTemplates();
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CommunityTemplate | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function handleNewTemplate() {
    setEditingTemplate(null);
    setEditorOpen(true);
  }

  async function handleHtmlUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!workspaceId || !file) return;

    setActionError(null);

    try {
      const html = await file.text();
      const name = file.name.replace(/\.(html?|HTML?)$/, "") || "Uploaded template";

      await createTemplate({
        workspaceId,
        name,
        designJson: {},
        htmlPreview: html,
      });

      refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to upload template.");
    } finally {
      event.target.value = "";
    }
  }

  function handleEditTemplate(template: CommunityTemplate) {
    if (!isEditorTemplate(template)) {
      return;
    }
    setEditingTemplate(template);
    setEditorOpen(true);
  }

  async function handleRename(templateId: string, newName: string) {
    if (!workspaceId || !newName.trim()) {
      setRenamingId(null);
      return;
    }
    setActionError(null);
    try {
      await updateTemplate(templateId, { workspaceId, name: newName.trim() });
      refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to rename template.");
    } finally {
      setRenamingId(null);
    }
  }

  async function handleDuplicate(template: CommunityTemplate) {
    if (!workspaceId) return;
    setActionError(null);
    try {
      await createTemplate({
        workspaceId,
        name: `${template.name} (copy)`,
        designJson: template.designJson,
        htmlPreview: template.htmlPreview,
      });
      refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to duplicate template.");
    }
  }

  async function handleDelete(templateId: string) {
    if (!workspaceId) return;
    setActionError(null);
    try {
      await deleteTemplate(workspaceId, templateId);
      setDeleteConfirmId(null);
      refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to delete template.");
    }
  }

  async function handleEditorSave(data: { designJson: Record<string, unknown>; html: string }) {
    if (!workspaceId) return;
    setSaving(true);
    setActionError(null);

    try {
      if (editingTemplate) {
        await updateTemplate(editingTemplate.id, {
          workspaceId,
          designJson: data.designJson,
          htmlPreview: data.html,
        });
      } else {
        await createTemplate({
          workspaceId,
          name: "Untitled template",
          designJson: data.designJson,
          htmlPreview: data.html,
        });
      }
      setEditorOpen(false);
      setEditingTemplate(null);
      refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to save template.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Templates"
          description="Save reusable newsletter layouts your team can start from again and again."
          actions={
            <div className="flex flex-wrap gap-3">
              <input
                ref={uploadInputRef}
                type="file"
                accept=".html,.htm"
                className="hidden"
                onChange={(event) => void handleHtmlUpload(event)}
              />
              <Button variant="secondary" onClick={() => uploadInputRef.current?.click()}>
                Upload HTML
              </Button>
              <Button variant="primary" onClick={handleNewTemplate}>
                New template
              </Button>
            </div>
          }
        />

        <div className="grid gap-3 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-5 py-4 text-[14px] text-[#475569] sm:grid-cols-3">
          <div>
            <p className="font-semibold text-[#0f172a]">Build in the editor</p>
            <p className="mt-1 leading-6">Create drag-and-drop layouts your staff can reuse.</p>
          </div>
          <div>
            <p className="font-semibold text-[#0f172a]">Upload existing HTML</p>
            <p className="mt-1 leading-6">Bring in approved email layouts you already use today.</p>
          </div>
          <div>
            <p className="font-semibold text-[#0f172a]">Start faster</p>
            <p className="mt-1 leading-6">Saved templates show up when you create a new campaign.</p>
          </div>
        </div>

        {error ? <EmptyState title="We could not load your templates" body={error} /> : null}

        {actionError ? (
          <p className="rounded-lg border border-[#fca5a5] bg-[#fef2f2] px-4 py-3 text-[14px] text-[#b91c1c]">
            {actionError}
          </p>
        ) : null}

        {!error && !loading && templates.length === 0 ? (
          <EmptyState
            title="No templates yet"
            body="Create your first template or upload an HTML file to build your school's template library."
          />
        ) : null}

        {templates.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                renaming={renamingId === template.id}
                onEdit={() => handleEditTemplate(template)}
                onRename={() => setRenamingId(template.id)}
                onRenameSubmit={(name) => void handleRename(template.id, name)}
                onDuplicate={() => void handleDuplicate(template)}
                onDeleteRequest={() => setDeleteConfirmId(template.id)}
              />
            ))}
          </div>
        ) : null}

        {/* Delete confirmation */}
        {deleteConfirmId ? (
          <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-5">
            <p className="text-[14px] text-[#334155]">
              Delete this template from your school's library? This cannot be undone.
            </p>
            <div className="mt-4 flex gap-3">
              <Button
                variant="primary"
                onClick={() => void handleDelete(deleteConfirmId)}
                className="bg-[#dc2626] hover:bg-[#b91c1c]"
              >
                Delete
              </Button>
              <Button variant="secondary" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      {editorOpen ? (
        <UnlayerEditor
          initialDesign={editingTemplate?.designJson ?? null}
          onSave={(data) => void handleEditorSave(data)}
          onClose={() => { setEditorOpen(false); setEditingTemplate(null); }}
          saveLabel={editingTemplate ? "Save changes" : "Save template"}
        />
      ) : null}
    </>
  );
}

function TemplateCard({
  template,
  renaming,
  onEdit,
  onRename,
  onRenameSubmit,
  onDuplicate,
  onDeleteRequest,
}: {
  template: CommunityTemplate;
  renaming: boolean;
  onEdit: () => void;
  onRename: () => void;
  onRenameSubmit: (name: string) => void;
  onDuplicate: () => void;
  onDeleteRequest: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [renameValue, setRenameValue] = useState(template.name);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const editable = isEditorTemplate(template);
  const templateTypeLabel = editable ? "Built in editor" : "Uploaded HTML";
  const templateTypeTone = editable
    ? "border-[#dbeafe] bg-[#eff6ff] text-[#1d4ed8]"
    : "border-[#d1fae5] bg-[#ecfdf5] text-[#047857]";

  useEffect(() => {
    if (renaming) {
      setRenameValue(template.name);
      // Focus the input after render
      setTimeout(() => renameInputRef.current?.select(), 0);
    }
  }, [renaming, template.name]);

  return (
    <>
    <div className="group relative w-full max-w-full rounded-lg border border-[#e2e8f0] bg-white transition hover:-translate-y-0.5 hover:shadow-md">
      {/* Thumbnail */}
      <button
        type="button"
        onClick={() => setPreviewOpen(true)}
        className="block w-full cursor-pointer"
      >
        <div className="relative h-36 w-full overflow-hidden rounded-t-lg border-b border-[#e2e8f0] bg-[#f8fafc]">
          {template.htmlPreview ? (
            <iframe
              srcDoc={template.htmlPreview}
              title={template.name}
              className="pointer-events-none absolute left-0 top-0 h-[800px] w-[600px] origin-top-left"
              style={{ transform: "scale(0.28)" }}
              sandbox=""
              tabIndex={-1}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-[12px] uppercase tracking-[0.14em] text-[#94a3b8]">
                No preview
              </span>
            </div>
          )}
        </div>
      </button>

      {/* Info */}
      <div className="space-y-3 px-3.5 py-3">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
          {renaming ? (
            <form
              onSubmit={(e) => { e.preventDefault(); onRenameSubmit(renameValue); }}
            >
              <input
                ref={renameInputRef}
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={() => onRenameSubmit(renameValue)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") onRenameSubmit(template.name);
                }}
                className="w-full rounded border border-[#2563eb] px-1.5 py-0.5 text-[14px] font-medium text-[#0f172a] outline-none ring-1 ring-[#2563eb]"
              />
            </form>
          ) : (
            <p className="overflow-hidden text-[14px] font-medium leading-5 text-[#0f172a] [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]">
              {template.name}
            </p>
          )}
          </div>

          {/* Actions menu */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-md p-1.5 text-[#94a3b8] transition hover:bg-[#f1f5f9] hover:text-[#334155]"
            >
              <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                <circle cx="8" cy="3" r="1.5" />
                <circle cx="8" cy="8" r="1.5" />
                <circle cx="8" cy="13" r="1.5" />
              </svg>
            </button>

            {menuOpen ? (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 z-20 mt-1 w-36 rounded-md border border-[#e2e8f0] bg-white py-1 shadow-lg">
                  <MenuButton onClick={() => { setMenuOpen(false); onRename(); }}>
                    Rename
                  </MenuButton>
                  {editable ? (
                    <MenuButton onClick={() => { setMenuOpen(false); onEdit(); }}>
                      Edit layout
                    </MenuButton>
                  ) : null}
                  <MenuButton onClick={() => { setMenuOpen(false); onDuplicate(); }}>
                    Duplicate
                  </MenuButton>
                  <MenuButton onClick={() => { setMenuOpen(false); onDeleteRequest(); }} destructive>
                    Delete
                  </MenuButton>
                </div>
              </>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-semibold", templateTypeTone)}>
            {templateTypeLabel}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-[12px] text-[#94a3b8]">
            Updated {formatShortDate(template.updatedAt)}
          </span>
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="shrink-0 rounded-md border border-[#d9e3ef] px-3 py-1.5 text-[13px] font-medium text-[#334155] transition hover:border-[#bfd3ea] hover:bg-[#f8fafc]"
          >
            Preview
          </button>
        </div>
      </div>
    </div>
      {previewOpen ? (
        <TemplatePreviewModal
          template={template}
          onClose={() => setPreviewOpen(false)}
          onEdit={editable ? () => { setPreviewOpen(false); onEdit(); } : undefined}
        />
      ) : null}
    </>
  );
}

function MenuButton({
  children,
  onClick,
  destructive,
}: {
  children: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full px-3 py-1.5 text-left text-[13px] transition hover:bg-[#f1f5f9]",
        destructive ? "text-[#dc2626]" : "text-[#334155]"
      )}
    >
      {children}
    </button>
  );
}

function TemplatePreviewModal({
  template,
  onClose,
  onEdit,
}: {
  template: CommunityTemplate;
  onClose: () => void;
  onEdit?: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#e2e8f0] px-5 py-4">
          <div>
            <h3 className="text-[16px] font-semibold text-[#0f172a]">{template.name}</h3>
            <p className="mt-1 text-[13px] text-[#64748b]">
              {isEditorTemplate(template) ? "Built in editor" : "Uploaded HTML"} • Updated {formatCompactDateTime(template.updatedAt)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {onEdit ? (
              <Button variant="secondary" onClick={onEdit}>
                Edit layout
              </Button>
            ) : null}
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden bg-[#f8fafc] p-4">
          {template.htmlPreview ? (
            <iframe
              srcDoc={template.htmlPreview}
              title={template.name}
              className="h-full w-full rounded-lg border border-[#e2e8f0] bg-white"
              sandbox="allow-same-origin"
            />
          ) : (
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-[#cbd5e1] bg-white text-[14px] text-[#64748b]">
              No preview available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function isEditorTemplate(template: CommunityTemplate) {
  return Object.keys(template.designJson ?? {}).length > 0;
}
