CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  description TEXT NOT NULL CHECK (length(description) > 0 AND length(description) <= 500),
  payer_type TEXT NOT NULL CHECK (payer_type IN ('UserA', 'UserB', 'Common')),
  expense_type TEXT NOT NULL DEFAULT 'Household' CHECK (expense_type IN ('Household', 'Personal')),
  source_file_name TEXT CHECK (length(source_file_name) <= 255),
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_group ON transactions(group_id);
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_expense_type ON transactions(expense_type);

CREATE TRIGGER transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view transactions in their group"
  ON transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.group_id = transactions.group_id
    )
  );

CREATE POLICY "Users can insert transactions in their group"
  ON transactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.group_id = transactions.group_id
    )
  );

CREATE POLICY "Users can update transactions in their group"
  ON transactions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.group_id = transactions.group_id
    )
  );

CREATE POLICY "Users can delete transactions in their group"
  ON transactions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.group_id = transactions.group_id
    )
  );
