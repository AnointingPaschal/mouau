-- ============================================================
-- MOUAU FreshStart — Complete Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Admin accounts ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admins (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL DEFAULT 'Admin',
  password_hash TEXT NOT NULL,
  is_super BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Admin sessions ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  admin_id UUID REFERENCES admins(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Students ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS students (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  id_number TEXT UNIQUE NOT NULL,
  name TEXT DEFAULT '',
  email TEXT DEFAULT '',
  whatsapp TEXT DEFAULT '',
  department TEXT DEFAULT '',
  college TEXT DEFAULT '',
  level TEXT DEFAULT '100',
  points INTEGER DEFAULT 0,
  downloads INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Site content (admin-editable) ────────────────────────────
CREATE TABLE IF NOT EXISTS site_content (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL DEFAULT '',
  label TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Announcements ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS announcements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT DEFAULT '',
  type TEXT DEFAULT 'info' CHECK (type IN ('info','warning','success','event')),
  pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Campus locations (admin-managed) ─────────────────────────
CREATE TABLE IF NOT EXISTS campus_locations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  lat DECIMAL(10,7) NOT NULL,
  lng DECIMAL(10,7) NOT NULL,
  category TEXT DEFAULT 'academic',
  hours TEXT DEFAULT '',
  directions TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Library materials ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS library_materials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  department TEXT DEFAULT '',
  college TEXT DEFAULT '',
  level TEXT DEFAULT '100',
  type TEXT NOT NULL DEFAULT 'past-question' CHECK (type IN ('past-question','note','project')),
  course TEXT DEFAULT '',
  course_code TEXT DEFAULT '',
  abstract TEXT DEFAULT '',
  uploader TEXT DEFAULT 'Anonymous',
  student_id TEXT DEFAULT '',
  year TEXT DEFAULT '',
  downloads INTEGER DEFAULT 0,
  rating DECIMAL(3,1) DEFAULT 0,
  size TEXT DEFAULT '',
  file_url TEXT DEFAULT '',
  verified BOOLEAN DEFAULT FALSE,
  admin_only BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Forum posts ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS forum_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT DEFAULT '',
  author TEXT DEFAULT 'Anonymous',
  avatar TEXT DEFAULT 'ST',
  category TEXT DEFAULT 'General',
  replies INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  answered BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── AI training data ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_training (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── RLS Policies ─────────────────────────────────────────────
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE campus_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_training ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "public_read_site_content" ON site_content FOR SELECT USING (true);
CREATE POLICY "public_read_announcements" ON announcements FOR SELECT USING (true);
CREATE POLICY "public_read_campus_locations" ON campus_locations FOR SELECT USING (true);
CREATE POLICY "public_read_library" ON library_materials FOR SELECT USING (true);
CREATE POLICY "public_insert_library" ON library_materials FOR INSERT WITH CHECK (admin_only = false);
CREATE POLICY "public_update_library" ON library_materials FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "public_read_forum" ON forum_posts FOR SELECT USING (true);
CREATE POLICY "public_insert_forum" ON forum_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_forum" ON forum_posts FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "public_read_ai_training" ON ai_training FOR SELECT USING (active = true);
-- Admin full access (via service role key in API routes)
CREATE POLICY "all_admins" ON admins FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_admin_sessions" ON admin_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_students" ON students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_site_content" ON site_content FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_announcements" ON announcements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_campus_locations" ON campus_locations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_library_materials" ON library_materials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_forum_posts" ON forum_posts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_ai_training" ON ai_training FOR ALL USING (true) WITH CHECK (true);

-- ── Storage bucket ───────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public) VALUES ('materials','materials',true) ON CONFLICT DO NOTHING;
CREATE POLICY "materials_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id='materials');
CREATE POLICY "materials_select" ON storage.objects FOR SELECT USING (bucket_id='materials');
CREATE POLICY "materials_delete" ON storage.objects FOR DELETE USING (bucket_id='materials');

-- ── Seed: Super Admin ─────────────────────────────────────────
-- Password: Admin123 (SHA-256 hash)
INSERT INTO admins (email, name, password_hash, is_super, active)
VALUES ('onespiritgate@gmail.com', 'Super Admin', '3b612c75a7b5048a435fb6ec81e52ff92d6d795a8b5a9c17070f6a63c97a53b2', TRUE, TRUE)
ON CONFLICT (email) DO NOTHING;

-- ── Seed: Site content ────────────────────────────────────────
INSERT INTO site_content (key, value, label) VALUES
  ('hero_label','MOUAU FRESHSTART · 2024/2025','Hero Label'),
  ('hero_title','Your complete campus companion at MOUAU.','Hero Title'),
  ('hero_green','MOUAU.','Hero Green Word'),
  ('hero_subtitle','Navigate campus, access study materials, complete your registration, and connect with fellow students — all in one place.','Hero Subtitle'),
  ('hero_cta1','Get Started','Hero Button 1'),
  ('hero_cta2','View Campus Map','Hero Button 2'),
  ('stats_students','5,000+','Stats Students'),
  ('stats_label1','REGISTERED STUDENTS','Stats Label 1'),
  ('stats_materials','500+','Stats Materials'),
  ('stats_label2','STUDY MATERIALS','Stats Label 2'),
  ('stats_depts','30+','Stats Departments'),
  ('stats_label3','DEPARTMENTS','Stats Label 3'),
  ('about_label','ABOUT MOUAU FRESHSTART','About Label'),
  ('about_title','Built for every MOUAU student.','About Title'),
  ('about_body','FreshStart is the official student companion for Michael Okpara University of Agriculture, Umudike. We help fresh students navigate campus, access study materials, and complete their registration without stress.','About Body'),
  ('library_label','STUDY LIBRARY','Library Label'),
  ('library_title','Access past questions, notes, and final year projects.','Library Title'),
  ('library_subtitle','Student-contributed materials organized by department, level, and course.','Library Subtitle'),
  ('contact_email','freshstart@mouau.edu.ng','Contact Email'),
  ('contact_phone','+234 802 000 0000','Contact Phone'),
  ('footer_text','Michael Okpara University of Agriculture, Umudike, Abia State, Nigeria.','Footer Text')
ON CONFLICT (key) DO NOTHING;

-- ── Seed: Campus locations ────────────────────────────────────
INSERT INTO campus_locations (name, description, lat, lng, category, hours, directions, sort_order) VALUES
  ('Main Gate','Primary entrance to the university. Security checkpoints here.',5.4820,7.5465,'admin','24/7','The main gate is on the Umuahia-Ikot Ekpene road. Enter and proceed straight to reach the admin block.',1),
  ('Administrative Block','Vice Chancellor office, Registrar, and Bursary.',5.4800,7.5440,'admin','Mon-Fri 8AM-4PM','From the main gate, follow the central road. The admin block is the large building on the right.',2),
  ('University Library','Main library with over 50,000 volumes and computer lab.',5.4780,7.5435,'academic','Mon-Fri 9AM-6PM, Sat 9AM-4PM','Turn left from the admin block and walk 200 meters. The library has large glass doors.',3),
  ('College of Agriculture','Agronomy, Crop Science, Animal Science, Soil Science.',5.4795,7.5470,'academic','Mon-Fri 8AM-5PM','From the main road, take the right fork after the admin block.',4),
  ('College of Natural Sciences','Biochemistry, Computer Science, Microbiology, Chemistry.',5.4790,7.5460,'academic','Mon-Fri 8AM-5PM','Located in the central academic zone, next to the library.',5),
  ('University Health Centre','Medical services. 24-hour emergency care.',5.4793,7.5442,'health','24/7','Behind the admin block, follow the path to the right.',6),
  ('University Cafeteria','Main student cafeteria. Affordable meals.',5.4788,7.5452,'social','Mon-Sat 7AM-9PM','Centrally located near the student union building.',7),
  ('Male Hostel Area','University male student hostels.',5.4815,7.5445,'hostel','24/7','From the main gate, take the right fork to the hostel zone.',8),
  ('Female Hostel Area','University female student hostels.',5.4820,7.5430,'hostel','24/7','From the main gate, take the left fork to the female hostel zone.',9),
  ('Sports Complex','Football field, basketball court, gymnasium.',5.4770,7.5465,'sport','Mon-Sat 6AM-8PM','Located at the far end of campus, past the academic zone.',10)
ON CONFLICT DO NOTHING;

-- ── Seed: AI training ─────────────────────────────────────────
INSERT INTO ai_training (question, answer, category) VALUES
  ('What is MOUAU?','Michael Okpara University of Agriculture, Umudike (MOUAU) is a federal university established in 1992, located in Umudike, about 8km from Umuahia, Abia State. It specializes in agriculture and related fields.','general'),
  ('How do I pay school fees?','Log into the student portal at mouau.edu.ng. Navigate to Fee Payment and generate a Remita Retrieval Reference (RRR) number. Take the RRR to any bank or pay online. After payment, confirm on the portal and print your receipt.','registration'),
  ('Where is the MOUAU student portal?','The student portal is at mouau.edu.ng. Fresh students use their JAMB number as the default username. Contact the ICT Centre for any login issues.','registration'),
  ('What documents do I need for departmental clearance?','You need: JAMB Notification of Admission, WAEC or NECO certificate (original and 3 photocopies), JAMB result slip, birth certificate, 4 passport photographs (white background), school fees receipt, and acceptance fee receipt.','clearance'),
  ('How do I register courses?','Log into the portal at mouau.edu.ng. Go to Course Registration, select your level and semester, choose your courses within the approved unit range, then submit and print your form.','registration'),
  ('Where can I find past questions?','Go to the Library section of FreshStart. Select Past Questions, filter by your department and level, then download any available materials. Students also contribute past questions by uploading them.','library'),
  ('What is the deadline for school fees?','Check the official MOUAU portal at mouau.edu.ng or visit the Bursary at the Admin Block for the current deadline. Deadlines change each semester.','fees')
ON CONFLICT DO NOTHING;
