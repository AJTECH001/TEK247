-- migrate:up
-- Migration: Remove all mock data from operations
-- This removes seeded orders, payments, and users to ensure the dashboard reflects only real application state.

-- 1. Remove mock payments and deliveries
DELETE FROM payments;
DELETE FROM deliveries;

-- 2. Remove mock orders and repair requests
DELETE FROM repair_requests;
DELETE FROM order_items;
DELETE FROM orders;

-- 3. Remove mock users (except the main admin and system admins)
-- Keep users 1 and 2 (system admins) and any user that has a zklogin_sub (real users)
DELETE FROM users 
WHERE id > 2 
  AND zklogin_sub IS NULL 
  AND email != 'aladejamiudamilola@gmail.com';

-- 4. Reset sequences
SELECT setval('payments_id_seq', 1, false);
SELECT setval('deliveries_id_seq', 1, false);
SELECT setval('orders_id_seq', 1, false);
SELECT setval('repair_requests_id_seq', 1, false);

-- migrate:down
-- No-op: Data removal is intentional for production state.
