-- Bigisub API settings row
-- Run this in your Supabase SQL editor to add the bigisub_api_token setting

INSERT INTO app_settings (key, value, label, description, category, is_secret)
VALUES (
  'bigisub_api_token',
  '',
  'Bigisub API Token',
  'Token for Bigisub VTU & bills API. Get it from bigisub.ng → Account → API Settings.',
  'bigisub',
  true
)
ON CONFLICT (key) DO NOTHING;
