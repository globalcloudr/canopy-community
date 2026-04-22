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
 * Replaces all existing activity_events rows for a specific draft with a
 * single fresh row.
 *
 * Uses the draftId as a stable key — it appears in every URL format we've
 * ever used, so a LIKE filter catches old rows regardless of how the URL
 * was structured when they were first inserted. This avoids duplicates when
 * the URL format changes and also ensures the event_url is always up to date.
 *
 * Swallows all failures — non-critical.
 */
export async function upsertPortalDraftActivity(
  event: PortalActivityEvent,
  draftId: string
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
    // 1. Delete any existing rows for this draft. The draftId appears in every
    //    URL format (old /campaigns/{id} and new /compose?draft={id}), so this
    //    catches stale rows regardless of when they were created.
    //    PostgREST LIKE uses SQL wildcards (%), not glob (*).
    const deleteUrl = new URL(`${supabaseUrl}/rest/v1/activity_events`);
    deleteUrl.searchParams.set("workspace_id", `eq.${event.workspace_id}`);
    deleteUrl.searchParams.set("product_key", `eq.${event.product_key}`);
    deleteUrl.searchParams.set("event_type", `eq.draft`);
    deleteUrl.searchParams.set("event_url", `like.%${draftId}%`);

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
