CREATE SCHEMA IF NOT EXISTS custom_auth;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS custom_auth.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_fkey;
ALTER TABLE users ADD CONSTRAINT users_id_fkey
  FOREIGN KEY (id) REFERENCES custom_auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_custom_auth_users_email ON custom_auth.users(email);

CREATE OR REPLACE FUNCTION update_custom_auth_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER custom_auth_users_updated_at BEFORE UPDATE ON custom_auth.users
  FOR EACH ROW EXECUTE FUNCTION update_custom_auth_users_updated_at();
