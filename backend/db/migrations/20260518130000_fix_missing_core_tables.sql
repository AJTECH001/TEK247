-- migrate:up
-- Migration: Add Missing Core Tables
-- These tables were missing in the database despite being in the initial_schema.sql file.

CREATE TABLE IF NOT EXISTS payments (
    id                  BIGSERIAL PRIMARY KEY,
    order_id            BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    amount_paid         NUMERIC(12, 2) NOT NULL CHECK (amount_paid > 0),
    payment_method      VARCHAR(50) NOT NULL,
                        CHECK (payment_method IN ('cash', 'transfer', 'card', 'pos', 'bank_deposit', 'ussd', 'installment', 'usdc')),
    payment_status      VARCHAR(20) NOT NULL DEFAULT 'pending',
                        CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    transaction_reference VARCHAR(255),
    payment_proof_url   TEXT,
    paid_at             TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    verified_by         BIGINT REFERENCES users(id) ON DELETE SET NULL,
    verified_at         TIMESTAMP WITH TIME ZONE,
    notes               TEXT
);

CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id, payment_status);

CREATE TABLE IF NOT EXISTS deliveries (
    id                      BIGSERIAL PRIMARY KEY,
    order_id                BIGINT NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    delivery_method         VARCHAR(50) NOT NULL,
                            CHECK (delivery_method IN ('pickup', 'courier', 'dispatch_rider', 'shipping_company')),
    courier_name            VARCHAR(255),
    tracking_number         VARCHAR(255),
    recipient_name          VARCHAR(255) NOT NULL,
    recipient_phone         VARCHAR(50) NOT NULL,
    delivery_address        TEXT NOT NULL,
    delivery_state          VARCHAR(100),
    delivery_lga            VARCHAR(100),
    delivery_status         VARCHAR(20) NOT NULL DEFAULT 'pending',
                            CHECK (delivery_status IN ('pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'returned')),
    estimated_delivery_date DATE,
    actual_delivery_date    DATE,
    delivered_to            VARCHAR(255),
    delivery_notes          TEXT,
    assigned_to             BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(delivery_status, estimated_delivery_date);

-- migrate:down
-- DROP TABLE IF EXISTS deliveries;
-- DROP TABLE IF EXISTS payments;
