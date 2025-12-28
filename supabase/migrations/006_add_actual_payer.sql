-- Add actual_payer columns to track the editable actual payer (separate from import source)
-- payer_type/payer_user_id: Immutable import source (who imported)
-- actual_payer_type/actual_payer_user_id: Editable actual payer (who paid, for settlement)

-- Step 1: Add columns without NOT NULL constraint
ALTER TABLE transactions 
ADD COLUMN actual_payer_type TEXT CHECK (actual_payer_type IN ('UserA', 'UserB', 'Common'));

ALTER TABLE transactions 
ADD COLUMN actual_payer_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Step 2: Migrate existing data - copy payer_* to actual_payer_*
UPDATE transactions 
SET actual_payer_type = payer_type,
    actual_payer_user_id = payer_user_id;

-- Step 3: Add NOT NULL constraint after data migration
ALTER TABLE transactions 
ALTER COLUMN actual_payer_type SET NOT NULL;

-- Step 4: Add indexes for query performance
CREATE INDEX idx_transactions_actual_payer_type ON transactions(actual_payer_type);
CREATE INDEX idx_transactions_actual_payer_user ON transactions(actual_payer_user_id);

-- Add comments for documentation
COMMENT ON COLUMN transactions.payer_type IS 'インポート時に設定された支払い元タイプ（不変）';
COMMENT ON COLUMN transactions.payer_user_id IS 'インポート時に設定された支払い者のユーザーID（不変）';
COMMENT ON COLUMN transactions.actual_payer_type IS '精算計算に使用される実際の支払い元タイプ（編集可能）';
COMMENT ON COLUMN transactions.actual_payer_user_id IS '精算計算に使用される実際の支払い者のユーザーID（編集可能）';
