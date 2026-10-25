-- Add student_id column to admins table for linking admin accounts to student accounts
-- Run this once in Supabase SQL editor

ALTER TABLE admins ADD COLUMN IF NOT EXISTS student_id TEXT;

-- Update existing admin accounts manually if needed:
-- UPDATE admins SET student_id = 'MOUAU/CMP/18/30238' WHERE email = 'onespiritgate@gmail.com';

CREATE INDEX IF NOT EXISTS admins_student_id_idx ON admins(student_id);
