-- Create customers table for SIM-OPS
-- This table stores customer data used for ML predictions

CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Activity tracking
    last_login TIMESTAMPTZ,
    last_activity TIMESTAMPTZ,
    
    -- Usage metrics
    support_tickets INTEGER DEFAULT 0,
    payment_failures INTEGER DEFAULT 0,
    feature_usage_rate DECIMAL(5,2) DEFAULT 0.5,
    avg_session_duration DECIMAL(10,2) DEFAULT 10,
    
    -- Financial data
    total_spend DECIMAL(10,2) DEFAULT 0,
    total_purchases INTEGER DEFAULT 0,
    avg_purchase_value DECIMAL(10,2) DEFAULT 0,
    
    -- Engagement
    discount_usage INTEGER DEFAULT 0,
    referrals_made INTEGER DEFAULT 0,
    engagement_score DECIMAL(5,2) DEFAULT 0.5,
    
    -- Constraints
    CONSTRAINT customers_feature_usage_check CHECK (feature_usage_rate >= 0 AND feature_usage_rate <= 1),
    CONSTRAINT customers_engagement_check CHECK (engagement_score >= 0 AND engagement_score <= 1)
);

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_customers_last_activity ON customers(last_activity DESC);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- Seed with sample customers for testing
INSERT INTO customers (id, email, name, created_at, last_login, last_activity, support_tickets, payment_failures, feature_usage_rate, avg_session_duration, total_spend, total_purchases, avg_purchase_value, discount_usage, referrals_made, engagement_score)
VALUES
    ('c0000001-0000-4000-8000-000000000001', 'alice.johnson@example.com', 'Alice Johnson', NOW() - INTERVAL '180 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day', 2, 0, 0.85, 25.5, 2500.00, 12, 208.33, 1, 3, 0.82),
    ('c0000002-0000-4000-8000-000000000002', 'bob.smith@example.com', 'Bob Smith', NOW() - INTERVAL '90 days', NOW() - INTERVAL '1 day', NOW() - INTERVAL '6 hours', 1, 0, 0.92, 32.0, 4500.00, 18, 250.00, 2, 5, 0.91),
    ('c0000003-0000-4000-8000-000000000003', 'carol.white@example.com', 'Carol White', NOW() - INTERVAL '45 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', 5, 1, 0.45, 12.0, 800.00, 4, 200.00, 0, 0, 0.38),
    ('c0000004-0000-4000-8000-000000000004', 'david.brown@example.com', 'David Brown', NOW() - INTERVAL '365 days', NOW() - INTERVAL '35 days', NOW() - INTERVAL '30 days', 8, 2, 0.22, 8.5, 1200.00, 6, 200.00, 3, 1, 0.21),
    ('c0000005-0000-4000-8000-000000000005', 'emma.davis@example.com', 'Emma Davis', NOW() - INTERVAL '120 days', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '30 minutes', 0, 0, 0.95, 45.0, 6200.00, 24, 258.33, 4, 8, 0.96),
    ('c0000006-0000-4000-8000-000000000006', 'frank.miller@example.com', 'Frank Miller', NOW() - INTERVAL '200 days', NOW() - INTERVAL '15 days', NOW() - INTERVAL '12 days', 6, 1, 0.35, 10.0, 950.00, 5, 190.00, 1, 0, 0.33),
    ('c0000007-0000-4000-8000-000000000007', 'grace.wilson@example.com', 'Grace Wilson', NOW() - INTERVAL '60 days', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '1 hour', 1, 0, 0.88, 28.0, 3400.00, 15, 226.67, 2, 4, 0.87),
    ('c0000008-0000-4000-8000-000000000008', 'henry.moore@example.com', 'Henry Moore', NOW() - INTERVAL '150 days', NOW() - INTERVAL '20 days', NOW() - INTERVAL '18 days', 9, 3, 0.18, 6.0, 600.00, 3, 200.00, 0, 0, 0.15),
    ('c0000009-0000-4000-8000-000000000009', 'isabel.taylor@example.com', 'Isabel Taylor', NOW() - INTERVAL '30 days', NOW() - INTERVAL '12 hours', NOW() - INTERVAL '2 hours', 0, 0, 0.90, 35.0, 1800.00, 8, 225.00, 1, 2, 0.89),
    ('c0000010-0000-4000-8000-000000000010', 'jack.anderson@example.com', 'Jack Anderson', NOW() - INTERVAL '270 days', NOW() - INTERVAL '8 days', NOW() - INTERVAL '7 days', 4, 0, 0.68, 18.0, 3200.00, 16, 200.00, 3, 2, 0.65),
    ('c0000011-0000-4000-8000-000000000011', 'kate.thomas@example.com', 'Kate Thomas', NOW() - INTERVAL '100 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day', 2, 0, 0.78, 22.0, 2900.00, 13, 223.08, 2, 3, 0.76),
    ('c0000012-0000-4000-8000-000000000012', 'leo.jackson@example.com', 'Leo Jackson', NOW() - INTERVAL '50 days', NOW() - INTERVAL '25 days', NOW() - INTERVAL '24 days', 7, 2, 0.28, 9.0, 750.00, 4, 187.50, 1, 0, 0.25),
    ('c0000013-0000-4000-8000-000000000013', 'maria.garcia@example.com', 'Maria Garcia', NOW() - INTERVAL '75 days', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '1 hour', 1, 0, 0.86, 30.0, 4100.00, 19, 215.79, 3, 6, 0.85),
    ('c0000014-0000-4000-8000-000000000014', 'nathan.martin@example.com', 'Nathan Martin', NOW() - INTERVAL '220 days', NOW() - INTERVAL '40 days', NOW() - INTERVAL '38 days', 10, 4, 0.12, 5.0, 450.00, 2, 225.00, 0, 0, 0.10),
    ('c0000015-0000-4000-8000-000000000015', 'olivia.lee@example.com', 'Olivia Lee', NOW() - INTERVAL '40 days', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '3 hours', 0, 0, 0.93, 38.0, 5200.00, 21, 247.62, 4, 7, 0.94),
    ('c0000016-0000-4000-8000-000000000016', 'paul.harris@example.com', 'Paul Harris', NOW() - INTERVAL '160 days', NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days', 5, 1, 0.55, 15.0, 1900.00, 9, 211.11, 2, 1, 0.52),
    ('c0000017-0000-4000-8000-000000000017', 'quinn.clark@example.com', 'Quinn Clark', NOW() - INTERVAL '85 days', NOW() - INTERVAL '1 day', NOW() - INTERVAL '8 hours', 1, 0, 0.82, 27.0, 3600.00, 17, 211.76, 2, 4, 0.80),
    ('c0000018-0000-4000-8000-000000000018', 'rachel.lewis@example.com', 'Rachel Lewis', NOW() - INTERVAL '300 days', NOW() - INTERVAL '50 days', NOW() - INTERVAL '48 days', 12, 5, 0.08, 4.0, 320.00, 2, 160.00, 0, 0, 0.05),
    ('c0000019-0000-4000-8000-000000000019', 'sam.robinson@example.com', 'Sam Robinson', NOW() - INTERVAL '65 days', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '30 minutes', 0, 0, 0.91, 33.0, 4700.00, 20, 235.00, 3, 5, 0.92),
    ('c0000020-0000-4000-8000-000000000020', 'tina.walker@example.com', 'Tina Walker', NOW() - INTERVAL '110 days', NOW() - INTERVAL '12 days', NOW() - INTERVAL '11 days', 6, 1, 0.42, 11.0, 1100.00, 6, 183.33, 1, 0, 0.40),
    ('c0000021-0000-4000-8000-000000000021', 'uma.hall@example.com', 'Uma Hall', NOW() - INTERVAL '55 days', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '2 hours', 1, 0, 0.87, 29.0, 3900.00, 18, 216.67, 2, 5, 0.86),
    ('c0000022-0000-4000-8000-000000000022', 'victor.allen@example.com', 'Victor Allen', NOW() - INTERVAL '190 days', NOW() - INTERVAL '28 days', NOW() - INTERVAL '26 days', 8, 2, 0.25, 7.5, 680.00, 4, 170.00, 1, 0, 0.22),
    ('c0000023-0000-4000-8000-000000000023', 'wendy.young@example.com', 'Wendy Young', NOW() - INTERVAL '70 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days', 2, 0, 0.80, 24.0, 3300.00, 15, 220.00, 3, 3, 0.78),
    ('c0000024-0000-4000-8000-000000000024', 'xavier.king@example.com', 'Xavier King', NOW() - INTERVAL '250 days', NOW() - INTERVAL '45 days', NOW() - INTERVAL '42 days', 11, 3, 0.15, 5.5, 520.00, 3, 173.33, 0, 0, 0.12),
    ('c0000025-0000-4000-8000-000000000025', 'yara.wright@example.com', 'Yara Wright', NOW() - INTERVAL '35 days', NOW() - INTERVAL '8 hours', NOW() - INTERVAL '4 hours', 0, 0, 0.94, 40.0, 5500.00, 22, 250.00, 4, 9, 0.95),
    ('c0000026-0000-4000-8000-000000000026', 'zack.lopez@example.com', 'Zack Lopez', NOW() - INTERVAL '125 days', NOW() - INTERVAL '16 days', NOW() - INTERVAL '14 days', 7, 1, 0.38, 10.5, 1050.00, 6, 175.00, 2, 0, 0.35),
    ('c0000027-0000-4000-8000-000000000027', 'amy.hill@example.com', 'Amy Hill', NOW() - INTERVAL '80 days', NOW() - INTERVAL '1 day', NOW() - INTERVAL '12 hours', 1, 0, 0.84, 26.0, 3700.00, 16, 231.25, 2, 4, 0.83),
    ('c0000028-0000-4000-8000-000000000028', 'ben.scott@example.com', 'Ben Scott', NOW() - INTERVAL '210 days', NOW() - INTERVAL '32 days', NOW() - INTERVAL '30 days', 9, 2, 0.20, 6.5, 590.00, 3, 196.67, 0, 0, 0.18),
    ('c0000029-0000-4000-8000-000000000029', 'chloe.green@example.com', 'Chloe Green', NOW() - INTERVAL '48 days', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '1 hour', 0, 0, 0.89, 31.0, 4400.00, 19, 231.58, 3, 6, 0.88),
    ('c0000030-0000-4000-8000-000000000030', 'dan.adams@example.com', 'Dan Adams', NOW() - INTERVAL '140 days', NOW() - INTERVAL '18 days', NOW() - INTERVAL '16 days', 6, 1, 0.48, 13.0, 1600.00, 8, 200.00, 2, 1, 0.45),
    ('c0000031-0000-4000-8000-000000000031', 'ella.baker@example.com', 'Ella Baker', NOW() - INTERVAL '62 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day', 1, 0, 0.85, 28.0, 3800.00, 17, 223.53, 2, 4, 0.84),
    ('c0000032-0000-4000-8000-000000000032', 'finn.nelson@example.com', 'Finn Nelson', NOW() - INTERVAL '280 days', NOW() - INTERVAL '55 days', NOW() - INTERVAL '52 days', 13, 4, 0.10, 4.5, 380.00, 2, 190.00, 0, 0, 0.08),
    ('c0000033-0000-4000-8000-000000000033', 'gina.carter@example.com', 'Gina Carter', NOW() - INTERVAL '52 days', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '2 hours', 0, 0, 0.90, 34.0, 4900.00, 20, 245.00, 3, 7, 0.91),
    ('c0000034-0000-4000-8000-000000000034', 'hank.mitchell@example.com', 'Hank Mitchell', NOW() - INTERVAL '170 days', NOW() - INTERVAL '22 days', NOW() - INTERVAL '20 days', 7, 2, 0.32, 9.5, 880.00, 5, 176.00, 1, 0, 0.30),
    ('c0000035-0000-4000-8000-000000000035', 'iris.perez@example.com', 'Iris Perez', NOW() - INTERVAL '72 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days', 2, 0, 0.81, 25.0, 3500.00, 16, 218.75, 2, 3, 0.79),
    ('c0000036-0000-4000-8000-000000000036', 'jake.roberts@example.com', 'Jake Roberts', NOW() - INTERVAL '95 days', NOW() - INTERVAL '1 day', NOW() - INTERVAL '18 hours', 1, 0, 0.83, 27.0, 3900.00, 18, 216.67, 3, 5, 0.82),
    ('c0000037-0000-4000-8000-000000000037', 'kara.turner@example.com', 'Kara Turner', NOW() - INTERVAL '240 days', NOW() - INTERVAL '38 days', NOW() - INTERVAL '36 days', 10, 3, 0.18, 6.0, 570.00, 3, 190.00, 0, 0, 0.15),
    ('c0000038-0000-4000-8000-000000000038', 'luke.phillips@example.com', 'Luke Phillips', NOW() - INTERVAL '58 days', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '2 hours', 0, 0, 0.88, 32.0, 4600.00, 21, 219.05, 3, 6, 0.89),
    ('c0000039-0000-4000-8000-000000000039', 'mia.campbell@example.com', 'Mia Campbell', NOW() - INTERVAL '155 days', NOW() - INTERVAL '14 days', NOW() - INTERVAL '12 days', 5, 1, 0.52, 14.0, 1850.00, 9, 205.56, 2, 1, 0.50),
    ('c0000040-0000-4000-8000-000000000040', 'noah.parker@example.com', 'Noah Parker', NOW() - INTERVAL '42 days', NOW() - INTERVAL '1 day', NOW() - INTERVAL '10 hours', 0, 0, 0.92, 36.0, 5100.00, 22, 231.82, 4, 8, 0.93),
    ('c0000041-0000-4000-8000-000000000041', 'olive.evans@example.com', 'Olive Evans', NOW() - INTERVAL '88 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day', 2, 0, 0.79, 23.0, 3200.00, 15, 213.33, 2, 3, 0.77),
    ('c0000042-0000-4000-8000-000000000042', 'pete.edwards@example.com', 'Pete Edwards', NOW() - INTERVAL '260 days', NOW() - INTERVAL '48 days', NOW() - INTERVAL '45 days', 12, 4, 0.12, 5.0, 490.00, 3, 163.33, 0, 0, 0.10),
    ('c0000043-0000-4000-8000-000000000043', 'rose.collins@example.com', 'Rose Collins', NOW() - INTERVAL '46 days', NOW() - INTERVAL '7 hours', NOW() - INTERVAL '3 hours', 0, 0, 0.91, 35.0, 4800.00, 20, 240.00, 3, 7, 0.92),
    ('c0000044-0000-4000-8000-000000000044', 'seth.stewart@example.com', 'Seth Stewart', NOW() - INTERVAL '135 days', NOW() - INTERVAL '17 days', NOW() - INTERVAL '15 days', 6, 1, 0.45, 12.0, 1400.00, 7, 200.00, 1, 0, 0.42),
    ('c0000045-0000-4000-8000-000000000045', 'tara.sanchez@example.com', 'Tara Sanchez', NOW() - INTERVAL '68 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day', 1, 0, 0.84, 26.0, 3700.00, 17, 217.65, 2, 4, 0.83),
    ('c0000046-0000-4000-8000-000000000046', 'wade.morris@example.com', 'Wade Morris', NOW() - INTERVAL '92 days', NOW() - INTERVAL '1 day', NOW() - INTERVAL '16 hours', 1, 0, 0.82, 28.0, 3800.00, 18, 211.11, 3, 5, 0.81),
    ('c0000047-0000-4000-8000-000000000047', 'vera.rogers@example.com', 'Vera Rogers', NOW() - INTERVAL '230 days', NOW() - INTERVAL '36 days', NOW() - INTERVAL '34 days', 11, 3, 0.16, 5.5, 550.00, 3, 183.33, 0, 0, 0.13),
    ('c0000048-0000-4000-8000-000000000048', 'will.reed@example.com', 'Will Reed', NOW() - INTERVAL '54 days', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '2 hours', 0, 0, 0.89, 33.0, 4700.00, 21, 223.81, 3, 6, 0.90),
    ('c0000049-0000-4000-8000-000000000049', 'xena.cook@example.com', 'Xena Cook', NOW() - INTERVAL '148 days', NOW() - INTERVAL '13 days', NOW() - INTERVAL '11 days', 5, 1, 0.50, 13.5, 1750.00, 9, 194.44, 2, 1, 0.48),
    ('c0000050-0000-4000-8000-000000000050', 'york.morgan@example.com', 'York Morgan', NOW() - INTERVAL '38 days', NOW() - INTERVAL '1 day', NOW() - INTERVAL '8 hours', 0, 0, 0.93, 37.0, 5300.00, 23, 230.43, 4, 9, 0.94)
ON CONFLICT (id) DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER customers_updated_at_trigger
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_customers_updated_at();

-- Log migration
DO $$
BEGIN
    RAISE NOTICE 'Customers table created with 50 sample customers';
END $$;
