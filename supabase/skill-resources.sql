-- ══════════════════════════════════════════════════════════
-- Skill Resources — lesson/class materials (video, text, file, link)
-- Run in Supabase SQL Editor
-- ══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.skill_resources (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  skill_id     UUID NOT NULL,                          -- references skills(id)
  class_id     UUID,                                   -- optional: link to a specific class
  title        TEXT NOT NULL DEFAULT '',
  type         TEXT NOT NULL DEFAULT 'text'            -- 'video' | 'text' | 'file' | 'link'
                CHECK (type IN ('video','text','file','link')),
  content      TEXT DEFAULT '',                        -- rich text body (for type=text)
  url          TEXT DEFAULT '',                        -- video/file/link URL
  thumbnail_url TEXT DEFAULT '',                       -- optional preview image
  description  TEXT DEFAULT '',
  sort_order   INTEGER DEFAULT 0,
  active       BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Fast lookups by skill
CREATE INDEX IF NOT EXISTS skill_resources_skill_idx ON public.skill_resources(skill_id);
CREATE INDEX IF NOT EXISTS skill_resources_class_idx ON public.skill_resources(class_id);

-- RLS — students read active resources; admin service role bypasses
ALTER TABLE public.skill_resources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_skill_resources"  ON public.skill_resources;
DROP POLICY IF EXISTS "service_all_skill_resources"  ON public.skill_resources;

-- Anyone can read active resources (students)
CREATE POLICY "public_read_skill_resources"
  ON public.skill_resources FOR SELECT
  USING (active = true);

-- Service role (admin API) bypasses RLS automatically
