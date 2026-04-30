-- =============================================================================
-- SolarWinds-Inspired Incident Response System
-- Creates the incidents table for tracking operational incidents with
-- P1/P2/P3/P4 priority levels, lifecycle management, and MTTA/MTTR tracking
-- =============================================================================

CREATE TABLE IF NOT EXISTS incidents (
  id            UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  title         TEXT         NOT NULL,
  description   TEXT,
  severity      TEXT         NOT NULL DEFAULT 'P3'
                  CHECK (severity IN ('P1', 'P2', 'P3', 'P4')),
  status        TEXT         NOT NULL DEFAULT 'open'
                  CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  source        TEXT         NOT NULL DEFAULT 'manual'
                  CHECK (source IN ('agent', 'ml', 'manual', 'alert')),
  source_id     TEXT,
  customer_id   TEXT,
  assigned_to   TEXT,
  acknowledged_at TIMESTAMPTZ,
  resolved_at   TIMESTAMPTZ,
  runbook       TEXT,
  tags          TEXT[]       DEFAULT '{}',
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS incidents_status_idx     ON incidents(status);
CREATE INDEX IF NOT EXISTS incidents_severity_idx   ON incidents(severity);
CREATE INDEX IF NOT EXISTS incidents_created_at_idx ON incidents(created_at DESC);
CREATE INDEX IF NOT EXISTS incidents_customer_idx   ON incidents(customer_id);

-- Disable RLS for development (same pattern as other tables)
ALTER TABLE incidents DISABLE ROW LEVEL SECURITY;

-- Seed realistic demo incidents
INSERT INTO incidents
  (title, description, severity, status, source, customer_id, assigned_to,
   acknowledged_at, resolved_at, runbook, tags)
VALUES
  (
    'Critical Churn Risk: Enterprise Account ACME Corp',
    'AI Agent detected 94% churn probability for ACME Corp. Revenue at risk: $125,000/year. Customer last active 18 days ago. Immediate executive intervention required.',
    'P1', 'investigating', 'agent', 'cust_001', 'sarah@company.com',
    NOW() - INTERVAL '2 hours', NULL,
    E'1. Schedule executive call within 24h\n2. Prepare custom retention offer (up to 30% discount)\n3. Review contract renewal options and timeline\n4. Loop in customer success director\n5. Document all touchpoints in CRM',
    ARRAY['churn', 'enterprise', 'revenue-critical', 'gemini-detected']
  ),
  (
    'High Churn Risk: SMB Customer TechStart Inc',
    'Churn probability 78%. Last login: 12 days ago. Payment overdue by 8 days. Usage dropped 62% in last 30 days.',
    'P2', 'open', 'agent', 'cust_002', NULL,
    NULL, NULL,
    E'1. Send personalized re-engagement email within 4h\n2. Offer 1-month extension or credit\n3. Schedule product demo/success call\n4. Identify usage drop-off reason',
    ARRAY['churn', 'smb', 'payment-overdue', 'usage-drop']
  ),
  (
    'Revenue Anomaly Detected: Unusual Billing Pattern',
    'ML model flagged abnormal transaction patterns across 3 enterprise accounts. Potential revenue leakage of $8,500. Transactions deviate 3.2σ from baseline.',
    'P2', 'investigating', 'ml', NULL, 'finance@company.com',
    NOW() - INTERVAL '1 hour', NULL,
    E'1. Review flagged transactions in billing system\n2. Cross-reference with CRM records\n3. Contact affected accounts for verification\n4. Engage fraud detection if confirmed',
    ARRAY['anomaly', 'billing', 'revenue', 'ml-detected']
  ),
  (
    'ML Prediction Service: High Inference Latency',
    'Average ML inference time exceeded 5s threshold (current: 8.2s). Impact: delayed customer churn scoring and action agent response time.',
    'P3', 'resolved', 'ml', NULL, 'engineering@company.com',
    NOW() - INTERVAL '5 hours', NOW() - INTERVAL '3 hours',
    E'1. Check ML service health endpoint\n2. Review prediction queue depth\n3. Scale up inference workers if needed\n4. Monitor latency for 1h post-fix',
    ARRAY['ml', 'performance', 'system', 'latency']
  ),
  (
    'Cohort Activation Drop: Q1-2025 Customers',
    'Q1-2025 customer cohort shows 35% decrease in activation rate. Affects 12 customers. At-risk revenue: $42,000/year.',
    'P3', 'open', 'agent', NULL, NULL,
    NULL, NULL,
    E'1. Segment analysis of affected cohort\n2. Identify common drop-off points in onboarding\n3. Design targeted intervention campaign\n4. A/B test new activation flow',
    ARRAY['churn', 'cohort', 'activation', 'onboarding']
  ),
  (
    'Workflow Failure: Weekly Report Generation',
    'Scheduled weekly state-of-startup report failed to generate. 3 automatic retries exhausted. Last successful run: 7 days ago.',
    'P4', 'closed', 'agent', NULL, 'ops@company.com',
    NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day',
    E'1. Check Supabase connection and query limits\n2. Verify data completeness for report period\n3. Manually trigger report generation\n4. Review error logs for root cause',
    ARRAY['workflow', 'reporting', 'automation']
  ),
  (
    'Critical: Multiple High-Risk Customers in Same Segment',
    'Gemini Pro detected coordinated churn signal across 5 customers in the "SaaS-Growth" segment. Combined ARR at risk: $310,000.',
    'P1', 'open', 'agent', NULL, NULL,
    NULL, NULL,
    E'1. Convene emergency customer success meeting\n2. Assign dedicated CSM to each account\n3. Prepare segment-specific retention strategy\n4. Escalate to VP of Customer Success\n5. Review pricing and product-market fit for segment',
    ARRAY['churn', 'segment', 'critical', 'gemini-pro', 'revenue-critical']
  );
