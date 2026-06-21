-- migrate:up
-- onchain_escrows mirrors permissionless on-chain events: any address can create
-- an escrow with any repair_id (e.g. test/seed escrows). A hard FK is therefore
-- wrong for an indexer — drop it and keep repair_request_id as a soft reference.
ALTER TABLE onchain_escrows DROP CONSTRAINT IF EXISTS onchain_escrows_repair_request_id_fkey;

-- migrate:down
-- Re-adding the FK can fail if orphan rows exist; intentionally a no-op.
