-- Create predictions table ONLY
-- Run this first to diagnose the issue

-- Drop table if it exists (to start fresh)
DROP TABLE IF EXISTS predictions CASCADE;

-- Create the table
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT NOT NULL,
  prediction_type TEXT NOT NULL,
  prediction_value NUMERIC NOT NULL,
  confidence NUMERIC NOT NULL DEFAULT 0.85,
  risk_level TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 hour'
);

-- Verify table was created
SELECT 'Table created successfully!' as status;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'predictions';
