-- MOUAU FreshStart Schema v6
-- Dual student type system (Fresher + Returning)
-- Run in Supabase SQL Editor

SET search_path TO public;

-- ==========================================
-- 1. STUDENT TYPE COLUMNS
-- ==========================================
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS student_type TEXT DEFAULT 'fresher';
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS jamb_number TEXT DEFAULT '';
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS matric_number TEXT DEFAULT '';
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS semester TEXT DEFAULT '1st';
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS cgpa DECIMAL(3,2) DEFAULT 0.00;

-- Index for matric number login lookup
CREATE INDEX IF NOT EXISTS idx_students_matric ON public.students(matric_number) WHERE matric_number != '';
CREATE INDEX IF NOT EXISTS idx_students_jamb ON public.students(jamb_number) WHERE jamb_number != '';
CREATE INDEX IF NOT EXISTS idx_students_type ON public.students(student_type);

-- ==========================================
-- 2. CGPA / RESULTS TRACKING
-- ==========================================
CREATE TABLE IF NOT EXISTS public.student_cgpa (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id  TEXT        NOT NULL,
  session     TEXT        NOT NULL DEFAULT '',   -- e.g. "2023/2024"
  semester    TEXT        NOT NULL DEFAULT '1st', -- "1st" | "2nd"
  level       TEXT        NOT NULL DEFAULT '100',
  courses     JSONB       DEFAULT '[]',          -- [{code, title, units, grade, score}]
  gpa         DECIMAL(3,2) DEFAULT 0.00,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, session, semester)
);
ALTER TABLE public.student_cgpa ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_all_cgpa" ON public.student_cgpa;
CREATE POLICY "public_all_cgpa" ON public.student_cgpa FOR ALL USING (true) WITH CHECK (true);

-- ==========================================
-- 3. COURSE TRACKER
-- ==========================================
CREATE TABLE IF NOT EXISTS public.student_courses (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id  TEXT        NOT NULL,
  session     TEXT        NOT NULL DEFAULT '',
  semester    TEXT        NOT NULL DEFAULT '1st',
  level       TEXT        NOT NULL DEFAULT '100',
  code        TEXT        NOT NULL DEFAULT '',
  title       TEXT        NOT NULL DEFAULT '',
  units       INTEGER     NOT NULL DEFAULT 2,
  lecturer    TEXT        DEFAULT '',
  day         TEXT        DEFAULT '',
  time        TEXT        DEFAULT '',
  venue       TEXT        DEFAULT '',
  attendance  JSONB       DEFAULT '[]',   -- array of {date, present}
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.student_courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_all_courses" ON public.student_courses;
CREATE POLICY "public_all_courses" ON public.student_courses FOR ALL USING (true) WITH CHECK (true);

-- ==========================================
-- 4. BACKFILL: set student_type based on id_number format
-- ==========================================
-- JAMB format: 10-11 digits → fresher
-- Matric format: MOUAU/... → returning
UPDATE public.students
  SET student_type = 'returning',
      matric_number = id_number
  WHERE id_number ILIKE 'MOUAU/%'
    AND student_type = 'fresher';

UPDATE public.students
  SET student_type = 'fresher',
      jamb_number = id_number
  WHERE id_number ~ '^\d{10,11}$'
    AND jamb_number = '';
