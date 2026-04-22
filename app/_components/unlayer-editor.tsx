"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Button } from "@globalcloudr/canopy-ui";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  // Start with a reasonable default so the editor isn't 0px on first render.
  const [editorHeight, setEditorHeight] = useState(600);

  // Measure the container and keep the editor iframe sized to match exactly.
  // react-email-editor uses the minHeight prop to size its iframe — percentage
  // values don't resolve reliably against flex-computed heights, so we measure
  // and pass an explicit pixel value instead.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const h = Math.floor(entry.contentRect.height);
      if (h > 0) setEditorHeight(h);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--rule)] px-4">
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          <span className="flex items-center gap-1.5">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4" aria-hidden="true">
              <path d="M10 12 6 8l4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </span>
        </Button>

        <Button
          variant="accent"
          onClick={handleSave}
          disabled={!ready || saving}
        >
          {saving ? "Exporting…" : saveLabel}
        </Button>
      </div>

      {/* Editor — ref lets ResizeObserver measure the true pixel height so we
          can pass it as an explicit number to EmailEditor. Using a percentage
          here would not resolve reliably against a flex-computed height. */}
      <div ref={containerRef} className="flex-1 min-h-0">
        <EmailEditor
          ref={editorRef}
          onReady={handleReady}
          minHeight={editorHeight}
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
