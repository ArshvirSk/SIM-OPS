-- ML Predictions Migration - Final Version
-- Copy and paste this entire file into Supabase SQL Editor

-- Drop existing table to start fresh
DROP TABLE IF EXISTS predictions CASCADE;

-- Create predictions table
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT NOT NULL,
  prediction_type TEXT NOT NULL CHECK (prediction_type IN ('churn', 'clv', 'anomaly', 'revenue')),
  prediction_value NUMERIC NOT NULL,
  confidence NUMERIC NOT NULL DEFAULT 0.85,
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical', 'premium')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 hour'
);

-- Create indexes
CREATE INDEX idx_predictions_customer ON predictions(customer_id);
CREATE INDEX idx_predictions_type ON predictions(prediction_type);
CREATE INDEX idx_predictions_created ON predictions(created_at DESC);
CREATE INDEX idx_predictions_risk ON predictions(risk_level);

-- Enable RLS
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated read" ON predictions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert" ON predictions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON predictions FOR UPDATE TO authenticated USING (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON predictions TO authenticated;

-- Verify
SELECT 'Migration completed successfully!' as status;
SELECT COUNT(*) as row_count FROM predictions;
