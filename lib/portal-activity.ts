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
 * Upserts an activity_events row for a draft save.
 *
 * On update (PATCH): updates title/description on the existing row matched by
 * workspace_id + event_url, using `return=representation` so we can count how
 * many rows were affected.
 * On create (POST): if no row matched (draft was saved before this fix shipped,
 * or first save ever), inserts a fresh row so the draft appears in the Portal.
 *
 * Swallows all failures — non-critical.
 */
export async function upsertPortalDraftActivity(event: PortalActivityEvent): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey || !event.event_url) return;

  const headers = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
  };

  try {
    // 1. Try to update any existing row for this draft URL.
    const patchUrl = new URL(`${supabaseUrl}/rest/v1/activity_events`);
    patchUrl.searchParams.set("workspace_id", `eq.${event.workspace_id}`);
    patchUrl.searchParams.set("event_url", `eq.${event.event_url}`);

    const patchRes = await fetch(patchUrl.toString(), {
      method: "PATCH",
      headers: { ...headers, Prefer: "return=representation" },
      body: JSON.stringify({ title: event.title, description: event.description ?? null }),
    });

    if (patchRes.ok) {
      const updated = await patchRes.json() as unknown[];
      if (updated.length > 0) return; // existing row updated — done
    }

    // 2. No existing row — insert one so the draft appears in the Portal.
    await fetch(`${supabaseUrl}/rest/v1/activity_events`, {
      method: "POST",
      headers: { ...headers, Prefer: "return=minimal" },
      body: JSON.stringify(event),
    });
  } catch {
    // Non-critical — swallow silently
  }
}
