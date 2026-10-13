-- Bigisub API settings rows
-- Run this in your Supabase SQL editor

INSERT INTO app_settings (key, value, label, description, category, is_secret)
VALUES
  (
    'bigisub_api_token',
    '',
    'Bigisub API Token',
    'Token for Bigisub VTU & bills API. Get it from bigisub.ng → Account → API Settings.',
    'bigisub',
    true
  ),
  (
    'bigisub_pin',
    '',
    'Bigisub Transaction PIN',
    'Your 4-digit transaction PIN set in your Bigisub account. Required for all purchases.',
    'bigisub',
    true
  )
ON CONFLICT (key) DO NOTHING;
