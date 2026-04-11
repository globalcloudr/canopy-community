"use client";

import { useRef, useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@canopy/ui";
import type { EditorRef } from "react-email-editor";

const EmailEditor = dynamic(() => import("react-email-editor"), { ssr: false });

type UnlayerEditorProps = {
  initialDesign: Record<string, unknown> | null;
  onSave: (data: { designJson: Record<string, unknown>; html: string }) => void;
  onClose: () => void;
  saveLabel?: string;
};

export function UnlayerEditor({
  initialDesign,
  onSave,
  onClose,
  saveLabel = "Save",
}: UnlayerEditorProps) {
  const editorRef = useRef<EditorRef>(null);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleReady = useCallback(() => {
    if (initialDesign && editorRef.current?.editor) {
      editorRef.current.editor.loadDesign(initialDesign as never);
    }
    setReady(true);
  }, [initialDesign]);

  function handleSave() {
    const editor = editorRef.current?.editor;
    if (!editor || saving) return;

    setSaving(true);
    editor.exportHtml((data) => {
      onSave({
        designJson: data.design as unknown as Record<string, unknown>,
        html: data.html,
      });
      setSaving(false);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Toolbar */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#e2e8f0] px-4">
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          <span className="flex items-center gap-1.5">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4" aria-hidden="true">
              <path d="M10 12 6 8l4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </span>
        </Button>

        <Button
          variant="primary"
          onClick={handleSave}
          disabled={!ready || saving}
        >
          {saving ? "Exporting…" : saveLabel}
        </Button>
      </div>

      {/* Editor */}
      <div className="min-h-0 flex-1">
        <EmailEditor
          ref={editorRef}
          onReady={handleReady}
          minHeight="100%"
          options={{
            features: {
              undoRedo: true,
              textEditor: { tables: true },
            },
            appearance: { theme: "light" },
          }}
        />
      </div>
    </div>
  );
}
