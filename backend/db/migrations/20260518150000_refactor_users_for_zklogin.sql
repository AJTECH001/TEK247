-- migrate:up
-- Migration: Refactor Users for zkLogin and remove legacy auth tables

-- 1. Remove obsolete auth tables
DROP TABLE IF EXISTS password_reset_tokens;
DROP TABLE IF EXISTS email_verification_tokens;

-- 2. Refactor users table
-- Remove legacy password_hash as it's no longer used in the zkLogin flow
ALTER TABLE users DROP COLUMN IF EXISTS password_hash;

-- Ensure zkLogin fields are prioritized
-- Note: We don't make them NOT NULL yet because system admins (id 1, 2) 
-- might still be in the system from the initial seed without zkLogin data.
-- But all NEW users will have these.

-- 3. Cleanup any orphaned data in users
-- (Already mostly done in previous migration, but this is a final sweep)
DELETE FROM users 
WHERE id > 2 
  AND zklogin_sub IS NULL 
  AND email != 'aladejamiudamilola@gmail.com';

-- migrate:down
-- No-op: Refactoring to zkLogin is a permanent architectural shift.
