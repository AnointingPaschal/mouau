-- MOUAU FreshStart Schema v2
-- Run each PART separately in Supabase SQL Editor if any part errors

SET search_path TO public;

-- ===== PART 1: Forum extra columns (run this first) =====

ALTER TABLE public.forum_posts ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT '';
ALTER TABLE public.forum_posts ADD COLUMN IF NOT EXISTS video_url TEXT DEFAULT '';
ALTER TABLE public.forum_posts ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;
ALTER TABLE public.forum_posts ADD COLUMN IF NOT EXISTS love_count INTEGER DEFAULT 0;
ALTER TABLE public.forum_posts ADD COLUMN IF NOT EXISTS haha_count INTEGER DEFAULT 0;
ALTER TABLE public.forum_posts ADD COLUMN IF NOT EXISTS wow_count INTEGER DEFAULT 0;
ALTER TABLE public.forum_posts ADD COLUMN IF NOT EXISTS cry_count INTEGER DEFAULT 0;

-- ===== PART 2: Forum comments table =====

CREATE TABLE IF NOT EXISTS public.forum_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  author TEXT NOT NULL DEFAULT 'Anonymous',
  avatar TEXT DEFAULT 'ST',
  body TEXT NOT NULL,
  image_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.forum_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_comments" ON public.forum_comments;
DROP POLICY IF EXISTS "public_insert_comments" ON public.forum_comments;

CREATE POLICY "public_read_comments" ON public.forum_comments FOR SELECT USING (true);
CREATE POLICY "public_insert_comments" ON public.forum_comments FOR INSERT WITH CHECK (true);

-- ===== PART 3: Registration steps table =====

CREATE TABLE IF NOT EXISTS public.registration_steps (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  step_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  substeps JSONB NOT NULL DEFAULT '[]',
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.registration_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_steps" ON public.registration_steps;
DROP POLICY IF EXISTS "service_all_steps" ON public.registration_steps;

CREATE POLICY "public_read_steps" ON public.registration_steps FOR SELECT USING (true);
CREATE POLICY "service_all_steps" ON public.registration_steps FOR ALL USING (true) WITH CHECK (true);

-- Add unique constraint so we can use ON CONFLICT
ALTER TABLE public.registration_steps
  ADD CONSTRAINT IF NOT EXISTS reg_steps_num_unique UNIQUE (step_number);

-- ===== PART 4: Student progress table =====

CREATE TABLE IF NOT EXISTS public.student_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id TEXT NOT NULL,
  step_key TEXT NOT NULL,
  done BOOLEAN DEFAULT FALSE,
  UNIQUE(student_id, step_key)
);

ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_all_progress" ON public.student_progress;
CREATE POLICY "public_all_progress" ON public.student_progress FOR ALL USING (true) WITH CHECK (true);

-- ===== PART 5: Seed registration steps =====
-- Each INSERT uses ON CONFLICT so it is safe to run multiple times

INSERT INTO public.registration_steps (step_number, title, description, substeps, sort_order, active)
VALUES (1, 'JAMB Admission Verification', 'Confirm your admission on the JAMB portal and MOUAU portal',
'["Visit jamb.gov.ng and verify your admission status",
  "Visit mouau.edu.ng and check the admission list",
  "Print your admission letter from the JAMB CAPS portal"]'::jsonb, 1, true)
ON CONFLICT (step_number) DO NOTHING;

INSERT INTO public.registration_steps (step_number, title, description, substeps, sort_order, active)
VALUES (2, 'Acceptance Fee Payment', 'Pay the acceptance fee through the school portal',
'["Log into mouau.edu.ng with your JAMB number",
  "Navigate to Fee Payment and select Acceptance Fee",
  "Generate your RRR number and pay at any bank or online",
  "Return to the portal and confirm your payment"]'::jsonb, 2, true)
ON CONFLICT (step_number) DO NOTHING;

INSERT INTO public.registration_steps (step_number, title, description, substeps, sort_order, active)
VALUES (3, 'School Fees Payment', 'Pay the full tuition and other levies',
'["Log into the portal and navigate to School Fees",
  "Select your department and level",
  "Generate the RRR and make payment",
  "Print your payment receipt"]'::jsonb, 3, true)
ON CONFLICT (step_number) DO NOTHING;

INSERT INTO public.registration_steps (step_number, title, description, substeps, sort_order, active)
VALUES (4, 'Portal Registration and Profile Setup', 'Set up your student profile on the MOUAU portal',
'["Log in with your JAMB number and default password",
  "Upload a recent passport photograph",
  "Fill in your personal information and next-of-kin details",
  "Update your contact information and local address"]'::jsonb, 4, true)
ON CONFLICT (step_number) DO NOTHING;

INSERT INTO public.registration_steps (step_number, title, description, substeps, sort_order, active)
VALUES (5, 'Course Registration', 'Register your courses for the current semester',
'["Log into the portal and select Course Registration",
  "Choose your department, level and semester",
  "Select your courses within the approved unit load",
  "Submit and print your course registration form"]'::jsonb, 5, true)
ON CONFLICT (step_number) DO NOTHING;

INSERT INTO public.registration_steps (step_number, title, description, substeps, sort_order, active)
VALUES (6, 'Departmental Clearance', 'Visit your department for physical clearance',
'["Take originals and photocopies of all documents to your department",
  "Get your departmental clearance form signed",
  "Collect your department clearance letter"]'::jsonb, 6, true)
ON CONFLICT (step_number) DO NOTHING;

INSERT INTO public.registration_steps (step_number, title, description, substeps, sort_order, active)
VALUES (7, 'Library Registration', 'Register with the university library',
'["Visit the university library with your student ID",
  "Complete the library registration form",
  "Collect your library card"]'::jsonb, 7, true)
ON CONFLICT (step_number) DO NOTHING;

INSERT INTO public.registration_steps (step_number, title, description, substeps, sort_order, active)
VALUES (8, 'Medical and Health Centre Registration', 'Register at the university health centre',
'["Visit the health centre with a passport photograph",
  "Complete your medical history form",
  "Collect your health centre card"]'::jsonb, 8, true)
ON CONFLICT (step_number) DO NOTHING;

INSERT INTO public.registration_steps (step_number, title, description, substeps, sort_order, active)
VALUES (9, 'Student Union Registration', 'Register with the student union',
'["Visit the student union building",
  "Complete registration and collect your SUG card",
  "This grants you access to student union activities"]'::jsonb, 9, true)
ON CONFLICT (step_number) DO NOTHING;

