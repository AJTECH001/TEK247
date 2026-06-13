-- migrate:up
-- Migration: Seed Missing Payments
-- Adds seed data for the newly created payments table.

INSERT INTO payments (id, order_id, amount_paid, payment_method, payment_status, transaction_reference, paid_at, verified_by, verified_at) VALUES
(1, 1, 1498980.00, 'transfer', 'completed', 'TXN20260128150045', '2026-01-28 15:00:45+01', 1, '2026-01-28 15:30:00+01'),
(2, 2, 1299990.00, 'pos',      'completed', 'POS20260202120134', '2026-02-02 12:01:34+01', 2, '2026-02-02 12:05:00+01'),
(3, 3,  599990.00, 'transfer', 'refunded',  'TXN20260203080012', '2026-02-03 08:00:12+01', 1, '2026-02-03 08:30:00+01')
ON CONFLICT (id) DO NOTHING;

SELECT setval('payments_id_seq', (SELECT MAX(id) FROM payments));

-- migrate:down
-- DELETE FROM payments WHERE id IN (1, 2, 3);
