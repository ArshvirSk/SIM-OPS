-- ML Predictions Table Migration
-- Stores ML model predictions for tracking and analysis

-- Create predictions table
CREATE TABLE IF NOT EXISTS predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id TEXT NOT NULL,
  prediction_type TEXT NOT NULL CHECK (prediction_type IN ('churn', 'clv', 'anomaly', 'revenue')),
  prediction_value NUMERIC NOT NULL,
  confidence NUMERIC NOT NULL DEFAULT 0.85,
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical', 'premium')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 hour'
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_predictions_customer ON predictions(customer_id);
CREATE INDEX IF NOT EXISTS idx_predictions_type ON predictions(prediction_type);
CREATE INDEX IF NOT EXISTS idx_predictions_created ON predictions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_risk ON predictions(risk_level);
CREATE INDEX IF NOT EXISTS idx_predictions_expires ON predictions(expires_at);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_predictions_customer_type ON predictions(customer_id, prediction_type);

-- Add RLS policies
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated read predictions" ON predictions;
DROP POLICY IF EXISTS "Allow authenticated insert predictions" ON predictions;
DROP POLICY IF EXISTS "Allow authenticated update predictions" ON predictions;

-- Policy: Allow authenticated users to read predictions
CREATE POLICY "Allow authenticated read predictions"
  ON predictions FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow authenticated users to insert predictions
CREATE POLICY "Allow authenticated insert predictions"
  ON predictions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Allow authenticated users to update predictions
CREATE POLICY "Allow authenticated update predictions"
  ON predictions FOR UPDATE
  TO authenticated
  USING (true);

-- Add ml_config column to agents table
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS ml_config JSONB DEFAULT '{
  "enabled": false,
  "model_types": [],
  "thresholds": {
    "churn_critical": 0.8,
    "churn_high": 0.6,
    "clv_premium": 10000,
    "criticalCount": 10
  },
  "auto_trigger": false,
  "schedule": "0 */6 * * *"
}'::jsonb;

-- Create function to cleanup expired predictions
DROP FUNCTION IF EXISTS cleanup_expired_predictions();
CREATE FUNCTION cleanup_expired_predictions()
RETURNS void AS $$
BEGIN
  DELETE FROM predictions
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create function to get latest prediction for customer
DROP FUNCTION IF EXISTS get_latest_prediction(TEXT, TEXT);
CREATE FUNCTION get_latest_prediction(
  p_customer_id TEXT,
  p_prediction_type TEXT
)
RETURNS TABLE (
  id UUID,
  prediction_value NUMERIC,
  confidence NUMERIC,
  risk_level TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.prediction_value,
    p.confidence,
    p.risk_level,
    p.metadata,
    p.created_at
  FROM predictions p
  WHERE p.customer_id = p_customer_id
    AND p.prediction_type = p_prediction_type
    AND p.expires_at > NOW()
  ORDER BY p.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Create function to get high-risk customers
DROP FUNCTION IF EXISTS get_high_risk_customers(TEXT, INTEGER);
CREATE FUNCTION get_high_risk_customers(
  p_risk_level TEXT DEFAULT 'high',
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  customer_id TEXT,
  prediction_value NUMERIC,
  risk_level TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (p.customer_id)
    p.customer_id,
    p.prediction_value,
    p.risk_level,
    p.created_at
  FROM predictions p
  WHERE p.prediction_type = 'churn'
    AND p.risk_level IN ('high', 'critical')
    AND p.expires_at > NOW()
  ORDER BY p.customer_id, p.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE predictions IS 'Stores ML model predictions with expiration';
COMMENT ON COLUMN predictions.customer_id IS 'Customer identifier';
COMMENT ON COLUMN predictions.prediction_type IS 'Type of prediction: churn, clv, anomaly, revenue';
COMMENT ON COLUMN predictions.prediction_value IS 'Predicted value (probability, amount, score)';
COMMENT ON COLUMN predictions.confidence IS 'Model confidence score (0-1)';
COMMENT ON COLUMN predictions.risk_level IS 'Risk classification';
COMMENT ON COLUMN predictions.metadata IS 'Additional prediction data (factors, recommendations)';
COMMENT ON COLUMN predictions.expires_at IS 'When prediction expires (default 1 hour)';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON predictions TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_predictions() TO authenticated;
GRANT EXECUTE ON FUNCTION get_latest_prediction(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_high_risk_customers(TEXT, INTEGER) TO authenticated;

-- Migration complete
SELECT 'ML Predictions table migration completed successfully!' as message;
