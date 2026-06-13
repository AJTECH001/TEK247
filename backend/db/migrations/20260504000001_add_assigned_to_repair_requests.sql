-- migrate:up
ALTER TABLE repair_requests
  ADD COLUMN IF NOT EXISTS assigned_to BIGINT REFERENCES users(id) ON DELETE SET NULL;

-- migrate:down
ALTER TABLE repair_requests DROP COLUMN IF EXISTS assigned_to;
