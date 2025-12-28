-- Remove 'Common' from PayerType
-- L-BR-002: User confirmed no joint/shared bank accounts

-- Step 1: Update existing transactions with Common payer to UserA
UPDATE transactions 
SET payer_type = 'UserA'
WHERE payer_type = 'Common';

UPDATE transactions 
SET actual_payer_type = 'UserA'
WHERE actual_payer_type = 'Common';

-- Step 2: Drop existing CHECK constraints
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_payer_type_check;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_actual_payer_type_check;

-- Step 3: Add new CHECK constraints without Common
ALTER TABLE transactions 
ADD CONSTRAINT transactions_payer_type_check 
CHECK (payer_type IN ('UserA', 'UserB'));

ALTER TABLE transactions 
ADD CONSTRAINT transactions_actual_payer_type_check 
CHECK (actual_payer_type IN ('UserA', 'UserB'));
