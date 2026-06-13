-- migrate:up
-- Mirror of on-chain Device Passport objects so we can look one up by device
-- serial hash or repair without scanning the chain. The Sui object + its
-- append-only records remain the source of truth.
CREATE TABLE IF NOT EXISTS device_passports (
  id                  BIGSERIAL PRIMARY KEY,
  passport_object_id  TEXT UNIQUE NOT NULL,
  serial_hash         TEXT NOT NULL,
  brand               TEXT,
  model               TEXT,
  owner_address       TEXT NOT NULL,
  repair_request_id   BIGINT REFERENCES repair_requests(id) ON DELETE SET NULL,
  record_count        INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_device_passports_serial ON device_passports (serial_hash);
CREATE INDEX IF NOT EXISTS idx_device_passports_repair ON device_passports (repair_request_id);
CREATE INDEX IF NOT EXISTS idx_device_passports_owner  ON device_passports (owner_address);

-- migrate:down
DROP TABLE IF EXISTS device_passports;
