-- migrate:up
ALTER TABLE users ADD COLUMN sui_address VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN zklogin_salt VARCHAR(255);
ALTER TABLE users ADD COLUMN zklogin_sub VARCHAR(255) UNIQUE;
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- migrate:down
ALTER TABLE users DROP COLUMN sui_address;
ALTER TABLE users DROP COLUMN zklogin_salt;
ALTER TABLE users DROP COLUMN zklogin_sub;
ALTER TABLE users ALTER COLUMN password_hash SET NOT NULL;
