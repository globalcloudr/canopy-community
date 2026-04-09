-- Supabase Storage bucket for campaign HTML uploads
-- Run this once in the Supabase dashboard SQL editor or via migration.
--
-- This bucket stores HTML files uploaded by school users when composing campaigns.
-- Files are PRIVATE — accessed only via short-lived signed URLs generated server-side.
-- Campaign Monitor fetches the HTML once at campaign creation time using the signed URL.
-- Files are deleted from storage immediately after CM confirms campaign creation.
-- The service role key is used to upload and delete from the server-side API route.

-- 1. Create a PRIVATE bucket (public: false)
insert into storage.buckets (id, name, public)
values ('community-html-uploads', 'community-html-uploads', false)
on conflict (id) do update set public = false;

-- 2. NO public read policy — bucket is private.
-- Signed URLs (generated server-side with service role) are used instead.
-- Signed URLs expire in 15 minutes, which is sufficient for Campaign Monitor
-- to fetch the HTML during campaign creation.

-- 3. Service role bypasses RLS entirely for upload and delete operations.
-- No additional policies are needed for server-side operations.

-- Note: Files are namespaced as {workspaceId}/{timestamp}.html and are
-- deleted immediately after successful Campaign Monitor campaign creation.
-- Storage should remain near-empty at all times.
