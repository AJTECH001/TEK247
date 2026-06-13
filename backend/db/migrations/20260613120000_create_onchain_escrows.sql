-- migrate:up
-- On-chain escrow mirror. The Sui object is the source of truth; this table is a
-- fast read-cache populated by the event indexer so the UI need not hit RPC for
-- every list view.
CREATE TABLE IF NOT EXISTS onchain_escrows (
  id                 BIGSERIAL PRIMARY KEY,
  escrow_object_id   TEXT UNIQUE NOT NULL,
  repair_request_id  BIGINT REFERENCES repair_requests(id) ON DELETE SET NULL,
  customer_address   TEXT NOT NULL,
  shop_address       TEXT NOT NULL,
  coin_type          TEXT NOT NULL,
  total_amount       NUMERIC(40, 0) NOT NULL DEFAULT 0,
  released_amount    NUMERIC(40, 0) NOT NULL DEFAULT 0,
  status             TEXT NOT NULL DEFAULT 'active', -- active|completed|refunded|disputed
  create_tx_digest   TEXT,
  last_tx_digest     TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onchain_escrows_repair   ON onchain_escrows (repair_request_id);
CREATE INDEX IF NOT EXISTS idx_onchain_escrows_customer ON onchain_escrows (customer_address);
CREATE INDEX IF NOT EXISTS idx_onchain_escrows_status   ON onchain_escrows (status);

-- Indexer checkpoint so polling resumes where it left off across restarts.
CREATE TABLE IF NOT EXISTS indexer_cursors (
  name       TEXT PRIMARY KEY,
  tx_digest  TEXT,
  event_seq  TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- migrate:down
DROP TABLE IF EXISTS indexer_cursors;
DROP TABLE IF EXISTS onchain_escrows;
