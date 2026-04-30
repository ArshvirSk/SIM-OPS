-- ============================================================
-- Migration: Add status column to customers + create transactions table
-- Required for SimulatorEngine (Acme Corp demo) to work correctly
-- ============================================================

-- 1. Add 'status' column to customers table
--    Possible values: 'active', 'at_risk', 'churned', 'inactive'
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'at_risk', 'churned', 'inactive'));

-- 2. Back-fill status for existing seed customers based on engagement score
--    (high churn-risk customers get 'at_risk', very low get 'churned')
UPDATE customers
  SET status = CASE
    WHEN engagement_score < 0.15 THEN 'at_risk'
    WHEN engagement_score < 0.25 THEN 'at_risk'
    ELSE 'active'
  END
WHERE status = 'active';

-- 3. Create index on status for fast queries
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);

-- ============================================================
-- 4. Create transactions table (used by SimulatorEngine + Acme metrics)
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id  UUID        NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  amount       DECIMAL(10,2) NOT NULL DEFAULT 0,
  status       TEXT        NOT NULL DEFAULT 'completed'
                CHECK (status IN ('completed', 'failed', 'pending', 'refunded')),
  description  TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_transactions_customer_id  ON transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status        ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at    ON transactions(created_at DESC);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS transactions_updated_at_trigger ON transactions;
CREATE TRIGGER transactions_updated_at_trigger
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_transactions_updated_at();

-- ============================================================
-- 5. Disable RLS on new tables (consistent with 20260208000002_disable_rls.sql)
-- ============================================================
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;

-- Log
DO $$
BEGIN
  RAISE NOTICE 'Migration complete: customers.status added, transactions table created';
END $$;
