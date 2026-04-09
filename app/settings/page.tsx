"use client";

import { useEffect, useState } from "react";
import { BodyText, Button, Card, Input, Label } from "@canopy/ui";
import { ProductShell } from "@/app/_components/product-shell";
import { communityNavItems } from "@/app/_components/community-nav";
import {
  removeCampaignMonitorConnection,
  saveCampaignMonitorConnection,
  useCommunityOverview,
  useCommunityWorkspaceId,
} from "@/app/_components/community-data";
import { ConnectionSection } from "@/app/_components/community-sections";
import { EmptyState, PageIntro } from "@/app/_components/community-ui";

export default function SettingsPage() {
  return (
    <ProductShell activeNav="settings" navItems={communityNavItems}>
      <SettingsContent />
    </ProductShell>
  );
}

function SettingsContent() {
  const { workspaceId } = useCommunityWorkspaceId();
  const { overview, error, loading, refresh } = useCommunityOverview();
  const [clientId, setClientId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const sharedApiKeyConfigured = overview?.sharedApiKeyConfigured ?? false;
  const hasExistingApiAccess = Boolean(overview?.connection?.apiKeyConfigured);
  const canSave = Boolean(clientId.trim()) && (sharedApiKeyConfigured || hasExistingApiAccess || Boolean(apiKey.trim()));

  useEffect(() => {
    if (!overview?.connection) {
      setClientId("");
      return;
    }

    setClientId(overview.connection.clientId);
  }, [overview?.connection]);

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!workspaceId) {
      setSaveError("Choose a school before saving these settings.");
      return;
    }

    setSaving(true);
    setMessage(null);
    setSaveError(null);

    try {
      await saveCampaignMonitorConnection({
        workspaceId,
        clientId,
        apiKey,
      });
      setApiKey("");
      setMessage("Connection saved.");
      await refresh();
    } catch (saveConnectionError) {
      setSaveError(
        saveConnectionError instanceof Error
          ? saveConnectionError.message
          : "We could not save these settings."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    if (!workspaceId) {
      setSaveError("Choose a school before removing these settings.");
      return;
    }

    setRemoving(true);
    setMessage(null);
    setSaveError(null);

    try {
      await removeCampaignMonitorConnection(workspaceId);
      setClientId("");
      setApiKey("");
      setMessage("Connection removed.");
      await refresh();
    } catch (removeError) {
      setSaveError(
        removeError instanceof Error
          ? removeError.message
          : "We could not remove this connection."
      );
    } finally {
      setRemoving(false);
    }
  }

  return (
    <>
      <PageIntro
        eyebrow="Settings"
        title="Connect your school account"
        description="Add the Campaign Monitor Client ID for this school. If Canopy already has a shared API key, you can leave the API key field blank."
        actions={
          <Button variant="secondary" onClick={() => void refresh()} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </Button>
        }
      />

      {error ? <EmptyState title="We could not load your settings" body={error} /> : null}

      <ConnectionSection connection={overview?.connection ?? null} syncError={overview?.syncError ?? null} />

      <Card padding="md" className="rounded-[28px] border border-[var(--app-surface-border)] bg-white shadow-none">
        <div className="border-b border-[var(--app-divider)] pb-5">
          <h2 className="text-[1.25rem] font-semibold tracking-[-0.03em] text-[#0f172a]">
            Campaign Monitor connection
          </h2>
          <p className="mt-1 max-w-2xl text-[14px] leading-6 text-[#617284]">
            We check the connection with Campaign Monitor before saving.
            {sharedApiKeyConfigured
              ? " A shared Canopy API key is already set up, so the API key field below is optional."
              : " Add a shared CAMPAIGN_MONITOR_API_KEY on the server, or enter a school-specific API key below."}
          </p>
        </div>

        <form className="grid gap-5 pt-5 md:max-w-2xl" onSubmit={(event) => void handleSave(event)}>
          <div className="grid gap-2">
            <Label htmlFor="clientId">Client ID</Label>
            <Input
              id="clientId"
              value={clientId}
              onChange={(event) => setClientId(event.target.value)}
              placeholder="Paste the school's Client ID"
              autoComplete="off"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="apiKey">
              {sharedApiKeyConfigured ? "API key override (optional)" : "API key"}
            </Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder={
                sharedApiKeyConfigured
                  ? "Optional school-specific API key"
                  : overview?.connection
                    ? "Enter a new API key"
                    : "Paste the Campaign Monitor API key"
              }
              autoComplete="off"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={saving || !canSave}>
              {saving ? "Checking…" : "Save"}
            </Button>
            {overview?.connection ? (
              <Button
                type="button"
                variant="secondary"
                disabled={removing}
                onClick={() => void handleRemove()}
              >
                {removing ? "Removing…" : "Remove"}
              </Button>
            ) : null}
          </div>

          {message ? <BodyText className="text-[#0f766e]">{message}</BodyText> : null}
          {saveError ? <BodyText className="text-[#b42318]">{saveError}</BodyText> : null}
        </form>
      </Card>
    </>
  );
}
