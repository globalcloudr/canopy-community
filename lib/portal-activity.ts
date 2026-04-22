// Writes to the shared activity_events table in the Canopy platform Supabase
// project. That table powers the workspace nerve-center dashboard in the portal
// ("In progress", "Going out this week", "Recent").
//
// Failures are always swallowed — activity logging must never break the main
// Community flow. Call with void: `void logPortalActivity({...})`.

type PortalActivityEvent = {
  workspace_id: string;
  product_key: string;
  event_type: string;
  title: string;
  description?: string | null;
  metric?: string | null;
  event_url?: string | null;
  scheduled_for?: string | null;
};

export async function logPortalActivity(event: PortalActivityEvent): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return;

  try {
    await fetch(`${supabaseUrl}/rest/v1/activity_events`, {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(event),
    });
  } catch {
    // Non-critical — swallow silently
  }
}

/**
 * Replaces all existing draft activity_events rows for this workspace+product
 * with a single fresh row.
 *
 * We intentionally do NOT filter the DELETE by event_url — earlier versions
 * of this code (and the initial POST /drafts handler) could leave behind rows
 * where event_url was null or used a superseded URL format. An event_url
 * LIKE filter would skip those null rows entirely, leaving stale "Draft saved"
 * entries in the nerve center with no "Open →" link forever. Nuking all draft
 * rows for the workspace+product is safe here because the Community app only
 * surfaces a single in-progress draft at a time (the one just saved).
 *
 * Swallows all failures — non-critical.
 */
export async function upsertPortalDraftActivity(
  event: PortalActivityEvent,
  _draftId: string
): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return;

  const headers = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  };

  try {
    // 1. Delete ALL existing draft rows for this workspace+product, including
    //    any legacy rows where event_url is null. A LIKE filter on event_url
    //    would skip null-url rows and leak them forever.
    const deleteUrl = new URL(`${supabaseUrl}/rest/v1/activity_events`);
    deleteUrl.searchParams.set("workspace_id", `eq.${event.workspace_id}`);
    deleteUrl.searchParams.set("product_key", `eq.${event.product_key}`);
    deleteUrl.searchParams.set("event_type", `eq.draft`);

    await fetch(deleteUrl.toString(), { method: "DELETE", headers });

    // 2. Insert a fresh row with the current, correct event_url.
    await fetch(`${supabaseUrl}/rest/v1/activity_events`, {
      method: "POST",
      headers,
      body: JSON.stringify(event),
    });
  } catch {
    // Non-critical — swallow silently
  }
}
