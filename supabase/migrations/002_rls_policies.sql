ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Service can insert users"
  ON users FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Members can read their group"
  ON groups FOR SELECT
  USING (
    user_a_id = auth.uid() OR user_b_id = auth.uid()
  );

CREATE POLICY "User A can update group"
  ON groups FOR UPDATE
  USING (user_a_id = auth.uid());

CREATE POLICY "Authenticated users can create groups"
  ON groups FOR INSERT
  WITH CHECK (auth.uid() = user_a_id);

CREATE POLICY "Inviters can read their invitations"
  ON invitations FOR SELECT
  USING (inviter_id = auth.uid());

CREATE POLICY "Users can read invitations to their email"
  ON invitations FOR SELECT
  USING (
    invitee_email IN (SELECT email FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Group members can invite"
  ON invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM groups
      WHERE id = invitations.group_id
      AND user_a_id = auth.uid()
    )
  );

CREATE POLICY "Users can accept invitations"
  ON invitations FOR UPDATE
  USING (
    invitee_email IN (SELECT email FROM users WHERE id = auth.uid())
  );
