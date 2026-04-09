-- Supabase Storage bucket for campaign HTML uploads
-- Run this once in the Supabase dashboard SQL editor or via migration.
--
-- This bucket stores HTML files uploaded by school users when composing campaigns.
-- Files must be publicly accessible so Campaign Monitor can fetch them via URL.
-- The service role key is used to upload from the server-side API route.

-- 1. Create the public bucket
insert into storage.buckets (id, name, public)
values ('community-html-uploads', 'community-html-uploads', true)
on conflict (id) do nothing;

-- 2. Allow public read (GET) on all objects in the bucket
-- Campaign Monitor needs to fetch the HTML file without authentication.
create policy "Public read for campaign HTML"
  on storage.objects for select
  using (bucket_id = 'community-html-uploads');

-- 3. Allow service role to insert (upload) objects
-- The compose API route uses the service role key to upload.
-- No additional policy needed — service role bypasses RLS.

-- Note: files are namespaced by workspace_id/{timestamp}.html
-- There is no automated cleanup — old HTML files can be deleted manually
-- from the Supabase Storage dashboard or via a scheduled job after campaigns send.
