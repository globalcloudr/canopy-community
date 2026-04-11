"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { useProductShell } from "@/app/_components/product-shell";
import type { CommunityConnection, CommunityOverview, CommunityTemplate } from "@/lib/community-schema";

type OverviewState = {
  overview: CommunityOverview | null;
  error: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

function toUserMessage(message: string) {
  if (message.includes("CAMPAIGN_MONITOR_API_KEY") || message.includes("Campaign Monitor API access is not configured")) {
    return "This school's Campaign Monitor connection still needs to be finished in Settings.";
  }

  if (message.includes("workspaceId is required")) {
    return "Choose a school before continuing.";
  }

  if (message.includes("not enabled for the requested workspace") || message.includes("not enabled for any accessible workspaces")) {
    return "Canopy Community is not set up for this school yet.";
  }

  return message;
}

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function requestJson<T>(input: string, init?: RequestInit) {
  const token = await getAccessToken();
  if (!token) {
    throw new Error("Your session has expired. Return to Canopy and open Community again.");
  }

  const response = await fetch(input, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as { error?: string } & T | null;
  if (!response.ok) {
    throw new Error(toUserMessage(payload?.error || "Request failed."));
  }

  return payload as T;
}

export function useCommunityWorkspaceId() {
  const { activeWorkspace, loadingSession } = useProductShell();
  return {
    workspaceId: activeWorkspace?.id ?? null,
    loadingSession,
  };
}

export function useCommunityOverview(): OverviewState {
  const { workspaceId, loadingSession } = useCommunityWorkspaceId();
  const [overview, setOverview] = useState<CommunityOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (loadingSession) {
        return;
      }

      if (!workspaceId) {
        setOverview(null);
        setError("Choose a school before opening Community.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const payload = await requestJson<{ overview: CommunityOverview }>(
          `/api/community/overview?workspaceId=${encodeURIComponent(workspaceId)}`
        );

        if (!cancelled) {
          setOverview({
            ...payload.overview,
            syncError: payload.overview.syncError ? toUserMessage(payload.overview.syncError) : null,
          });
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? toUserMessage(loadError.message) : "We could not load your newsletter data.");
          setOverview(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [workspaceId, loadingSession, refreshKey]);

  return {
    overview,
    error,
    loading,
    refresh: async () => {
      setRefreshKey((value) => value + 1);
    },
  };
}

// ─── Templates ───────────────────────────────────────────────────────────────

type TemplatesState = {
  templates: CommunityTemplate[];
  error: string | null;
  loading: boolean;
  refresh: () => void;
};

export function useCommunityTemplates(): TemplatesState {
  const { workspaceId, loadingSession } = useCommunityWorkspaceId();
  const [templates, setTemplates] = useState<CommunityTemplate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (loadingSession) return;

      if (!workspaceId) {
        setTemplates([]);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const payload = await requestJson<{ templates: CommunityTemplate[] }>(
          `/api/community/templates?workspaceId=${encodeURIComponent(workspaceId)}`
        );

        if (!cancelled) {
          setTemplates(payload.templates);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Could not load templates.");
          setTemplates([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [workspaceId, loadingSession, refreshKey]);

  return {
    templates,
    error,
    loading,
    refresh: () => setRefreshKey((v) => v + 1),
  };
}

export async function createTemplate(input: {
  workspaceId: string;
  name: string;
  designJson: Record<string, unknown>;
  htmlPreview: string | null;
}) {
  return requestJson<{ template: CommunityTemplate }>(
    "/api/community/templates",
    { method: "POST", body: JSON.stringify(input) }
  );
}

export async function updateTemplate(
  templateId: string,
  input: {
    workspaceId: string;
    name?: string;
    designJson?: Record<string, unknown>;
    htmlPreview?: string | null;
  }
) {
  return requestJson<{ template: CommunityTemplate }>(
    `/api/community/templates/${encodeURIComponent(templateId)}`,
    { method: "PUT", body: JSON.stringify(input) }
  );
}

export async function deleteTemplate(workspaceId: string, templateId: string) {
  return requestJson<{ ok: boolean }>(
    `/api/community/templates/${encodeURIComponent(templateId)}?workspaceId=${encodeURIComponent(workspaceId)}`,
    { method: "DELETE" }
  );
}

// ─── Campaign Monitor connection ─────────────────────────────────────────────

export async function saveCampaignMonitorConnection(input: {
  workspaceId: string;
  clientId: string;
  apiKey?: string;
}) {
  return requestJson<{ connection: CommunityConnection }>(
    "/api/integrations/campaign-monitor",
    {
      method: "PUT",
      body: JSON.stringify(input),
    }
  );
}

export async function removeCampaignMonitorConnection(workspaceId: string) {
  return requestJson<{ ok: boolean }>(
    `/api/integrations/campaign-monitor?workspaceId=${encodeURIComponent(workspaceId)}`,
    {
      method: "DELETE",
    }
  );
}
