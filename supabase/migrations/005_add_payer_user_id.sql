ALTER TABLE transactions ADD COLUMN payer_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
COMMENT ON COLUMN transactions.payer_user_id IS 'CSV明細に含まれる支払い者のユーザーID。NULLの場合はpayer_typeで判定';

CREATE INDEX idx_transactions_payer_user ON transactions(payer_user_id);
