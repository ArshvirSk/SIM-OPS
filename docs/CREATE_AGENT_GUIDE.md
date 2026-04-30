# Creating New Agents

Complete guide for creating and managing agents in SIM-OPS.

## How to Create a New Agent

### Via UI (Recommended)

1. **Navigate to Agents Page**
   - Go to http://localhost:3000/agents

2. **Click "New Agent" Button**
   - Located in the top right corner
   - Opens the Create Agent dialog

3. **Fill in Agent Details**
   - **Agent Name** (required): e.g., "Security Agent"
   - **Role/Purpose** (required): e.g., "Security threat detection & response"
   - **Description** (required): Detailed explanation of capabilities
   - **Initial Status**: Choose "Idle" or "Active"

4. **Click "Create Agent"**
   - Agent is created in database
   - Default configuration is set up
   - Metrics tracking initialized
   - Agent appears in the list

### Example Agents You Can Create

**1. Security Agent**
```
Name: Security Agent
Role: Security threat detection & response
Description: Monitors system logs and network traffic for security threats. Detects anomalies, unauthorized access attempts, and potential vulnerabilities. Triggers automated security responses.
Status: Active
```

**2. Performance Agent**
```
Name: Performance Agent
Role: System performance monitoring & optimization
Description: Tracks application performance metrics including response times, throughput, and resource utilization. Identifies bottlenecks and suggests optimizations.
Status: Active
```

**3. Customer Success Agent**
```
Name: Customer Success Agent
Role: Customer health scoring & engagement tracking
Description: Analyzes customer usage patterns, support tickets, and engagement metrics. Predicts customer satisfaction and identifies at-risk accounts.
Status: Active
```

**4. Compliance Agent**
```
Name: Compliance Agent
Role: Regulatory compliance monitoring & reporting
Description: Ensures operations comply with regulatory requirements. Monitors data handling, access controls, and audit trails. Generates compliance reports.
Status: Idle
```

**5. Cost Optimization Agent**
```
Name: Cost Optimization Agent
Role: Infrastructure cost analysis & optimization
Description: Analyzes cloud resource usage and costs. Identifies underutilized resources, suggests rightsizing opportunities, and forecasts future costs.
Status: Active
```

## What Happens When You Create an Agent

### 1. Database Records Created

**agents table:**
```sql
INSERT INTO agents (id, name, role, description, status, actions_today)
VALUES ('security', 'Security Agent', 'Security threat detection', '...', 'active', 0);
```

**agent_configs table:**
```sql
INSERT INTO agent_configs (agent_id, enabled, thresholds, triggers, output_targets)
VALUES ('security', true, '{}', ARRAY[]::text[], ARRAY[]::text[]);
```

**agent_metrics table:**
```sql
INSERT INTO agent_metrics (agent_id, total_decisions, avg_confidence, success_rate, avg_response_time)
VALUES ('security', 0, 0, 0, 0);
```

### 2. Agent ID Generation

The agent ID is automatically generated from the name:
- "Security Agent" → `security`
- "Customer Success Agent" → `customer-success`
- "Cost Optimization Agent" → `cost-optimization`

### 3. Default Configuration

New agents start with:
- ✅ Empty thresholds (configure later)
- ✅ No triggers (configure later)
- ✅ No output targets (configure later)
- ✅ Zero metrics (will update as agent runs)
- ✅ Enabled/disabled based on initial status

## Configuring Your New Agent

After creating an agent, configure it:

### 1. Set Thresholds

Click on the agent → Configuration tab → Edit thresholds

Example thresholds:
```json
{
  "alertThreshold": 0.8,
  "criticalThreshold": 0.95,
  "maxRetries": 3,
  "timeoutSeconds": 30
}
```

### 2. Configure Triggers

Specify what activates this agent:
- `scheduled` - Runs on a schedule
- `event-based` - Triggered by events
- `monitoring-agent` - Triggered by Monitoring Agent
- `prediction-agent` - Triggered by Prediction Agent
- `manual` - Manually triggered only

### 3. Set Output Targets

Specify where this agent sends results:
- `Decision Agent` - For decision-making
- `Action Agent` - For executing actions
- `Reporting Agent` - For logging/reporting
- `Dashboard` - Display on dashboard
- `Email` - Send email notifications

## Managing Agents

### View Agent Details
- Click on any agent card
- See decisions, metrics, connections, config

### Pause/Resume Agent
- Click "Pause" button on agent card
- Agent stops processing but remains in system
- Click "Start" to resume

### Run Agent Manually
- Select an agent
- Click "Run Agent" button
- Agent processes current data immediately

### Run All Agents (Pipeline)
- Click "Run Pipeline" button
- All agents run in sequence:
  1. Monitoring Agent
  2. Prediction Agent
  3. Decision Agent
  4. Action Agent
  5. Reporting Agent
  6. Feedback Agent

### Delete Agent

Currently not available in UI. Use SQL:
```sql
-- This will cascade delete configs, decisions, metrics, communications
DELETE FROM agents WHERE id = 'agent-id';
```

## Agent Communication Flow

When you create a new agent, consider its position in the pipeline:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Monitoring │────▶│  Prediction │────▶│   Decision  │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Feedback   │◀────│  Reporting  │◀────│   Action    │
└─────────────┘     └─────────────┘     └─────────────┘
```

**Your new agent can:**
- Receive input from existing agents (set triggers)
- Send output to other agents (set output targets)
- Operate independently (no triggers/targets)
- Run in parallel with others

## Best Practices

### Naming
- ✅ Use descriptive names: "Security Agent", not "Agent 1"
- ✅ Include "Agent" suffix for consistency
- ✅ Keep names concise (2-3 words)

### Role Description
- ✅ Be specific about what it does
- ✅ Mention key capabilities
- ✅ Keep it one sentence

### Full Description
- ✅ Explain in detail what the agent monitors
- ✅ Describe decision-making logic
- ✅ List actions it can take
- ✅ Mention any models or algorithms used

### Initial Status
- ✅ Start as "Idle" if not ready to run
- ✅ Start as "Active" if fully configured
- ✅ You can change status later

### Configuration
- ✅ Configure thresholds before activating
- ✅ Set up triggers to integrate with pipeline
- ✅ Define output targets for communication
- ✅ Test with "Run Agent" before enabling

## Troubleshooting

### "Agent with this name already exists"
- Each agent needs a unique name
- Try a different name or delete the existing agent

### Agent not appearing in list
- Refresh the page
- Check browser console for errors
- Verify Supabase connection

### Agent created but not running
- Check if status is "Active"
- Verify triggers are configured
- Check if thresholds are set
- Look for errors in decisions tab

### Can't configure agent
- Make sure agent is selected
- Check if you have edit permissions
- Verify Supabase connection

## Advanced: Creating Agents via SQL

For bulk creation or automation:

```sql
-- Create agent
INSERT INTO agents (id, name, role, description, status, actions_today)
VALUES ('custom', 'Custom Agent', 'Custom role', 'Description', 'idle', 0);

-- Create config
INSERT INTO agent_configs (agent_id, enabled, thresholds, triggers, output_targets)
VALUES ('custom', true, '{"threshold": 0.8}'::jsonb, ARRAY['scheduled'], ARRAY['Decision Agent']);

-- Create metrics
INSERT INTO agent_metrics (agent_id, total_decisions, avg_confidence, success_rate, avg_response_time)
VALUES ('custom', 0, 0, 0, 0);
```

## Next Steps

After creating your agent:
1. ✅ Configure thresholds
2. ✅ Set up triggers
3. ✅ Define output targets
4. ✅ Test with "Run Agent"
5. ✅ Monitor decisions and metrics
6. ✅ Adjust configuration as needed
7. ✅ Integrate with workflows

## Examples in Action

See the 6 pre-configured agents for examples:
- Monitoring Agent - KPI monitoring
- Prediction Agent - ML predictions
- Decision Agent - Rule-based decisions
- Action Agent - Workflow execution
- Reporting Agent - Audit logging
- Feedback Agent - Performance tracking

Study their configurations to understand best practices!
