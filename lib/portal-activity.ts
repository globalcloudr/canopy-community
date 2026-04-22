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
 * Updates an existing activity_events row identified by workspace_id + event_url.
 * Used when re-saving a draft so the portal reflects the latest title/description
 * without creating a duplicate "In progress" entry.
 * Swallows failures — non-critical.
 */
export async function updatePortalActivityByUrl(
  workspaceId: string,
  eventUrl: string,
  patch: { title?: string; description?: string | null }
): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return;

  try {
    const url = new URL(`${supabaseUrl}/rest/v1/activity_events`);
    url.searchParams.set("workspace_id", `eq.${workspaceId}`);
    url.searchParams.set("event_url", `eq.${eventUrl}`);

    await fetch(url.toString(), {
      method: "PATCH",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(patch),
    });
  } catch {
    // Non-critical — swallow silently
  }
}
