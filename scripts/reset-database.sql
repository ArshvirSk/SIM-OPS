-- ============================================
-- SIMOPS Database Reset & Initialization
-- ============================================
-- Run this in Supabase SQL Editor to completely reset your database
-- WARNING: This will DELETE ALL DATA!

-- ============================================
-- STEP 1: Drop all existing tables
-- ============================================

DROP TABLE IF EXISTS workflow_runs CASCADE;
DROP TABLE IF EXISTS risk_alerts CASCADE;
DROP TABLE IF EXISTS agent_communications CASCADE;
DROP TABLE IF EXISTS agent_decisions CASCADE;
DROP TABLE IF EXISTS agent_metrics CASCADE;
DROP TABLE IF EXISTS agent_configs CASCADE;
DROP TABLE IF EXISTS agents CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS predictions CASCADE;
DROP TABLE IF EXISTS workflows CASCADE;

-- Drop triggers and functions
DROP TRIGGER IF EXISTS auto_confirm_user_trigger ON auth.users;
DROP FUNCTION IF EXISTS auto_confirm_user();

-- Drop existing enums
DROP TYPE IF EXISTS agent_status CASCADE;
DROP TYPE IF EXISTS workflow_status CASCADE;
DROP TYPE IF EXISTS decision_severity CASCADE;

-- ============================================
-- STEP 2: Create fresh tables
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE agent_status AS ENUM ('active', 'idle', 'processing', 'error');
CREATE TYPE workflow_status AS ENUM ('active', 'paused', 'draft');
CREATE TYPE decision_severity AS ENUM ('low', 'medium', 'high', 'critical');

-- Agents table
CREATE TABLE agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    description TEXT,
    status agent_status NOT NULL DEFAULT 'idle',
    last_action TEXT,
    actions_today INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent configs table
CREATE TABLE agent_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id TEXT REFERENCES agents(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT true,
    thresholds JSONB DEFAULT '{}',
    triggers TEXT[] DEFAULT '{}',
    output_targets TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(agent_id)
);

-- Agent decisions table
CREATE TABLE agent_decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id TEXT REFERENCES agents(id) ON DELETE CASCADE,
    input TEXT NOT NULL,
    reasoning TEXT NOT NULL,
    output TEXT NOT NULL,
    severity decision_severity NOT NULL DEFAULT 'low',
    confidence DECIMAL(3,2) NOT NULL DEFAULT 0.5,
    workflow_triggered TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent metrics table
CREATE TABLE agent_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id TEXT REFERENCES agents(id) ON DELETE CASCADE,
    total_decisions INTEGER DEFAULT 0,
    avg_confidence DECIMAL(3,2) DEFAULT 0,
    success_rate DECIMAL(3,2) DEFAULT 0,
    avg_response_time DECIMAL(5,2) DEFAULT 0,
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(agent_id)
);

-- Agent communications table
CREATE TABLE agent_communications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_agent_id TEXT REFERENCES agents(id) ON DELETE CASCADE,
    to_agent_id TEXT REFERENCES agents(id) ON DELETE CASCADE,
    message_type TEXT NOT NULL,
    payload JSONB DEFAULT '{}',
    latency_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflows table
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    status workflow_status NOT NULL DEFAULT 'draft',
    nodes JSONB DEFAULT '[]',
    last_run TIMESTAMPTZ,
    run_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow runs table
CREATE TABLE workflow_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    total_steps INTEGER DEFAULT 0,
    steps_completed INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Predictions table
CREATE TABLE predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL,
    input_data JSONB NOT NULL,
    prediction JSONB NOT NULL,
    confidence DECIMAL(3,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity logs table
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL,
    source TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Risk alerts table
CREATE TABLE risk_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    severity decision_severity NOT NULL DEFAULT 'low',
    source TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 3: Create indexes
-- ============================================

CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agent_decisions_agent_id ON agent_decisions(agent_id);
CREATE INDEX idx_agent_decisions_created_at ON agent_decisions(created_at DESC);
CREATE INDEX idx_agent_communications_from ON agent_communications(from_agent_id);
CREATE INDEX idx_agent_communications_to ON agent_communications(to_agent_id);
CREATE INDEX idx_agent_communications_created_at ON agent_communications(created_at DESC);
CREATE INDEX idx_workflows_status ON workflows(status);
CREATE INDEX idx_workflow_runs_workflow_id ON workflow_runs(workflow_id);
CREATE INDEX idx_workflow_runs_status ON workflow_runs(status);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_type ON activity_logs(type);
CREATE INDEX idx_risk_alerts_status ON risk_alerts(status);
CREATE INDEX idx_risk_alerts_severity ON risk_alerts(severity);

-- ============================================
-- STEP 4: Enable Row Level Security (RLS)
-- ============================================

ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_alerts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 5: Create RLS policies (allow all for now)
-- ============================================

CREATE POLICY "Allow all operations on agents" ON agents FOR ALL USING (true);
CREATE POLICY "Allow all operations on agent_configs" ON agent_configs FOR ALL USING (true);
CREATE POLICY "Allow all operations on agent_decisions" ON agent_decisions FOR ALL USING (true);
CREATE POLICY "Allow all operations on agent_metrics" ON agent_metrics FOR ALL USING (true);
CREATE POLICY "Allow all operations on agent_communications" ON agent_communications FOR ALL USING (true);
CREATE POLICY "Allow all operations on workflows" ON workflows FOR ALL USING (true);
CREATE POLICY "Allow all operations on workflow_runs" ON workflow_runs FOR ALL USING (true);
CREATE POLICY "Allow all operations on predictions" ON predictions FOR ALL USING (true);
CREATE POLICY "Allow all operations on activity_logs" ON activity_logs FOR ALL USING (true);
CREATE POLICY "Allow all operations on risk_alerts" ON risk_alerts FOR ALL USING (true);

-- ============================================
-- STEP 6: Insert sample agents
-- ============================================

INSERT INTO agents (id, name, role, description, status, actions_today) VALUES
('monitoring', 'Monitoring Agent', 'KPI deviation detection & threshold monitoring', 'Continuously monitors business KPIs against defined thresholds. Detects anomalies and deviations in real-time, triggering alerts when metrics exceed acceptable bounds.', 'active', 47),
('prediction', 'Prediction Agent', 'ML inference & risk scoring', 'Executes machine learning models to generate predictions and risk scores. Handles churn prediction, revenue forecasting, and cost anomaly detection.', 'processing', 12),
('decision', 'Decision Agent', 'Severity classification & rule engine', 'Interprets predictions and monitoring alerts to classify severity levels. Applies business rules to determine appropriate actions and workflow triggers.', 'active', 23),
('action', 'Action Agent', 'Workflow execution & automation triggers', 'Executes automated actions based on Decision Agent outputs. Triggers workflows, sends notifications, and initiates corrective measures.', 'idle', 8),
('reporting', 'Reporting Agent', 'Summary generation & audit logging', 'Generates reports, summaries, and maintains comprehensive audit logs of all system activities. Provides explainability for all agent decisions.', 'active', 156),
('feedback', 'Feedback Agent', 'Outcome tracking & retraining triggers', 'Tracks the outcomes of actions taken, measures effectiveness, and triggers model retraining when performance degrades.', 'idle', 3);

-- ============================================
-- STEP 7: Insert agent configs
-- ============================================

INSERT INTO agent_configs (agent_id, enabled, thresholds, triggers, output_targets) VALUES
('monitoring', true, '{"churnRate": 3, "revenueDeviation": 5, "userGrowth": -2}'::jsonb, ARRAY['scheduled', 'event-based'], ARRAY['Decision Agent', 'Reporting Agent']),
('prediction', true, '{"minConfidence": 0.7, "anomalyScore": 0.8}'::jsonb, ARRAY['monitoring-agent', 'scheduled'], ARRAY['Decision Agent']),
('decision', true, '{"criticalThreshold": 0.8, "highThreshold": 0.6, "mediumThreshold": 0.4}'::jsonb, ARRAY['prediction-agent', 'monitoring-agent'], ARRAY['Action Agent', 'Reporting Agent']),
('action', true, '{"maxRetries": 3, "timeoutSeconds": 30}'::jsonb, ARRAY['decision-agent'], ARRAY['Reporting Agent', 'Feedback Agent']),
('reporting', true, '{"retentionDays": 90, "summaryFrequency": 1}'::jsonb, ARRAY['all-agents'], ARRAY['Dashboard', 'Email', 'Storage']),
('feedback', true, '{"driftThreshold": 0.1, "minSuccessRate": 0.7, "evaluationWindowDays": 7}'::jsonb, ARRAY['scheduled', 'manual'], ARRAY['Prediction Agent', 'Reporting Agent']);

-- ============================================
-- STEP 8: Insert agent metrics
-- ============================================

INSERT INTO agent_metrics (agent_id, total_decisions, avg_confidence, success_rate, avg_response_time) VALUES
('monitoring', 1247, 0.89, 0.96, 0.3),
('prediction', 456, 0.84, 0.91, 2.1),
('decision', 892, 0.91, 0.94, 0.5),
('action', 324, 0.98, 0.99, 1.2),
('reporting', 4521, 0.99, 1.0, 0.2),
('feedback', 89, 0.92, 0.97, 5.0);

-- ============================================
-- STEP 9: Insert sample decisions
-- ============================================

INSERT INTO agent_decisions (agent_id, input, reasoning, output, severity, confidence, workflow_triggered, created_at) VALUES
('monitoring', 'Churn rate: 4.1% (threshold: 3%)', 'Current churn rate exceeds threshold by 37%. Historical trend shows acceleration over past 7 days. Pattern matches Q3 2025 churn spike.', 'ALERT: High churn deviation detected. Escalating to Decision Agent.', 'high', 0.94, 'Churn Risk Automation', NOW() - INTERVAL '2 minutes'),
('monitoring', 'Monthly revenue: $298K (forecast: $305K)', 'Revenue 2.3% below forecast. Within acceptable variance range of 5%. No immediate action required.', 'INFO: Minor revenue deviation logged. Continue monitoring.', 'low', 0.87, NULL, NOW() - INTERVAL '5 minutes'),
('monitoring', 'Active users: 12,847 (baseline: 11,500)', 'User engagement up 11.7% vs baseline. Positive trend consistent with recent feature release.', 'INFO: Positive deviation. No action required.', 'low', 0.91, NULL, NOW() - INTERVAL '10 minutes'),
('prediction', 'Customer segment: Enterprise (47 accounts)', 'Running churn classification model. Features: contract_age, support_tickets, usage_decline, payment_delays. Model: XGBoost v2.3.', 'Prediction: 84% churn probability for 47 accounts. Confidence: 92%.', 'high', 0.92, 'Churn Risk Automation', NOW() - INTERVAL '3 minutes'),
('prediction', 'Q1 2026 sales pipeline data', 'Time-series forecasting using ARIMA + Prophet ensemble. Historical data: 24 months. Seasonal adjustment applied.', 'Forecast: $1.15M Q1 revenue (8% below target $1.25M).', 'medium', 0.78, NULL, NOW() - INTERVAL '1 hour'),
('decision', 'Churn risk: 84% for 47 Enterprise accounts', 'Rule evaluation: IF churn_probability > 0.7 AND segment = Enterprise AND account_count > 10 THEN severity = CRITICAL. Additional factor: Q1 renewal window active.', 'DECISION: Severity=CRITICAL. Trigger retention campaign. Escalate to Account Management.', 'critical', 0.96, 'Churn Risk Automation', NOW() - INTERVAL '2 minutes'),
('decision', 'Revenue forecast: 8% below target', 'Rule evaluation: IF revenue_deviation > 5% AND deviation < 15% THEN severity = MEDIUM. Sales pipeline velocity declining but within recovery range.', 'DECISION: Severity=MEDIUM. Generate weekly report. Notify Sales Leadership.', 'medium', 0.88, 'Revenue Forecasting Pipeline', NOW() - INTERVAL '1 hour'),
('action', 'Execute: Retention Campaign for 47 accounts', 'Action selected: email_campaign + account_manager_alert + crm_flag. Execution order: parallel. Retry policy: 3 attempts.', 'EXECUTED: Retention emails sent (47). Account managers notified (5). CRM flags set.', 'high', 1.0, 'Churn Risk Automation', NOW() - INTERVAL '1 minute'),
('reporting', 'Log: Churn Risk Automation workflow completed', 'Audit entry: workflow_id=wf-1, execution_time=4.2s, steps_completed=6/6, outcome=success. Generating summary for stakeholders.', 'LOGGED: Full audit trail stored. Summary email queued for 5 stakeholders.', 'low', 1.0, NULL, NOW() - INTERVAL '30 seconds'),
('feedback', 'Evaluate: Retention campaign from Jan 21', 'Outcome tracking: 47 targeted accounts. Results after 7 days: 38 retained (81%), 5 churned (11%), 4 pending. Benchmark: 70% retention. Campaign successful.', 'FEEDBACK: Campaign success rate 81% (above 70% target). Model confidence validated.', 'low', 0.95, NULL, NOW() - INTERVAL '2 hours');

-- ============================================
-- STEP 10: Insert sample communications
-- ============================================

INSERT INTO agent_communications (from_agent_id, to_agent_id, message_type, payload, created_at) VALUES
('monitoring', 'decision', 'alert', '{"type": "churn_alert", "severity": "high", "value": 4.1}'::jsonb, NOW() - INTERVAL '2 minutes'),
('prediction', 'decision', 'prediction', '{"type": "churn_prediction", "probability": 0.84, "accounts": 47}'::jsonb, NOW() - INTERVAL '3 minutes'),
('decision', 'action', 'action', '{"type": "retention_campaign", "target_accounts": 47}'::jsonb, NOW() - INTERVAL '2 minutes'),
('action', 'reporting', 'completion', '{"workflow": "Churn Risk Automation", "status": "success"}'::jsonb, NOW() - INTERVAL '1 minute'),
('reporting', 'feedback', 'report', '{"campaign_id": "ret-001", "success_rate": 0.81}'::jsonb, NOW() - INTERVAL '30 seconds');

-- ============================================
-- STEP 11: Insert sample workflows
-- ============================================

INSERT INTO workflows (name, description, status, nodes, run_count) VALUES
('Churn Risk Automation', 'Automated workflow for detecting and responding to customer churn risk', 'active', '[]'::jsonb, 0),
('Revenue Forecasting Pipeline', 'Weekly revenue forecasting and analysis workflow', 'active', '[]'::jsonb, 0),
('Cost Anomaly Detection', 'Real-time infrastructure cost monitoring and alerting', 'active', '[]'::jsonb, 0);

-- ============================================
-- STEP 12: Insert sample activity logs
-- ============================================

INSERT INTO activity_logs (type, source, message, metadata, created_at) VALUES
('success', 'workflow', 'Churn Risk Automation completed successfully', '{"duration": "4.2s", "accounts_processed": 47}'::jsonb, NOW() - INTERVAL '1 minute'),
('warning', 'ml', 'Revenue forecast 8% below target', '{"forecast": 1150000, "target": 1250000}'::jsonb, NOW() - INTERVAL '1 hour'),
('info', 'agent', 'Monitoring Agent detected positive user growth', '{"growth": "11.7%", "baseline": 11500}'::jsonb, NOW() - INTERVAL '10 minutes'),
('success', 'agent', 'Action Agent executed retention campaign', '{"emails_sent": 47, "managers_notified": 5}'::jsonb, NOW() - INTERVAL '2 minutes'),
('info', 'system', 'All agents operational', '{"active_agents": 4, "idle_agents": 2}'::jsonb, NOW() - INTERVAL '5 minutes');

-- ============================================
-- STEP 13: Insert sample predictions
-- ============================================

INSERT INTO predictions (type, input_data, prediction, confidence, created_at) VALUES
('churn', '{"segment": "Enterprise", "accounts": 47}'::jsonb, '{"probability": 0.84, "risk_level": "high"}'::jsonb, 0.92, NOW() - INTERVAL '3 minutes'),
('revenue', '{"period": "Q1 2026", "pipeline": 1500000}'::jsonb, '{"forecast": 1150000, "variance": -0.08}'::jsonb, 0.78, NOW() - INTERVAL '1 hour'),
('cost_anomaly', '{"resource": "compute", "current": 45000}'::jsonb, '{"expected": 36500, "anomaly_score": 0.85}'::jsonb, 0.72, NOW() - INTERVAL '30 minutes');

-- ============================================
-- STEP 14: Insert sample risk alerts
-- ============================================

INSERT INTO risk_alerts (title, description, severity, source, status, created_at) VALUES
('High Churn Risk Detected', '47 Enterprise accounts showing 84% churn probability. Immediate action required.', 'critical', 'Prediction Agent', 'active', NOW() - INTERVAL '5 minutes'),
('Revenue Below Target', 'Q1 2026 forecast shows 8% shortfall ($1.15M vs $1.25M target).', 'medium', 'Prediction Agent', 'active', NOW() - INTERVAL '1 hour'),
('Cost Anomaly Alert', 'Compute costs 23% above expected baseline ($45K vs $36.5K).', 'high', 'Monitoring Agent', 'acknowledged', NOW() - INTERVAL '30 minutes');

-- ============================================
-- DONE! Database reset complete
-- ============================================

SELECT 'Database reset complete!' as status,
       (SELECT COUNT(*) FROM agents) as agents_count,
       (SELECT COUNT(*) FROM agent_decisions) as decisions_count,
       (SELECT COUNT(*) FROM agent_communications) as communications_count,
       (SELECT COUNT(*) FROM workflows) as workflows_count,
       (SELECT COUNT(*) FROM risk_alerts) as risk_alerts_count;
