-- ══════════════════════════════════════════════════════════
-- Schema v5 — Skills: delivery mode, pricing, remove instructor/duration
-- Run in Supabase SQL Editor
-- ══════════════════════════════════════════════════════════

SET search_path TO public;

-- Add delivery_mode column (virtual | physical | hybrid)
ALTER TABLE public.skills
  ADD COLUMN IF NOT EXISTS delivery_mode TEXT DEFAULT 'physical'
    CHECK (delivery_mode IN ('virtual','physical','hybrid'));

-- Add is_free flag
ALTER TABLE public.skills
  ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT true;

-- Add price_note for paid skills (e.g. "₦2,000 registration fee")
ALTER TABLE public.skills
  ADD COLUMN IF NOT EXISTS price_note TEXT DEFAULT '';

-- Backfill existing rows
UPDATE public.skills SET delivery_mode = 'physical' WHERE delivery_mode IS NULL;
UPDATE public.skills SET is_free = true WHERE is_free IS NULL;
UPDATE public.skills SET price_note = '' WHERE price_note IS NULL;

-- Note: instructor and duration columns are kept in the DB for backward
-- compatibility but are no longer shown in the UI. You may drop them later:
-- ALTER TABLE public.skills DROP COLUMN IF EXISTS instructor;
-- ALTER TABLE public.skills DROP COLUMN IF EXISTS duration;
