-- Add payer_user_id column to transactions table
-- This column stores the actual user who paid for the transaction
-- NULL is allowed for backward compatibility with existing records

ALTER TABLE transactions
ADD COLUMN payer_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Create index for efficient lookups
CREATE INDEX idx_transactions_payer_user ON transactions(payer_user_id);
