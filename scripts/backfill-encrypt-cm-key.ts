/**
 * One-time backfill: encrypt existing plaintext Campaign Monitor api_key values
 * at rest. Safe to re-run (already-encrypted / empty values are skipped).
 *
 * Usage (from the canopy-community repo root):
 *   NEXT_PUBLIC_SUPABASE_URL=... \
 *   SUPABASE_SERVICE_ROLE_KEY=... \
 *   SECRETS_ENCRYPTION_KEY=... \
 *   npx tsx scripts/backfill-encrypt-cm-key.ts
 *
 * Run AFTER deploying the encrypted read/write code and setting
 * SECRETS_ENCRYPTION_KEY on Vercel.
 */
import { createClient } from "@supabase/supabase-js";
import { encryptSecret, isEncrypted } from "../lib/secret-crypto";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) throw new Error("Supabase env vars are required.");
  if (!process.env.SECRETS_ENCRYPTION_KEY) throw new Error("SECRETS_ENCRYPTION_KEY is required.");

  const supabase = createClient(url, serviceRoleKey);
  const { data, error } = await supabase
    .from("community_campaign_monitor_connections")
    .select("workspace_id,api_key");
  if (error) throw new Error(error.message);

  let encrypted = 0;
  let skipped = 0;
  for (const row of data ?? []) {
    const r = row as { workspace_id: string; api_key: string | null };
    if (!r.api_key || isEncrypted(r.api_key)) {
      skipped += 1;
      continue;
    }
    const { error: updateError } = await supabase
      .from("community_campaign_monitor_connections")
      .update({ api_key: encryptSecret(r.api_key) })
      .eq("workspace_id", r.workspace_id);
    if (updateError) throw new Error(`Failed to update ${r.workspace_id}: ${updateError.message}`);
    encrypted += 1;
  }

  console.log(`Done. Encrypted ${encrypted} key(s), skipped ${skipped} (empty or already encrypted).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
