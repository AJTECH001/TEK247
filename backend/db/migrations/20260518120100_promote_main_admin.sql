-- Migration: Promote aladejamiudamilola@gmail.com to Admin
-- migrate:up
UPDATE users 
SET role = 'admin', is_email_verified = TRUE 
WHERE email = 'aladejamiudamilola@gmail.com';

-- migrate:down
UPDATE users 
SET role = 'user' 
WHERE email = 'aladejamiudamilola@gmail.com';
