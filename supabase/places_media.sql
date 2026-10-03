-- Migration: add media + audit columns to campus_locations
-- Run this in Supabase SQL Editor (Database → SQL Editor → New Query)

alter table campus_locations
  add column if not exists images    jsonb   default '[]'::jsonb,
  add column if not exists video_url text    default null,
  add column if not exists plus_code text    default null,
  add column if not exists added_by  text    default null;   -- admin email, not shown to students

-- Optional: back-fill plus_code for existing rows can be done via the admin UI after this runs
