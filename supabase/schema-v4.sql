-- MOUAU FreshStart Schema v4
-- Run in Supabase SQL Editor

SET search_path TO public;

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id TEXT        NOT NULL,
  type         TEXT        NOT NULL DEFAULT 'info',
  title        TEXT        NOT NULL DEFAULT '',
  body         TEXT        DEFAULT '',
  post_id      TEXT        DEFAULT '',
  actor        TEXT        DEFAULT '',
  read         BOOLEAN     DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_all_notifications" ON public.notifications;
CREATE POLICY "public_all_notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);

-- Add author_id to forum_posts for notification routing
ALTER TABLE public.forum_posts ADD COLUMN IF NOT EXISTS author_id TEXT DEFAULT '';

-- Add avatar_url to students for profile photos
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '';
