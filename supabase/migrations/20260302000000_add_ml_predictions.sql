-- Add ML Predictions Table
-- This migration adds support for storing ML prediction results

-- Create ml_predictions table
CREATE TABLE IF NOT EXISTS ml_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id TEXT NOT NULL,
    prediction_type TEXT NOT NULL CHECK (prediction_type IN ('churn', 'clv', 'anomaly', 'revenue')),
    prediction_data JSONB NOT NULL,
    confidence FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ml_predictions_customer_id ON ml_predictions(customer_id);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_type ON ml_predictions(prediction_type);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_created_at ON ml_predictions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_expires_at ON ml_predictions(expires_at);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_customer_type ON ml_predictions(customer_id, prediction_type);

-- Add ml_config column to agents table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agents' AND column_name = 'ml_config'
    ) THEN
        ALTER TABLE agents ADD COLUMN ml_config JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Create function to cleanup expired predictions
CREATE OR REPLACE FUNCTION cleanup_expired_predictions()
RETURNS void AS $$
BEGIN
    DELETE FROM ml_predictions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create function to get latest prediction
CREATE OR REPLACE FUNCTION get_latest_prediction(
    p_customer_id TEXT,
    p_prediction_type TEXT
)
RETURNS TABLE (
    id UUID,
    customer_id TEXT,
    prediction_type TEXT,
    prediction_data JSONB,
    confidence FLOAT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.customer_id,
        p.prediction_type,
        p.prediction_data,
        p.confidence,
        p.created_at
    FROM ml_predictions p
    WHERE p.customer_id = p_customer_id
        AND p.prediction_type = p_prediction_type
        AND p.expires_at > NOW()
    ORDER BY p.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies
ALTER TABLE ml_predictions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for authenticated users (adjust based on your needs)
DROP POLICY IF EXISTS "Allow all operations on ml_predictions" ON ml_predictions;
CREATE POLICY "Allow all operations on ml_predictions"
    ON ml_predictions
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy: Allow public read access (adjust based on your needs)
DROP POLICY IF EXISTS "Allow public read on ml_predictions" ON ml_predictions;
CREATE POLICY "Allow public read on ml_predictions"
    ON ml_predictions
    FOR SELECT
    TO anon
    USING (true);

-- Add comments for documentation
COMMENT ON TABLE ml_predictions IS 'Stores ML prediction results with expiration';
COMMENT ON COLUMN ml_predictions.prediction_type IS 'Type of prediction: churn, clv, anomaly, or revenue';
COMMENT ON COLUMN ml_predictions.prediction_data IS 'JSON data containing prediction results';
COMMENT ON COLUMN ml_predictions.confidence IS 'Confidence score of the prediction (0-1)';
COMMENT ON COLUMN ml_predictions.expires_at IS 'When this prediction expires and should be recalculated';
COMMENT ON COLUMN ml_predictions.metadata IS 'Additional metadata about the prediction';
