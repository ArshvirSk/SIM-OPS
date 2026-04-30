-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE agent_status AS ENUM ('active', 'idle', 'processing', 'error', 'stopped');
CREATE TYPE workflow_status AS ENUM ('draft', 'active', 'paused', 'completed', 'error');
CREATE TYPE decision_severity AS ENUM ('info', 'low', 'medium', 'high', 'critical');
CREATE TYPE log_type AS ENUM ('success', 'warning', 'info', 'error');
CREATE TYPE log_source AS ENUM ('workflow', 'ml', 'agent', 'system');
CREATE TYPE node_type AS ENUM ('trigger', 'data', 'ml', 'decision', 'action', 'report', 'condition', 'loop', 'delay');

-- Agents table
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    description TEXT,
    status agent_status DEFAULT 'idle',
    last_action TEXT,
    last_run_at TIMESTAMPTZ,
    actions_today INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0,
    avg_confidence DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT agents_success_rate_check CHECK (success_rate >= 0 AND success_rate <= 100),
    CONSTRAINT agents_confidence_check CHECK (avg_confidence >= 0 AND avg_confidence <= 100)
);

-- Agent configurations table
CREATE TABLE agent_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    config_key VARCHAR(100) NOT NULL,
    config_value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_agent_config UNIQUE(agent_id, config_key)
);

-- Agent decisions table
CREATE TABLE agent_decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    decision TEXT NOT NULL,
    reasoning JSONB, -- Stores step-by-step reasoning chain
    confidence DECIMAL(5,2) DEFAULT 0,
    severity decision_severity DEFAULT 'info',
    context JSONB, -- Input data that led to decision
    outcome VARCHAR(50), -- 'success', 'failure', 'pending', null
    executed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT decisions_confidence_check CHECK (confidence >= 0 AND confidence <= 100)
);

-- Agent metrics table
CREATE TABLE agent_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,2) NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Agent communications table (for inter-agent messaging)
CREATE TABLE agent_communications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    to_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    message_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'sent',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

-- Workflows table
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status workflow_status DEFAULT 'draft',
    nodes JSONB NOT NULL DEFAULT '[]', -- Array of workflow nodes
    connections JSONB NOT NULL DEFAULT '[]', -- Array of node connections
    trigger_config JSONB, -- Trigger configuration (schedule, webhook, etc)
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    run_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Workflow runs table (execution history)
CREATE TABLE workflow_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'running', -- 'running', 'completed', 'failed', 'cancelled'
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,
    node_results JSONB, -- Results from each node execution
    error_message TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Predictions table
CREATE TABLE predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(100) NOT NULL,
    actual_value DECIMAL(10,2),
    predicted_value DECIMAL(10,2) NOT NULL,
    confidence DECIMAL(5,2) DEFAULT 0,
    model_name VARCHAR(100),
    features JSONB, -- Input features used for prediction
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT predictions_confidence_check CHECK (confidence >= 0 AND confidence <= 100)
);

-- Activity logs table
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type log_type NOT NULL,
    source log_source NOT NULL,
    message TEXT NOT NULL,
    details JSONB,
    entity_type VARCHAR(50), -- 'agent', 'workflow', 'user', etc.
    entity_id UUID,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Risk alerts table
CREATE TABLE risk_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    severity decision_severity NOT NULL,
    source VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'acknowledged', 'resolved'
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_agents_user_id ON agents(user_id);
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agent_configs_agent_id ON agent_configs(agent_id);
CREATE INDEX idx_agent_decisions_agent_id ON agent_decisions(agent_id);
CREATE INDEX idx_agent_decisions_created_at ON agent_decisions(created_at DESC);
CREATE INDEX idx_agent_decisions_user_id ON agent_decisions(user_id);
CREATE INDEX idx_agent_metrics_agent_id ON agent_metrics(agent_id);
CREATE INDEX idx_agent_metrics_timestamp ON agent_metrics(timestamp DESC);
CREATE INDEX idx_agent_communications_from_agent ON agent_communications(from_agent_id);
CREATE INDEX idx_agent_communications_to_agent ON agent_communications(to_agent_id);
CREATE INDEX idx_workflows_user_id ON workflows(user_id);
CREATE INDEX idx_workflows_status ON workflows(status);
CREATE INDEX idx_workflow_runs_workflow_id ON workflow_runs(workflow_id);
CREATE INDEX idx_workflow_runs_started_at ON workflow_runs(started_at DESC);
CREATE INDEX idx_predictions_timestamp ON predictions(timestamp DESC);
CREATE INDEX idx_predictions_user_id ON predictions(user_id);
CREATE INDEX idx_activity_logs_timestamp ON activity_logs(timestamp DESC);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_risk_alerts_status ON risk_alerts(status);
CREATE INDEX idx_risk_alerts_created_at ON risk_alerts(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_configs_updated_at BEFORE UPDATE ON agent_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON workflows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
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

-- Policies for agents table
CREATE POLICY "Users can view their own agents" ON agents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own agents" ON agents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agents" ON agents
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own agents" ON agents
    FOR DELETE USING (auth.uid() = user_id);

-- Policies for agent_configs table
CREATE POLICY "Users can manage their agent configs" ON agent_configs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM agents WHERE agents.id = agent_configs.agent_id AND agents.user_id = auth.uid()
        )
    );

-- Policies for agent_decisions table
CREATE POLICY "Users can view their agent decisions" ON agent_decisions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their agent decisions" ON agent_decisions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for agent_metrics table
CREATE POLICY "Users can view their agent metrics" ON agent_metrics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their agent metrics" ON agent_metrics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for agent_communications table
CREATE POLICY "Users can view their agent communications" ON agent_communications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM agents WHERE agents.id = agent_communications.from_agent_id AND agents.user_id = auth.uid()
        ) OR EXISTS (
            SELECT 1 FROM agents WHERE agents.id = agent_communications.to_agent_id AND agents.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their agent communications" ON agent_communications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM agents WHERE agents.id = agent_communications.from_agent_id AND agents.user_id = auth.uid()
        )
    );

-- Policies for workflows table
CREATE POLICY "Users can view their own workflows" ON workflows
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workflows" ON workflows
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workflows" ON workflows
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workflows" ON workflows
    FOR DELETE USING (auth.uid() = user_id);

-- Policies for workflow_runs table
CREATE POLICY "Users can view their workflow runs" ON workflow_runs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their workflow runs" ON workflow_runs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for predictions table
CREATE POLICY "Users can view their own predictions" ON predictions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own predictions" ON predictions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for activity_logs table
CREATE POLICY "Users can view their own activity logs" ON activity_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activity logs" ON activity_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for risk_alerts table
CREATE POLICY "Users can view their own risk alerts" ON risk_alerts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own risk alerts" ON risk_alerts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own risk alerts" ON risk_alerts
    FOR UPDATE USING (auth.uid() = user_id);
