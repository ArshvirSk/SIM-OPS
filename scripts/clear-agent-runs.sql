-- ============================================
-- Clear All Agent Runs and Reset Agent State
-- ============================================
-- This script clears all agent activity data while preserving
-- the agent definitions and configurations

-- Clear agent communications (inter-agent messages)
DELETE FROM agent_communications;

-- Clear agent decisions (all decision logs)
DELETE FROM agent_decisions;

-- Clear agent metrics history
DELETE FROM agent_metrics;

-- Clear ML predictions
DELETE FROM ml_predictions;

-- Clear activity logs
DELETE FROM activity_logs;

-- Clear risk alerts
DELETE FROM risk_alerts;

-- Clear workflow runs
DELETE FROM workflow_runs;

-- Reset agent states to idle
UPDATE agents SET 
    status = 'idle',
    last_action = NULL,
    actions_today = 0,
    updated_at = NOW();

-- Reset agent metrics to zero
INSERT INTO agent_metrics (agent_id, total_decisions, avg_confidence, success_rate, avg_response_time)
VALUES 
    ('monitoring', 0, 0, 0, 0),
    ('prediction', 0, 0, 0, 0),
    ('decision', 0, 0, 0, 0),
    ('action', 0, 0, 0, 0),
    ('reporting', 0, 0, 0, 0),
    ('feedback', 0, 0, 0, 0)
ON CONFLICT (agent_id) 
DO UPDATE SET
    total_decisions = 0,
    avg_confidence = 0,
    success_rate = 0,
    avg_response_time = 0,
    recorded_at = NOW();

-- Show summary
SELECT 
    'Agent runs cleared!' as status,
    (SELECT COUNT(*) FROM agent_communications) as communications_remaining,
    (SELECT COUNT(*) FROM agent_decisions) as decisions_remaining,
    (SELECT COUNT(*) FROM ml_predictions) as predictions_remaining,
    (SELECT COUNT(*) FROM activity_logs) as activity_logs_remaining,
    (SELECT COUNT(*) FROM risk_alerts) as risk_alerts_remaining;
