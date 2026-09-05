-- ============================================================
-- MOUAU FreshStart — Schema v2 additions
-- Run this in Supabase SQL Editor AFTER schema.sql
-- ============================================================

-- ── Forum post media + reaction counts ──────────────────────
ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT '';
ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS video_url TEXT DEFAULT '';
ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;
ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS love_count INTEGER DEFAULT 0;
ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS haha_count INTEGER DEFAULT 0;
ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS wow_count INTEGER DEFAULT 0;
ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS cry_count INTEGER DEFAULT 0;

-- ── Forum comments ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS forum_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
  author TEXT NOT NULL DEFAULT 'Anonymous',
  avatar TEXT DEFAULT 'ST',
  body TEXT NOT NULL,
  image_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE forum_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_comments"   ON forum_comments FOR SELECT USING (true);
CREATE POLICY "public_insert_comments" ON forum_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "all_forum_comments"     ON forum_comments FOR ALL USING (true) WITH CHECK (true);

-- ── Registration steps (admin-editable) ─────────────────────
CREATE TABLE IF NOT EXISTS registration_steps (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  step_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  substeps JSONB DEFAULT '[]',
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE registration_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_steps" ON registration_steps FOR SELECT USING (true);
CREATE POLICY "all_registration_steps" ON registration_steps FOR ALL USING (true) WITH CHECK (true);

-- ── Student registration progress ────────────────────────────
CREATE TABLE IF NOT EXISTS student_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id TEXT NOT NULL,
  step_key TEXT NOT NULL,
  done BOOLEAN DEFAULT FALSE,
  UNIQUE(student_id, step_key)
);
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_all_progress" ON student_progress FOR ALL USING (true) WITH CHECK (true);

-- ── Seed registration steps ───────────────────────────────────
INSERT INTO registration_steps (step_number, title, description, substeps, sort_order, active) VALUES
(1,'JAMB Admission Verification','Confirm your admission on the JAMB portal and MOUAU portal','["Visit jamb.gov.ng and verify your admission status","Visit mouau.edu.ng and check the admission list","Print your admission letter from the JAMB CAPS portal"]',1,true),
(2,'Acceptance Fee Payment','Pay the acceptance fee through the school portal','["Log into mouau.edu.ng with your JAMB number","Navigate to Fee Payment and select Acceptance Fee","Generate your RRR number and pay at any bank or online","Return to the portal and confirm your payment"]',2,true),
(3,'School Fees Payment','Pay the full tuition and other levies','["Log into the portal and navigate to School Fees","Select your department and level","Generate the RRR and make payment","Print your payment receipt"]',3,true),
(4,'Portal Registration & Profile Setup','Set up your student profile on the MOUAU portal','["Log in with your JAMB number and default password","Upload a recent passport photograph","Fill in your personal information and next-of-kin details","Update your contact information and local address"]',4,true),
(5,'Course Registration','Register your courses for the current semester','["Log into the portal and select Course Registration","Choose your department, level and semester","Select your courses (check unit load limits)","Submit and print your course registration form"]',5,true),
(6,'Departmental Clearance','Visit your department for physical clearance','["Take original and photocopies of all documents to your department","Get your departmental clearance form signed","Collect your department clearance letter"]',6,true),
(7,'Library Registration','Register with the university library','["Visit the university library with your student ID","Complete the library registration form","Collect your library card"]',7,true),
(8,'Medical/Health Centre Registration','Register at the university health centre','["Visit the health centre with a passport photograph","Complete your medical history form","Collect your health centre card"]',8,true),
(9,'Student Union Registration','Register with the student union','["Visit the student union building","Complete registration and collect your SUG card","This grants you access to student union activities"]',9,true)
ON CONFLICT DO NOTHING;
