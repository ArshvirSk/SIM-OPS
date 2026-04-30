-- Seed data for SIM-OPS Platform
-- This creates sample data for testing and demonstration

-- Clear existing data (in correct order to respect foreign keys)
DELETE FROM workflow_runs;
DELETE FROM agent_communications;
DELETE FROM agent_metrics;
DELETE FROM agent_decisions;
DELETE FROM agent_configs;
DELETE FROM workflows;
DELETE FROM predictions;
DELETE FROM activity_logs;
DELETE FROM risk_alerts;
DELETE FROM agents;

-- Insert sample agents
INSERT INTO agents (id, name, role, description, status, last_action, actions_today, success_rate, avg_confidence) VALUES
('a1111111-1111-4111-8111-111111111111', 'Data Monitor', 'monitoring', 'Continuously monitors system data for anomalies and triggers', 'active', 'Scanned 1,247 records for anomalies', 342, 94.5, 87.3),
('a2222222-2222-4222-8222-222222222222', 'ML Predictor', 'prediction', 'Runs machine learning models to forecast future system states', 'active', 'Generated predictions for next 24h', 156, 91.2, 82.5),
('a3333333-3333-4333-8333-333333333333', 'Decision Engine', 'decision', 'Applies business rules and evaluates ML predictions to recommend actions', 'processing', 'Evaluating risk threshold breach', 89, 96.8, 91.7),
('a4444444-4444-4444-8444-444444444444', 'Action Executor', 'action', 'Executes approved automated actions and notifications', 'idle', 'Sent notification to ops team', 67, 98.1, 95.2),
('a5555555-5555-4555-8555-555555555555', 'Report Generator', 'reporting', 'Generates insights and summaries from system data', 'active', 'Created daily performance report', 12, 99.0, 88.9),
('a6666666-6666-4666-8666-666666666666', 'Feedback Analyzer', 'feedback', 'Analyzes outcomes and improves agent performance', 'idle', 'Analyzed 45 decision outcomes', 23, 93.4, 79.8);

-- Insert agent configurations
INSERT INTO agent_configs (agent_id, config_key, config_value) VALUES
('a1111111-1111-4111-8111-111111111111', 'threshold', '{"anomaly_score": 0.85, "scan_interval": 300}'),
('a1111111-1111-4111-8111-111111111111', 'data_sources', '{"databases": ["production_db"], "metrics": ["cpu", "memory", "latency"]}'),
('a2222222-2222-4222-8222-222222222222', 'model_config', '{"model_type": "LSTM", "lookback_period": 168, "confidence_threshold": 0.75}'),
('a2222222-2222-4222-8222-222222222222', 'prediction_horizon', '{"short_term": 1, "medium_term": 24, "long_term": 168}'),
('a3333333-3333-4333-8333-333333333333', 'rules', '{"auto_approve_threshold": 0.9, "escalate_threshold": 0.6, "reject_threshold": 0.3}'),
('a4444444-4444-4444-8444-444444444444', 'channels', '{"email": true, "slack": true, "sms": false, "webhook": true}'),
('a5555555-5555-4555-8555-555555555555', 'schedule', '{"daily_report": "09:00", "weekly_report": "Monday 08:00"}'),
('a6666666-6666-4666-8666-666666666666', 'learning_rate', '{"adjustment_factor": 0.1, "min_samples": 10}');

-- Insert sample agent decisions
INSERT INTO agent_decisions (agent_id, decision, reasoning, confidence, severity, context, outcome, executed_at, created_at) VALUES
('a1111111-1111-4111-8111-111111111111', 'Anomaly detected in system latency', 
 '{"steps": ["Analyzed latency metrics", "Detected 3x increase", "Compared to baseline", "Triggered alert"], "data_points": 150}', 
 92.5, 'high', '{"metric": "latency", "value": 450, "baseline": 150, "threshold": 300}', 'success', 
 NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),
 
('a2222222-2222-4222-8222-222222222222', 'Predicted resource shortage in 6 hours',
 '{"steps": ["Loaded historical data", "Ran LSTM model", "Identified trend", "Calculated probability"], "confidence_factors": ["trend_strength", "data_quality"]}',
 85.3, 'medium', '{"resource": "memory", "current": "72%", "predicted": "95%", "time_horizon": "6h"}', 'pending',
 NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour'),
 
('a3333333-3333-4333-8333-333333333333', 'Recommend immediate scaling',
 '{"steps": ["Reviewed prediction", "Applied business rules", "Calculated cost impact", "Generated recommendation"], "rule_matches": ["auto_scale_policy"]}',
 88.7, 'high', '{"current_capacity": 10, "recommended_capacity": 15, "estimated_cost": "$45"}', 'success',
 NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes'),
 
('a4444444-4444-4444-8444-444444444444', 'Executed auto-scaling action',
 '{"steps": ["Validated approval", "Called cloud API", "Verified scaling", "Notified team"], "api_response": "success"}',
 95.2, 'high', '{"action": "scale_up", "instances": 5, "status": "completed"}', 'success',
 NOW() - INTERVAL '15 minutes', NOW() - INTERVAL '15 minutes'),
 
('a1111111-1111-4111-8111-111111111111', 'Normal operation detected',
 '{"steps": ["Scanned metrics", "All within normal range", "No anomalies found"], "metrics_checked": 45}',
 98.5, 'info', '{"status": "healthy", "metrics_count": 45}', 'success',
 NOW() - INTERVAL '5 minutes', NOW() - INTERVAL '5 minutes');

-- Insert sample agent metrics
INSERT INTO agent_metrics (agent_id, metric_name, metric_value, timestamp) VALUES
('a1111111-1111-4111-8111-111111111111', 'scans_per_hour', 120, NOW() - INTERVAL '1 hour'),
('a1111111-1111-4111-8111-111111111111', 'anomalies_detected', 3, NOW() - INTERVAL '1 hour'),
('a2222222-2222-4222-8222-222222222222', 'predictions_generated', 24, NOW() - INTERVAL '1 hour'),
('a2222222-2222-4222-8222-222222222222', 'model_accuracy', 91.2, NOW() - INTERVAL '30 minutes'),
('a3333333-3333-4333-8333-333333333333', 'decisions_made', 15, NOW() - INTERVAL '1 hour'),
('a3333333-3333-4333-8333-333333333333', 'auto_approved', 12, NOW() - INTERVAL '1 hour'),
('a4444444-4444-4444-8444-444444444444', 'actions_executed', 8, NOW() - INTERVAL '1 hour'),
('a4444444-4444-4444-8444-444444444444', 'success_rate', 98.1, NOW() - INTERVAL '30 minutes');

-- Insert sample agent communications
INSERT INTO agent_communications (from_agent_id, to_agent_id, message_type, payload, status, created_at) VALUES
('a1111111-1111-4111-8111-111111111111', 'a2222222-2222-4222-8222-222222222222', 'anomaly_detected', 
 '{"anomaly_type": "latency_spike", "severity": "medium", "data": {"current": 450, "baseline": 150}}',
 'delivered', NOW() - INTERVAL '2 hours'),
 
('a2222222-2222-4222-8222-222222222222', 'a3333333-3333-4333-8333-333333333333', 'prediction_ready',
 '{"prediction": "resource_shortage", "confidence": 0.853, "time_horizon": "6h"}',
 'delivered', NOW() - INTERVAL '1 hour'),
 
('a3333333-3333-4333-8333-333333333333', 'a4444444-4444-4444-8444-444444444444', 'action_required',
 '{"action": "scale_up", "approved": true, "parameters": {"instances": 5}}',
 'delivered', NOW() - INTERVAL '30 minutes'),
 
('a4444444-4444-4444-8444-444444444444', 'a6666666-6666-4666-8666-666666666666', 'action_completed',
 '{"action_id": "scale_001", "status": "success", "outcome": {"new_capacity": 15}}',
 'delivered', NOW() - INTERVAL '15 minutes');

-- Insert sample workflows
INSERT INTO workflows (id, name, description, status, nodes, connections, trigger_config, run_count, success_count) VALUES
('11111111-1111-4111-8111-111111111111', 'Anomaly Detection Pipeline', 
 'Monitors system metrics and triggers alerts for anomalies',
 'active',
 '[{"id": "n1", "type": "trigger", "config": {"schedule": "*/5 * * * *"}}, 
   {"id": "n2", "type": "data", "config": {"source": "metrics_db"}},
   {"id": "n3", "type": "ml", "config": {"model": "anomaly_detector"}},
   {"id": "n4", "type": "condition", "config": {"field": "anomaly_score", "operator": ">", "value": 0.8}},
   {"id": "n5", "type": "action", "config": {"type": "alert", "channel": "slack"}}]',
 '[{"from": "n1", "to": "n2"}, {"from": "n2", "to": "n3"}, {"from": "n3", "to": "n4"}, {"from": "n4", "to": "n5"}]',
 '{"type": "schedule", "cron": "*/5 * * * *"}',
 1247, 1189),

('22222222-2222-4222-8222-222222222222', 'Predictive Scaling',
 'Predicts resource needs and auto-scales infrastructure',
 'active',
 '[{"id": "n1", "type": "trigger", "config": {"schedule": "0 * * * *"}},
   {"id": "n2", "type": "data", "config": {"source": "usage_metrics"}},
   {"id": "n3", "type": "ml", "config": {"model": "resource_predictor"}},
   {"id": "n4", "type": "decision", "config": {"rules": "scaling_policy"}},
   {"id": "n5", "type": "action", "config": {"type": "api_call", "endpoint": "scale"}}]',
 '[{"from": "n1", "to": "n2"}, {"from": "n2", "to": "n3"}, {"from": "n3", "to": "n4"}, {"from": "n4", "to": "n5"}]',
 '{"type": "schedule", "cron": "0 * * * *"}',
 342, 335),

('33333333-3333-4333-8333-333333333333', 'Daily Performance Report',
 'Generates and emails daily performance summary',
 'active',
 '[{"id": "n1", "type": "trigger", "config": {"schedule": "0 9 * * *"}},
   {"id": "n2", "type": "data", "config": {"source": "analytics_db", "period": "24h"}},
   {"id": "n3", "type": "report", "config": {"template": "daily_summary"}},
   {"id": "n4", "type": "action", "config": {"type": "email", "recipients": "team@example.com"}}]',
 '[{"from": "n1", "to": "n2"}, {"from": "n2", "to": "n3"}, {"from": "n3", "to": "n4"}]',
 '{"type": "schedule", "cron": "0 9 * * *"}',
 45, 45),

('44444444-4444-4444-8444-444444444444', 'Incident Response',
 'Automatically responds to system incidents',
 'paused',
 '[{"id": "n1", "type": "trigger", "config": {"type": "webhook"}},
   {"id": "n2", "type": "condition", "config": {"field": "severity", "operator": ">=", "value": "high"}},
   {"id": "n3", "type": "action", "config": {"type": "runbook", "script": "auto_remediate"}},
   {"id": "n4", "type": "action", "config": {"type": "notify", "channel": "pagerduty"}}]',
 '[{"from": "n1", "to": "n2"}, {"from": "n2", "to": "n3"}, {"from": "n2", "to": "n4"}]',
 '{"type": "webhook", "url": "/api/webhooks/incidents"}',
 12, 11);

-- Insert sample workflow runs
INSERT INTO workflow_runs (workflow_id, status, started_at, completed_at, duration_ms, node_results) VALUES
('11111111-1111-4111-8111-111111111111', 'completed', NOW() - INTERVAL '10 minutes', NOW() - INTERVAL '9 minutes', 45000,
 '{"n1": {"status": "success"}, "n2": {"status": "success", "rows": 150}, "n3": {"status": "success", "score": 0.85}, "n4": {"status": "success", "result": true}, "n5": {"status": "success", "sent": true}}'),
 
('22222222-2222-4222-8222-222222222222', 'completed', NOW() - INTERVAL '35 minutes', NOW() - INTERVAL '33 minutes', 120000,
 '{"n1": {"status": "success"}, "n2": {"status": "success", "metrics": 45}, "n3": {"status": "success", "prediction": 0.92}, "n4": {"status": "success", "decision": "scale_up"}, "n5": {"status": "success", "scaled": 5}}'),
 
('33333333-3333-4333-8333-333333333333', 'completed', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours' + INTERVAL '30 seconds', 30000,
 '{"n1": {"status": "success"}, "n2": {"status": "success", "records": 5000}, "n3": {"status": "success", "generated": true}, "n4": {"status": "success", "sent": true}}');

-- Insert sample predictions
INSERT INTO predictions (metric_name, actual_value, predicted_value, confidence, model_name, timestamp) VALUES
('cpu_usage', 72.5, 75.3, 87.2, 'LSTM_v2', NOW() - INTERVAL '30 minutes'),
('memory_usage', 68.2, 65.8, 82.5, 'LSTM_v2', NOW() - INTERVAL '30 minutes'),
('request_rate', 1250, 1320, 91.3, 'ARIMA_v1', NOW() - INTERVAL '30 minutes'),
('error_rate', 0.5, 0.8, 78.9, 'RandomForest_v1', NOW() - INTERVAL '30 minutes'),
('response_time', 145, 152, 89.1, 'XGBoost_v1', NOW() - INTERVAL '30 minutes'),
('cpu_usage', NULL, 78.5, 85.5, 'LSTM_v2', NOW() + INTERVAL '1 hour'),
('memory_usage', NULL, 71.2, 81.3, 'LSTM_v2', NOW() + INTERVAL '1 hour');

-- Insert sample activity logs
INSERT INTO activity_logs (type, source, message, details, entity_type, entity_id) VALUES
('success', 'workflow', 'Workflow "Anomaly Detection Pipeline" completed successfully', 
 '{"duration_ms": 45000, "nodes_executed": 5}', 'workflow', '11111111-1111-4111-8111-111111111111'),
 
('warning', 'agent', 'Agent "ML Predictor" confidence below threshold',
 '{"confidence": 0.72, "threshold": 0.75}', 'agent', 'a2222222-2222-4222-8222-222222222222'),
 
('success', 'ml', 'Prediction model updated with new training data',
 '{"model": "LSTM_v2", "samples": 10000, "accuracy": 0.912}', NULL, NULL),
 
('error', 'workflow', 'Workflow "Incident Response" failed at node 3',
 '{"node_id": "n3", "error": "API timeout"}', 'workflow', '44444444-4444-4444-8444-444444444444'),
 
('info', 'system', 'Daily backup completed',
 '{"size_mb": 1250, "duration_sec": 180}', NULL, NULL),
 
('success', 'agent', 'Agent "Action Executor" performed auto-scaling',
 '{"action": "scale_up", "instances": 5, "cost": "$45"}', 'agent', 'a4444444-4444-4444-8444-444444444444');

-- Insert sample risk alerts
INSERT INTO risk_alerts (title, description, severity, source, status, created_at) VALUES
('High CPU Usage Predicted', 'ML model predicts CPU usage will exceed 95% in next 6 hours', 'high', 'ML Predictor Agent', 'active', NOW() - INTERVAL '1 hour'),
('Memory Leak Detected', 'Continuous memory growth detected in production service', 'critical', 'Data Monitor Agent', 'acknowledged', NOW() - INTERVAL '3 hours'),
('API Response Time Degrading', 'Average API response time increased by 40% in last hour', 'medium', 'Anomaly Detection Pipeline', 'active', NOW() - INTERVAL '30 minutes'),
('Dependency Service Down', 'External payment service unavailable', 'high', 'System Monitor', 'resolved', NOW() - INTERVAL '5 hours'),
('Unusual Traffic Pattern', 'Traffic pattern matches potential DDoS signature', 'medium', 'Data Monitor Agent', 'active', NOW() - INTERVAL '15 minutes');

-- Create a function to generate realistic time-series data
CREATE OR REPLACE FUNCTION generate_prediction_history()
RETURNS void AS $$
DECLARE
    i INTEGER;
    base_cpu DECIMAL;
    base_memory DECIMAL;
BEGIN
    FOR i IN 0..23 LOOP
        base_cpu := 60 + (RANDOM() * 20) + (SIN(i * 0.26) * 10);
        base_memory := 55 + (RANDOM() * 15) + (COS(i * 0.26) * 8);
        
        INSERT INTO predictions (metric_name, predicted_value, confidence, model_name, timestamp)
        VALUES 
            ('cpu_usage', base_cpu, 80 + (RANDOM() * 15), 'LSTM_v2', NOW() - (i || ' hours')::INTERVAL),
            ('memory_usage', base_memory, 75 + (RANDOM() * 20), 'LSTM_v2', NOW() - (i || ' hours')::INTERVAL);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to generate history
SELECT generate_prediction_history();
