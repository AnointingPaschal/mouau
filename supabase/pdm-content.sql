-- PDM Settings (key-value for all text content)
CREATE TABLE IF NOT EXISTS public.pdm_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.pdm_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pdm_settings_all" ON public.pdm_settings;
CREATE POLICY "pdm_settings_all" ON public.pdm_settings FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.pdm_settings (key, value) VALUES
('name',           'Pneuma Domain Ministry'),
('tagline',        'Building kingdom-minded students for global impact'),
('about',          'We are a vibrant campus ministry at Michael Okpara University of Agriculture, Umudike. Our mission is to raise disciples who are grounded in the Word of God and impactful in their generation.'),
('phone',          ''),
('whatsapp',       ''),
('email',          ''),
('youtube',        ''),
('instagram',      ''),
('facebook',       ''),
('sunday_time',    'Sundays · 9:00 AM'),
('sunday_venue',   'MOUAU Campus')
ON CONFLICT (key) DO NOTHING;

-- PDM Programs
CREATE TABLE IF NOT EXISTS public.pdm_programs (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  label      TEXT NOT NULL,
  time_info  TEXT DEFAULT '',
  icon       TEXT DEFAULT 'Heart',
  color      TEXT DEFAULT '#1e3a8a',
  sort_order INT DEFAULT 0,
  active     BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.pdm_programs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pdm_programs_all" ON public.pdm_programs;
CREATE POLICY "pdm_programs_all" ON public.pdm_programs FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.pdm_programs (label, time_info, icon, color, sort_order, active) VALUES
('Sunday Service',   'Sundays · 9AM',      'Star',     '#c2410c', 1, true),
('Bible Study',      'Tuesdays · 6PM',     'BookOpen', '#1e3a8a', 2, true),
('Prayer Meeting',   'Thursdays · 6PM',    'Heart',    '#b91c1c', 3, true),
('Discipleship',     'Saturdays · 4PM',    'Users',    '#7c3aed', 4, true),
('Worship Night',    'Last Friday · 7PM',  'Music',    '#059669', 5, true),
('Campus Outreach',  'Monthly',            'Globe',    '#0891b2', 6, true)
ON CONFLICT DO NOTHING;

-- Update ministry_videos to support direct video uploads
ALTER TABLE public.ministry_videos ADD COLUMN IF NOT EXISTS video_url TEXT DEFAULT '';
ALTER TABLE public.ministry_videos ADD COLUMN IF NOT EXISTS video_type TEXT DEFAULT 'youtube';
