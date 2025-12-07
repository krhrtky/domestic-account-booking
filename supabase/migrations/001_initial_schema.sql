CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(name) > 0 AND length(name) <= 100),
  email TEXT UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
  group_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL DEFAULT 'Household' CHECK (length(name) > 0 AND length(name) <= 100),
  ratio_a INTEGER NOT NULL DEFAULT 50 CHECK (ratio_a > 0 AND ratio_a < 100),
  ratio_b INTEGER NOT NULL DEFAULT 50 CHECK (ratio_b > 0 AND ratio_b < 100),
  user_a_id UUID NOT NULL,
  user_b_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT ratio_sum CHECK (ratio_a + ratio_b = 100),
  CONSTRAINT unique_user_pair CHECK (user_a_id != user_b_id)
);

ALTER TABLE users ADD CONSTRAINT fk_users_group FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL;
ALTER TABLE groups ADD CONSTRAINT fk_groups_user_a FOREIGN KEY (user_a_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE groups ADD CONSTRAINT fk_groups_user_b FOREIGN KEY (user_b_id) REFERENCES users(id) ON DELETE SET NULL;

CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invitee_email TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_group ON users(group_id);
CREATE INDEX idx_groups_user_a ON groups(user_a_id);
CREATE INDEX idx_groups_user_b ON groups(user_b_id);
CREATE INDEX idx_invitations_group ON invitations(group_id);
CREATE INDEX idx_invitations_email ON invitations(invitee_email);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER groups_updated_at BEFORE UPDATE ON groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
