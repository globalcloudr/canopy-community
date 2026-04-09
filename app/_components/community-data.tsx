"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { useProductShell } from "@/app/_components/product-shell";
import type { CommunityConnection, CommunityOverview } from "@/lib/community-schema";

type OverviewState = {
  overview: CommunityOverview | null;
  error: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function requestJson<T>(input: string, init?: RequestInit) {
  const token = await getAccessToken();
  if (!token) {
    throw new Error("Your workspace session is not available. Return to the portal and relaunch Community.");
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
    throw new Error(payload?.error || "Request failed.");
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
        setError("Choose a workspace to load Community.");
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
          setOverview(payload.overview);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load Community data.");
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
