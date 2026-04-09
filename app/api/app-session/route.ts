import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getRequestAccess, toErrorResponse } from "@/lib/server-auth";

/**
 * GET /api/app-session
 *
 * Returns the server-backed workspace session for the authenticated user.
 * The product shell calls this on every load to resolve:
 *   - current user identity
 *   - accessible workspaces (filtered to only those with this product enabled)
 *   - active workspace (from ?workspace= param or first available)
 *   - platform operator flag
 *
 * PRODUCT_KEY must match the product registered in canopy-platform.
 * Community follows the standard Canopy entitlement rules here.
 */

// ─── Replace this with your product's key ────────────────────────────────────
const PRODUCT_KEY = "community_canopy";
// ─────────────────────────────────────────────────────────────────────────────

type OrganizationRow = {
  id: string;
  name: string | null;
  slug: string | null;
};

type EntitlementRow = {
  workspace_id?: string | null;
  organization_id?: string | null;
  org_id?: string | null;
  product_key?: string | null;
  status?: string | null;
  setup_state?: string | null;
};

function formatDisplayName(
  email: string | null | undefined,
  fullName: string | null | undefined
) {
  const value = fullName?.trim();
  if (value) return value;

  const normalizedEmail = email?.trim();
  if (!normalizedEmail) return "Canopy User";

  return normalizedEmail
    .split("@")[0]
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase environment variables are not configured.");
  }

  return { url, serviceRoleKey };
}

function canLaunchProduct(row: EntitlementRow) {
  if (row.product_key !== PRODUCT_KEY) return false;

  const status = row.status ?? "active";
  const setupState = row.setup_state ?? "ready";

  if (status === "paused" || status === "pilot") return false;
  if (setupState === "in_setup" || setupState === "blocked") return false;

  return true;
}

async function getEnabledWorkspaceIds() {
  const { url, serviceRoleKey } = getConfig();
  const serviceClient = createClient(url, serviceRoleKey);

  // Merge across all three possible id column names to handle legacy data
  const attempts = [
    { select: "organization_id,product_key,status,setup_state", column: "organization_id" },
    { select: "org_id,product_key,status,setup_state", column: "org_id" },
    { select: "workspace_id,product_key,status,setup_state", column: "workspace_id" },
  ] as const;

  const workspaceIds = new Set<string>();

  for (const attempt of attempts) {
    const { data, error } = await serviceClient
      .from("product_entitlements")
      .select(attempt.select)
      .eq("product_key", PRODUCT_KEY);

    if (error) {
      if (
        error.message.includes("product_entitlements") ||
        error.message.includes("workspace_id") ||
        error.message.includes("organization_id") ||
        error.message.includes("org_id")
      ) {
        continue;
      }
      throw new Error(error.message);
    }

    for (const row of ((data as EntitlementRow[] | null) ?? []).filter(canLaunchProduct)) {
      const id = row.workspace_id ?? row.organization_id ?? row.org_id ?? null;
      if (id) workspaceIds.add(id);
    }
  }

  return workspaceIds;
}

export async function GET(request: Request) {
  try {
    const requestedSlug =
      new URL(request.url).searchParams.get("workspace")?.trim() || null;

    const access = await getRequestAccess(request);
    const { url, serviceRoleKey } = getConfig();
    const serviceClient = createClient(url, serviceRoleKey);
    const enabledWorkspaceIds = await getEnabledWorkspaceIds();

    let rows: OrganizationRow[] = [];

    if (access.isPlatformOperator) {
      const { data, error } = await serviceClient
        .from("organizations")
        .select("id,name,slug")
        .order("name", { ascending: true });

      if (error) throw new Error(error.message);
      rows = (data as OrganizationRow[] | null) ?? [];
    } else {
      const workspaceIds = [
        ...new Set(access.memberships.map((m) => m.org_id)),
      ];
      if (workspaceIds.length > 0) {
        const { data, error } = await serviceClient
          .from("organizations")
          .select("id,name,slug")
          .in("id", workspaceIds)
          .order("name", { ascending: true });

        if (error) throw new Error(error.message);
        rows = (data as OrganizationRow[] | null) ?? [];
      }
    }

    const workspaces = rows
      .filter((row) => row.id && enabledWorkspaceIds.has(row.id))
      .filter((row) => row.id && row.slug)
      .map((row) => ({
        id: row.id,
        name: row.name?.trim() || row.slug!,
        slug: row.slug!,
      }));

    if (workspaces.length === 0) {
      return NextResponse.json(
        { error: "This product is not enabled for any accessible workspaces." },
        { status: 403 }
      );
    }

    const requestedWorkspace = requestedSlug
      ? workspaces.find((w) => w.slug === requestedSlug) ?? null
      : null;

    if (requestedSlug && !requestedWorkspace) {
      return NextResponse.json(
        { error: "This product is not enabled for the requested workspace." },
        { status: 403 }
      );
    }

    const activeWorkspace = requestedWorkspace ?? workspaces[0] ?? null;

    return NextResponse.json({
      user: {
        id: access.user.id,
        email: access.user.email ?? "",
        displayName: formatDisplayName(
          access.user.email,
          typeof access.user.user_metadata?.full_name === "string"
            ? access.user.user_metadata.full_name
            : typeof access.user.user_metadata?.name === "string"
              ? access.user.user_metadata.name
              : null
        ),
      },
      isPlatformOperator: access.isPlatformOperator,
      workspaces,
      activeWorkspace,
    });
  } catch (error) {
    return toErrorResponse(error, "Failed to load app session.");
  }
}
