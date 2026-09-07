-- MOUAU FreshStart COMPLETE SCHEMA
-- Run this single block in Supabase SQL Editor

SET search_path TO public;

-- ===========================================
-- 1. REGISTRATION STEPS (official 8-step PDF)
-- ===========================================
DELETE FROM public.registration_steps;
ALTER TABLE public.registration_steps DROP CONSTRAINT IF EXISTS reg_steps_num_unique;
ALTER TABLE public.registration_steps ADD CONSTRAINT reg_steps_num_unique UNIQUE (step_number);

INSERT INTO public.registration_steps (step_number, title, description, substeps, sort_order, active) VALUES
(1,'Admission','Check admission status, accept and print your admission letter and pledge form.',
'["Visit portal.mouau.edu.ng","Click on Admission then Admission Status","Enter your JAMB Registration Number and submit","Accept and print your admission letter","Accept and print the pledge form","Click Go to next stage to proceed to Development Levy"]'::jsonb,1,true),
(2,'Development Levy','Generate RRR code for development levy, pay and validate on the portal.',
'["Log into portal.mouau.edu.ng via the Admission page","Generate your RRR code for Development Levy","Pay online or print the RRR and pay at any bank","Return to the portal to validate payment","Click Query Remita then enter RRR code and click Submit","Proceed to Departmental Clearance if validation is successful"]'::jsonb,2,true),
(3,'Departmental Clearance','Visit your department with all credentials, collect and upload clearance form to the portal.',
'["Log into the portal with your JAMB number","Confirm the Departmental Clearance page is displayed","Visit your Department with all original credentials and photocopies","Collect your Departmental Clearance Form","Upload the clearance form to the portal","Wait for email notification confirming you have been cleared"]'::jsonb,3,true),
(4,'Accommodation','After clearance is approved by Portal Admin, generate RRR code, pay and validate accommodation.',
'["Wait for Portal Admin to approve your departmental clearance","Log into portal.mouau.edu.ng via the Admission page","Generate your RRR code for Accommodation charges","Make payment online or at any bank","Return to the portal and validate via Query Remita","Proceed to School Charges after successful validation"]'::jsonb,4,true),
(5,'School Charges','Generate RRR code for school charges, pay and validate on the portal.',
'["Log into the portal with your JAMB number via the Admission page","The School Charges page will open automatically","Generate your RRR code for School Charges","Make payment online or at any bank","Return to the portal and validate via Query Remita","Enter your RRR code and click Submit to confirm"]'::jsonb,5,true),
(6,'SUG Pin','Enter the PIN issued by the Student Union Government on the portal.',
'["Log into the portal with your JAMB number via the Admission page","The SUG Due page opens if school charges are validated","If not successful repeat the validation process first","Obtain your SUG PIN from the SUG Secretariat on campus","Enter the PIN on the portal and click Submit","Proceed to Biodata once the PIN is accepted"]'::jsonb,6,true),
(7,'Biodata','Complete your biodata form and print your login details before registering courses.',
'["Complete the Biodata form displayed on the portal","Some fields are pre-filled and cannot be edited","Click Submit after completing the form","Click Print Login Details to print your username and password","Click Print Biodata to print your biodata form","Save your username and password before clicking Register Your Courses"]'::jsonb,7,true),
(8,'Course Registration','Log in with your new username and password, register your courses and print the course form.',
'["Log into the portal using your new username and password from the Biodata step","Your Student Dashboard will be displayed if login is successful","Click on Course Registration","Click Register Courses to select your courses for the semester","Review your selected courses and confirm","Print your Course Registration Form to complete the process","Visit the Portal Office on campus for any issues"]'::jsonb,8,true)
ON CONFLICT (step_number) DO UPDATE SET title=EXCLUDED.title,description=EXCLUDED.description,substeps=EXCLUDED.substeps,sort_order=EXCLUDED.sort_order,active=EXCLUDED.active;

-- ===========================================
-- 2. NOTIFICATIONS
-- ===========================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL DEFAULT '',
  body TEXT DEFAULT '',
  post_id TEXT DEFAULT '',
  actor TEXT DEFAULT '',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_all_notifications" ON public.notifications;
CREATE POLICY "public_all_notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);

-- ===========================================
-- 3. FORUM ENHANCEMENTS
-- ===========================================
ALTER TABLE public.forum_posts ADD COLUMN IF NOT EXISTS author_id TEXT DEFAULT '';
ALTER TABLE public.forum_comments ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;
ALTER TABLE public.forum_comments ADD COLUMN IF NOT EXISTS reply_count INTEGER DEFAULT 0;
ALTER TABLE public.forum_comments ADD COLUMN IF NOT EXISTS author_id TEXT DEFAULT '';
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '';

-- Comment replies
CREATE TABLE IF NOT EXISTS public.forum_comment_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL,
  post_id TEXT NOT NULL DEFAULT '',
  author TEXT NOT NULL DEFAULT '',
  avatar TEXT NOT NULL DEFAULT '',
  author_id TEXT DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.forum_comment_replies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_all_replies" ON public.forum_comment_replies;
CREATE POLICY "public_all_replies" ON public.forum_comment_replies FOR ALL USING (true) WITH CHECK (true);

-- Comment likes
CREATE TABLE IF NOT EXISTS public.forum_comment_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, student_id)
);
ALTER TABLE public.forum_comment_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_all_comment_likes" ON public.forum_comment_likes;
CREATE POLICY "public_all_comment_likes" ON public.forum_comment_likes FOR ALL USING (true) WITH CHECK (true);

-- ===========================================
-- 4. CAMPUS EVENTS
-- ===========================================
CREATE TABLE IF NOT EXISTS public.campus_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  location TEXT DEFAULT '',
  event_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  category TEXT DEFAULT 'general',
  organizer TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  important BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.campus_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_all_events" ON public.campus_events;
CREATE POLICY "public_all_events" ON public.campus_events FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.campus_events (title, description, location, event_date, category, organizer, important, active) VALUES
('Course Registration Deadline 2024/2025','Last day for all students to complete course registration on the portal. No late registration will be accepted.','Online via portal.mouau.edu.ng',NOW() + INTERVAL '14 days','academic','Academic Affairs',true,true),
('Matriculation Ceremony','Official matriculation for new students. All fresh students must attend.','University Convocation Arena',NOW() + INTERVAL '21 days','ceremony','Registry',true,true),
('Library Orientation for Fresh Students','Introduction to library resources, e-library access, and past questions retrieval.','University Library',NOW() + INTERVAL '7 days','academic','University Library',false,true),
('SUG Week Celebration','Annual Student Union Government week with sports, entertainment and cultural displays.','Various Campus Venues',NOW() + INTERVAL '30 days','social','Student Union Government',false,true),
('ICT Centre Orientation','How to use the MOUAU student portal, email setup, and printing services.','ICT Centre',NOW() + INTERVAL '5 days','academic','ICT Centre',false,true);

-- ===========================================
-- 5. AI TRAINING / CHAT SESSIONS (if missing)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.ai_training (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL DEFAULT '',
  answer TEXT NOT NULL DEFAULT '',
  category TEXT DEFAULT 'general',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.ai_training ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_all_ai_training" ON public.ai_training;
CREATE POLICY "public_all_ai_training" ON public.ai_training FOR ALL USING (true) WITH CHECK (true);

-- ===========================================
-- 6. PUSH SUBSCRIPTIONS
-- ===========================================
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL,
  endpoint   TEXT NOT NULL,
  p256dh     TEXT NOT NULL,
  auth       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(endpoint)
);
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_all_push_subs" ON public.push_subscriptions;
CREATE POLICY "public_all_push_subs" ON public.push_subscriptions FOR ALL USING (true) WITH CHECK (true);

-- Add email_notifications and push_notifications prefs to students
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS push_notifications  BOOLEAN DEFAULT true;
