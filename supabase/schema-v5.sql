-- MOUAU FreshStart Schema v5
-- Forum redesign + Events management + Admin notifications
-- Run in Supabase SQL Editor

SET search_path TO public;

-- ==========================================
-- 1. FORUM POST LIKES (for upvote tracking)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.forum_post_likes (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id     TEXT        NOT NULL,
  student_id  TEXT        NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, student_id)
);
ALTER TABLE public.forum_post_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_all_post_likes" ON public.forum_post_likes;
CREATE POLICY "public_all_post_likes" ON public.forum_post_likes FOR ALL USING (true) WITH CHECK (true);

-- Add like_count to forum_posts if not present
ALTER TABLE public.forum_posts ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;
ALTER TABLE public.forum_posts ADD COLUMN IF NOT EXISTS author_id TEXT DEFAULT '';

-- ==========================================
-- 2. FORUM REPORTS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.forum_reports (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id     TEXT        NOT NULL,
  reporter_id TEXT        NOT NULL,
  reason      TEXT        NOT NULL DEFAULT 'spam',
  details     TEXT        DEFAULT '',
  status      TEXT        DEFAULT 'pending',  -- pending | reviewed | dismissed
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.forum_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_all_reports" ON public.forum_reports;
CREATE POLICY "public_all_reports" ON public.forum_reports FOR ALL USING (true) WITH CHECK (true);

-- ==========================================
-- 3. BANNED USERS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.banned_users (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id   TEXT        NOT NULL,
  student_name TEXT        DEFAULT '',
  reason       TEXT        DEFAULT '',
  banned_by    TEXT        DEFAULT 'Admin',
  banned_at    TIMESTAMPTZ DEFAULT NOW(),
  expires_at   TIMESTAMPTZ,
  active       BOOLEAN     DEFAULT TRUE,
  UNIQUE(student_id)
);
ALTER TABLE public.banned_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_all_banned" ON public.banned_users;
CREATE POLICY "public_all_banned" ON public.banned_users FOR ALL USING (true) WITH CHECK (true);

-- ==========================================
-- 4. ADMIN NOTIFICATIONS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  type       TEXT        NOT NULL DEFAULT 'info',  -- report | new_post | new_user | info
  title      TEXT        NOT NULL DEFAULT '',
  body       TEXT        DEFAULT '',
  data       JSONB       DEFAULT '{}',
  read       BOOLEAN     DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_all_admin_notifs" ON public.admin_notifications;
CREATE POLICY "public_all_admin_notifs" ON public.admin_notifications FOR ALL USING (true) WITH CHECK (true);

-- ==========================================
-- 5. CAMPUS EVENTS (ensure table exists)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.campus_events (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT        NOT NULL,
  description TEXT        DEFAULT '',
  location    TEXT        DEFAULT '',
  event_date  TIMESTAMPTZ NOT NULL,
  category    TEXT        DEFAULT 'general',
  organizer   TEXT        DEFAULT '',
  important   BOOLEAN     DEFAULT FALSE,
  active      BOOLEAN     DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.campus_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_all_events" ON public.campus_events;
CREATE POLICY "public_all_events" ON public.campus_events FOR ALL USING (true) WITH CHECK (true);

-- ==========================================
-- 6. NOTIFICATIONS (ensure columns)
-- ==========================================
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS actor TEXT DEFAULT '';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS post_id TEXT DEFAULT '';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT FALSE;

-- ==========================================
-- 7. FORUM COMMENT LIKES (deduplicate)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.forum_comment_likes (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id TEXT        NOT NULL,
  student_id TEXT        NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, student_id)
);
ALTER TABLE public.forum_comment_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_all_comment_likes" ON public.forum_comment_likes;
CREATE POLICY "public_all_comment_likes" ON public.forum_comment_likes FOR ALL USING (true) WITH CHECK (true);

-- ==========================================
-- 8. FORUM COMMENTS (ensure columns)
-- ==========================================
ALTER TABLE public.forum_comments ADD COLUMN IF NOT EXISTS author_id TEXT DEFAULT '';
ALTER TABLE public.forum_comments ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;
ALTER TABLE public.forum_comments ADD COLUMN IF NOT EXISTS reply_count INTEGER DEFAULT 0;

-- ==========================================
-- 9. FORUM COMMENT REPLIES (ensure table)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.forum_comment_replies (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id  UUID        NOT NULL,
  post_id     TEXT        NOT NULL DEFAULT '',
  author      TEXT        NOT NULL DEFAULT '',
  avatar      TEXT        NOT NULL DEFAULT '',
  author_id   TEXT        DEFAULT '',
  body        TEXT        NOT NULL DEFAULT '',
  like_count  INTEGER     DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.forum_comment_replies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_all_replies" ON public.forum_comment_replies;
CREATE POLICY "public_all_replies" ON public.forum_comment_replies FOR ALL USING (true) WITH CHECK (true);

-- ==========================================
-- 10. STUDENTS: ensure avatar_url exists
-- ==========================================
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '';
