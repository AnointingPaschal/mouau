-- MOUAU FreshStart — Run this in your Supabase SQL Editor

-- Enable UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Library materials
CREATE TABLE library_materials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  department TEXT NOT NULL DEFAULT '',
  college TEXT NOT NULL DEFAULT '',
  level TEXT NOT NULL DEFAULT '100',
  type TEXT NOT NULL DEFAULT 'handout' CHECK (type IN ('handout','past-question','note','textbook')),
  course TEXT DEFAULT '',
  course_code TEXT DEFAULT '',
  uploader TEXT DEFAULT 'Anonymous',
  year TEXT,
  downloads INTEGER DEFAULT 0,
  rating DECIMAL(3,1) DEFAULT 0,
  size TEXT DEFAULT '',
  file_url TEXT DEFAULT '',
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Forum posts
CREATE TABLE forum_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT DEFAULT '',
  author TEXT NOT NULL DEFAULT 'Anonymous',
  avatar TEXT DEFAULT 'ST',
  category TEXT NOT NULL DEFAULT 'General',
  replies INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  answered BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Announcements (admin manages via Supabase Studio)
CREATE TABLE announcements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT DEFAULT '',
  type TEXT DEFAULT 'info' CHECK (type IN ('info','warning','success','event')),
  pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS — allow full public access (university internal app)
ALTER TABLE library_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read library" ON library_materials FOR SELECT USING (true);
CREATE POLICY "public insert library" ON library_materials FOR INSERT WITH CHECK (true);
CREATE POLICY "public update library" ON library_materials FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "public read forum" ON forum_posts FOR SELECT USING (true);
CREATE POLICY "public insert forum" ON forum_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "public update forum" ON forum_posts FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "public read announcements" ON announcements FOR SELECT USING (true);

-- Seed announcements (edit via Supabase Studio for real ones)
INSERT INTO announcements (title, body, type, pinned) VALUES
  ('Welcome Fresh Students 2024/2025', 'The orientation programme for fresh students holds at the Convocation Arena. Attendance is compulsory for all freshers.', 'event', true),
  ('Registration Deadline Notice', 'All students who have not completed portal registration should do so before the deadline to avoid late charges.', 'warning', true),
  ('Library Hours Extended', 'The University Library is now open on Saturdays 9AM–4PM for exam preparation.', 'success', false);

-- Storage bucket for material files
INSERT INTO storage.buckets (id, name, public) VALUES ('materials', 'materials', true) ON CONFLICT DO NOTHING;
CREATE POLICY "allow materials upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'materials');
CREATE POLICY "allow materials read" ON storage.objects FOR SELECT USING (bucket_id = 'materials');
