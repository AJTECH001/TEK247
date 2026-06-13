-- migrate:up

-- =====================
-- USERS
-- Supports both regular users and admins via the role column
-- =====================
CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    full_name       VARCHAR(255) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(20)  NOT NULL DEFAULT 'user'
                    CHECK (role IN ('user', 'admin')),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =====================
-- SPEC CATEGORIES
-- =====================
CREATE TABLE spec_categories (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =====================
-- SPEC OPTIONS
-- =====================
CREATE TABLE spec_options (
    id              BIGSERIAL PRIMARY KEY,
    category_id     BIGINT NOT NULL REFERENCES spec_categories(id) ON DELETE CASCADE,
    name            VARCHAR(150) NOT NULL,
    description     TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (category_id, name)
);

-- =====================
-- LAPTOP CONFIGURATIONS
-- =====================
CREATE TABLE laptop_configurations (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    short_summary   TEXT,
    base_price      NUMERIC(12, 2) NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =====================
-- LAPTOP CONFIGURATION SPECS
-- =====================
CREATE TABLE laptop_configuration_specs (
    id                  BIGSERIAL PRIMARY KEY,
    configuration_id    BIGINT NOT NULL REFERENCES laptop_configurations(id) ON DELETE CASCADE,
    spec_option_id      BIGINT NOT NULL REFERENCES spec_options(id) ON DELETE RESTRICT,
    UNIQUE (configuration_id, spec_option_id)
);

-- =====================
-- PRICE HISTORY
-- =====================
CREATE TABLE price_history (
    id                  BIGSERIAL PRIMARY KEY,
    configuration_id    BIGINT NOT NULL REFERENCES laptop_configurations(id) ON DELETE CASCADE,
    old_price           NUMERIC(12, 2) NOT NULL,
    new_price           NUMERIC(12, 2) NOT NULL,
    changed_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    changed_by          BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT
);

-- =====================
-- INVENTORY
-- =====================
CREATE TABLE inventory (
    id                  BIGSERIAL PRIMARY KEY,
    configuration_id    BIGINT NOT NULL UNIQUE REFERENCES laptop_configurations(id) ON DELETE CASCADE,
    quantity_in_stock   INTEGER NOT NULL DEFAULT 0 CHECK (quantity_in_stock >= 0),
    restock_threshold   INTEGER NOT NULL DEFAULT 5,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =====================
-- SYSTEM REQUESTS
-- =====================
CREATE TABLE system_requests (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    description         TEXT NOT NULL,
    budget_min          NUMERIC(12, 2),
    budget_max          NUMERIC(12, 2),
    status              VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'recommended', 'purchased', 'closed')),
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =====================
-- SYSTEM REQUEST RECOMMENDATIONS
-- =====================
CREATE TABLE system_request_recommendations (
    id                  BIGSERIAL PRIMARY KEY,
    system_request_id   BIGINT NOT NULL REFERENCES system_requests(id) ON DELETE CASCADE,
    configuration_id    BIGINT NOT NULL REFERENCES laptop_configurations(id) ON DELETE CASCADE,
    rank                INTEGER NOT NULL CHECK (rank > 0),
    reason              TEXT,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (system_request_id, configuration_id),
    UNIQUE (system_request_id, rank)
);

-- =====================
-- ORDERS
-- =====================
CREATE TABLE orders (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    system_request_id   BIGINT REFERENCES system_requests(id) ON DELETE SET NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
    total_amount        NUMERIC(12, 2) NOT NULL,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =====================
-- ORDER ITEMS
-- =====================
CREATE TABLE order_items (
    id                  BIGSERIAL PRIMARY KEY,
    order_id            BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    configuration_id    BIGINT NOT NULL REFERENCES laptop_configurations(id) ON DELETE RESTRICT,
    quantity            INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price          NUMERIC(12, 2) NOT NULL,
    subtotal            NUMERIC(12, 2) NOT NULL
);

-- =====================
-- ACCESSORIES
-- =====================
CREATE TABLE accessories (
    id                  BIGSERIAL PRIMARY KEY,
    name                VARCHAR(255) NOT NULL,
    category            VARCHAR(100) NOT NULL,
                        CHECK (category IN ('bag', 'mouse', 'keyboard', 'charger', 'storage', 'hub', 'stand', 'other')),
    description         TEXT,
    price               NUMERIC(12, 2) NOT NULL,
    quantity_in_stock   INTEGER NOT NULL DEFAULT 0 CHECK (quantity_in_stock >= 0),
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =====================
-- ORDER ACCESSORIES
-- =====================
CREATE TABLE order_accessories (
    id              BIGSERIAL PRIMARY KEY,
    order_id        BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    accessory_id    BIGINT NOT NULL REFERENCES accessories(id) ON DELETE RESTRICT,
    quantity        INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price      NUMERIC(12, 2) NOT NULL,
    subtotal        NUMERIC(12, 2) NOT NULL
);

-- =====================
-- REPAIR SERVICES
-- =====================
CREATE TABLE repair_services (
    id                  BIGSERIAL PRIMARY KEY,
    name                VARCHAR(255) NOT NULL,
    description         TEXT,
    estimated_price     NUMERIC(12, 2) NOT NULL,
    repair_type         VARCHAR(50) NOT NULL,
                        CHECK (repair_type IN ('screen', 'battery', 'keyboard', 'charging_port', 'motherboard', 'software', 'virus_removal', 'data_recovery', 'general_maintenance', 'other')),
    estimated_duration  VARCHAR(50),
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =====================
-- REPAIR REQUESTS
-- =====================
CREATE TABLE repair_requests (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    laptop_brand        VARCHAR(100),
    laptop_model        VARCHAR(255),
    issue_description   TEXT NOT NULL,
    repair_service_id   BIGINT REFERENCES repair_services(id) ON DELETE SET NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'pending',
                        CHECK (status IN ('pending', 'diagnosed', 'in_progress', 'completed', 'cancelled', 'awaiting_parts')),
    estimated_cost      NUMERIC(12, 2),
    final_cost          NUMERIC(12, 2),
    diagnosed_by        BIGINT REFERENCES users(id) ON DELETE SET NULL,
    completed_by        BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at        TIMESTAMP WITH TIME ZONE
);

-- =====================
-- REPAIR PAYMENTS
-- =====================
CREATE TABLE repair_payments (
    id                  BIGSERIAL PRIMARY KEY,
    repair_request_id   BIGINT NOT NULL REFERENCES repair_requests(id) ON DELETE CASCADE,
    amount_paid         NUMERIC(12, 2) NOT NULL,
    payment_method      VARCHAR(50),
    payment_status      VARCHAR(20) NOT NULL DEFAULT 'pending',
                        CHECK (payment_status IN ('pending', 'completed', 'refunded')),
    paid_at             TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================
-- NOTIFICATIONS
-- =====================
CREATE TABLE notifications (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title               VARCHAR(255) NOT NULL,
    message             TEXT NOT NULL,
    notification_type   VARCHAR(50) NOT NULL,
                        CHECK (notification_type IN ('repair_status', 'order_status', 'price_drop', 'system_recommendation', 'system')),
    related_entity_type VARCHAR(50),
    related_entity_id   BIGINT,
    is_read             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);

-- =====================
-- PAYMENTS
-- =====================
CREATE TABLE payments (
    id                  BIGSERIAL PRIMARY KEY,
    order_id            BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    amount_paid         NUMERIC(12, 2) NOT NULL CHECK (amount_paid > 0),
    payment_method      VARCHAR(50) NOT NULL,
                        CHECK (payment_method IN ('cash', 'transfer', 'card', 'pos', 'bank_deposit', 'ussd', 'installment')),
    payment_status      VARCHAR(20) NOT NULL DEFAULT 'pending',
                        CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    transaction_reference VARCHAR(255),
    payment_proof_url   TEXT,
    paid_at             TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    verified_by         BIGINT REFERENCES users(id) ON DELETE SET NULL,
    verified_at         TIMESTAMP WITH TIME ZONE,
    notes               TEXT
);

CREATE INDEX idx_payments_order ON payments(order_id, payment_status);

-- =====================
-- DELIVERY TRACKING
-- =====================
CREATE TABLE deliveries (
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

CREATE INDEX idx_deliveries_status ON deliveries(delivery_status, estimated_delivery_date);

-- =====================
-- DELIVERY UPDATES
-- =====================
CREATE TABLE delivery_updates (
    id                  BIGSERIAL PRIMARY KEY,
    delivery_id         BIGINT NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
    status              VARCHAR(20) NOT NULL,
                        CHECK (status IN ('pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'returned')),
    location            VARCHAR(255),
    notes               TEXT,
    updated_by          BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_delivery_updates_timeline ON delivery_updates(delivery_id, created_at DESC);

-- migrate:down

DROP INDEX IF EXISTS idx_delivery_updates_timeline;
DROP TABLE IF EXISTS delivery_updates;
DROP INDEX IF EXISTS idx_deliveries_status;
DROP TABLE IF EXISTS deliveries;
DROP INDEX IF EXISTS idx_payments_order;
DROP TABLE IF EXISTS payments;
DROP INDEX IF EXISTS idx_notifications_user_unread;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS repair_payments;
DROP TABLE IF EXISTS repair_requests;
DROP TABLE IF EXISTS repair_services;
DROP TABLE IF EXISTS order_accessories;
DROP TABLE IF EXISTS accessories;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS system_request_recommendations;
DROP TABLE IF EXISTS system_requests;
DROP TABLE IF EXISTS inventory;
DROP TABLE IF EXISTS price_history;
DROP TABLE IF EXISTS laptop_configuration_specs;
DROP TABLE IF EXISTS laptop_configurations;
DROP TABLE IF EXISTS spec_options;
DROP TABLE IF EXISTS spec_categories;
DROP TABLE IF EXISTS users;
