-- Pneuma Domain Ministry MOUAU — Extra tables

-- Gallery images (admin uploads)
CREATE TABLE IF NOT EXISTS public.ministry_gallery (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url  TEXT NOT NULL,
  title      TEXT DEFAULT '',
  caption    TEXT DEFAULT '',
  sort_order INT  DEFAULT 0,
  active     BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.ministry_gallery ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "gallery_all" ON public.ministry_gallery;
CREATE POLICY "gallery_all" ON public.ministry_gallery FOR ALL USING (true) WITH CHECK (true);

-- Ministry materials (admin posts, students request)
CREATE TABLE IF NOT EXISTS public.ministry_materials (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT DEFAULT '',
  type        TEXT DEFAULT 'book',
  image_url   TEXT DEFAULT '',
  available   BOOLEAN DEFAULT true,
  quantity    INT DEFAULT 0,
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.ministry_materials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "materials_all" ON public.ministry_materials;
CREATE POLICY "materials_all" ON public.ministry_materials FOR ALL USING (true) WITH CHECK (true);

-- Material requests (who applied for what)
CREATE TABLE IF NOT EXISTS public.material_requests (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id   UUID NOT NULL,
  student_id    TEXT NOT NULL,
  student_name  TEXT NOT NULL,
  student_phone TEXT DEFAULT '',
  student_email TEXT DEFAULT '',
  matric_number TEXT DEFAULT '',
  status        TEXT DEFAULT 'pending',
  notes         TEXT DEFAULT '',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(material_id, student_id)
);
ALTER TABLE public.material_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "requests_all" ON public.material_requests;
CREATE POLICY "requests_all" ON public.material_requests FOR ALL USING (true) WITH CHECK (true);

-- Seed sample gallery images (replace with real Pneuma Domain photos)
INSERT INTO public.ministry_gallery (image_url, title, caption, sort_order, active) VALUES
('https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800', 'Worship Session', 'Pneuma Domain MOUAU worship', 1, true),
('https://images.unsplash.com/photo-1499364615650-ec38552f4f34?w=800', 'Prayer Meeting', 'Weekly prayer & fellowship', 2, true),
('https://images.unsplash.com/photo-1478147427282-58a87a120781?w=800', 'Bible Study', 'Word of God fellowship', 3, true)
ON CONFLICT DO NOTHING;
