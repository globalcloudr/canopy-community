"use client";

import { useState } from "react";
import { Button } from "@canopy/ui";
import { cn } from "@canopy/ui";
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
import { PageHeader, EmptyState, formatCompactDateTime } from "@/app/_components/community-ui";
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

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CommunityTemplate | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function handleNewTemplate() {
    setEditingTemplate(null);
    setEditorOpen(true);
  }

  function handleEditTemplate(template: CommunityTemplate) {
    setEditingTemplate(template);
    setEditorOpen(true);
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
          description="Create and manage reusable email designs for your newsletters."
          actions={
            <Button variant="primary" onClick={handleNewTemplate}>
              New template
            </Button>
          }
        />

        {error ? <EmptyState title="Could not load templates" body={error} /> : null}

        {actionError ? (
          <p className="rounded-lg border border-[#fca5a5] bg-[#fef2f2] px-4 py-3 text-[14px] text-[#b91c1c]">
            {actionError}
          </p>
        ) : null}

        {!error && !loading && templates.length === 0 ? (
          <EmptyState
            title="No templates yet"
            body="Create your first template to start designing reusable email layouts."
          />
        ) : null}

        {templates.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onEdit={() => handleEditTemplate(template)}
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
              Are you sure you want to delete this template? This cannot be undone.
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
          saveLabel={editingTemplate ? "Save template" : "Create template"}
        />
      ) : null}
    </>
  );
}

function TemplateCard({
  template,
  onEdit,
  onDuplicate,
  onDeleteRequest,
}: {
  template: CommunityTemplate;
  onEdit: () => void;
  onDuplicate: () => void;
  onDeleteRequest: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="group relative rounded-lg border border-[#e2e8f0] bg-white transition hover:shadow-md">
      {/* Thumbnail */}
      <button
        type="button"
        onClick={onEdit}
        className="block w-full cursor-pointer"
      >
        <div className="relative h-44 w-full overflow-hidden rounded-t-lg border-b border-[#e2e8f0] bg-[#f8fafc]">
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
      <div className="flex items-center gap-2 px-3.5 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-medium text-[#0f172a]">{template.name}</p>
          <p className="mt-0.5 text-[12px] text-[#94a3b8]">
            Updated {formatCompactDateTime(template.updatedAt)}
          </p>
        </div>

        {/* Actions menu */}
        <div className="relative">
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
                <MenuButton onClick={() => { setMenuOpen(false); onEdit(); }}>
                  Edit
                </MenuButton>
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
    </div>
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
