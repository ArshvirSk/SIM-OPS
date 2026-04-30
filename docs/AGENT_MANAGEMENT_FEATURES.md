# Agent Management Features

Complete documentation for the AI agent management system in SIM-OPS.

## Overview

The agent management system provides comprehensive tools for monitoring, configuring, and controlling autonomous AI decision agents. Each agent operates independently while communicating with other agents in a coordinated pipeline.

## Core Features

### 1. Agent Dashboard

**Location:** `/agents`

The main dashboard provides:
- Real-time agent status monitoring
- Live communication pipeline visualization
- Agent performance metrics
- Quick actions (run, pause, configure)

**Key Components:**
- `AgentDetailCard` - Individual agent status cards
- `AgentCommunicationPipeline` - Visual data flow between agents
- `LiveDataFlowIndicator` - Real-time connection status

### 2. Agent Search & Filtering

**Component:** `AgentSearchFilter`

Filter agents by:
- **Search Query** - Search by name, role, or description
- **Status** - Filter by active, idle, processing, or error states
- **Decision Severity** - Filter decisions by low, medium, high, or critical

**Usage:**
```tsx
<AgentSearchFilter
  onSearchChange={(query) => setSearchQuery(query)}
  onStatusFilter={(status) => setStatusFilter(status)}
  onSeverityFilter={(severity) => setSeverityFilter(severity)}
/>
```

### 3. Agent Configuration

**Component:** `AgentConfigPanel`

Configure agent behavior:
- **Enable/Disable** - Toggle agent activation
- **Thresholds** - Set numeric thresholds for decision-making
- **Triggers** - Define what events activate the agent
- **Output Targets** - Specify where agent sends results

**Editable Thresholds:**
Use `AgentThresholdEditor` for interactive threshold editing:
- Add new thresholds dynamically
- Modify existing threshold values
- Remove unused thresholds
- Real-time validation

### 4. Decision History

**Component:** `AgentDecisionHistory`

View complete decision audit trail:
- **Input Data** - What data the agent received
- **Reasoning Chain** - How the agent made its decision
- **Output** - The final decision or action
- **Confidence Score** - Agent's confidence level (0-100%)
- **Severity Level** - Impact classification
- **Workflow Triggered** - Any automated workflows initiated

**Decision Severities:**
- `low` - Informational, no action required
- `medium` - Monitoring recommended
- `high` - Action recommended
- `critical` - Immediate action required

### 5. Performance Metrics

**Component:** `AgentMetricsPanel`

Track agent performance:
- **Total Decisions** - Lifetime decision count
- **Actions Today** - Current day activity
- **Success Rate** - Percentage of successful decisions
- **Average Confidence** - Mean confidence across decisions
- **Average Response Time** - Processing speed in seconds

### 6. Performance Trends

**Component:** `AgentPerformanceTrends`

Visualize 24-hour performance trends:
- **Confidence Trend** - Confidence level over time
- **Success Rate Trend** - Success percentage over time
- **Response Time Trend** - Processing speed over time
- **Trend Indicators** - Up/down arrows with percentage change

**Charts:**
- Area charts with gradient fills
- Hourly data points (24 hours)
- Interactive tooltips
- Responsive design

### 7. Agent Communication

**Component:** `AgentCommunicationPipeline`

Real-time visualization of inter-agent communication:
- **Pipeline View** - Visual representation of agent chain
- **Active Transfers** - Animated data flow between agents
- **Message Log** - Recent communication history
- **Packet Types** - Color-coded by message type (KPI, prediction, decision, action, report, feedback)

**Features:**
- Pause/resume animation
- Real-time updates via Supabase subscriptions
- Connection status indicators
- Message count tracking

### 8. Agent Connections

**Component:** `AgentConnectionStatus`

Monitor agent-to-agent connections:
- **Connection Status** - Active, inactive, or error
- **Message Count** - Total messages sent
- **Last Message** - Most recent communication
- **Visual Indicators** - Animated connection lines

### 9. Reasoning Flow

**Component:** `AgentReasoningFlow`

Understand agent decision-making process:
- **Step-by-step Pipeline** - Visual flow of reasoning stages
- **Stage Descriptions** - What happens at each step
- **Icons** - Visual representation of each stage

**Typical Flow:**
1. Data Ingestion
2. Processing/Analysis
3. Decision Making
4. Output Generation

### 10. Create New Agents

**Component:** `CreateAgentDialog`

Add new agents to the system:
- **Agent Name** - Unique identifier
- **Role** - Agent's purpose/responsibility
- **Description** - Detailed capabilities
- **Initial Status** - Start as idle or active

**Validation:**
- Required fields enforcement
- Duplicate name prevention
- Automatic config creation

## Agent Types

### Monitoring Agent
- **Role:** KPI deviation detection & threshold monitoring
- **Triggers:** Scheduled, event-based
- **Outputs:** Decision Agent, Reporting Agent

### Prediction Agent
- **Role:** ML inference & risk scoring
- **Triggers:** Monitoring Agent, scheduled
- **Outputs:** Decision Agent

### Decision Agent
- **Role:** Severity classification & rule engine
- **Triggers:** Prediction Agent, Monitoring Agent
- **Outputs:** Action Agent, Reporting Agent

### Action Agent
- **Role:** Workflow execution & automation triggers
- **Triggers:** Decision Agent
- **Outputs:** Reporting Agent, Feedback Agent

### Reporting Agent
- **Role:** Summary generation & audit logging
- **Triggers:** All agents
- **Outputs:** Dashboard, Email, Storage

### Feedback Agent
- **Role:** Outcome tracking & retraining triggers
- **Triggers:** Scheduled, manual
- **Outputs:** Prediction Agent, Reporting Agent

## API Integration

### Hooks

All agent operations use React Query hooks from `src/hooks/useAgents.ts`:

```tsx
// Fetch all agents
const { data: agents, isLoading } = useAgents();

// Fetch agent with full details
const { data: agentDetails } = useAgentWithDetails(agentId);

// Update agent status
const updateAgent = useUpdateAgent();
await updateAgent.mutateAsync({ id, updates: { status: 'active' } });

// Update agent configuration
const updateConfig = useUpdateAgentConfig();
await updateConfig.mutateAsync({ agentId, updates: { enabled: true } });

// Run single agent
const runAgent = useRunAgent();
await runAgent.mutateAsync({ agentId, agentName, agentRole });

// Run all agents in pipeline
const runAllAgents = useRunAllAgents();
await runAllAgents.mutateAsync(agents);

// Get agent communications
const { data: communications } = useAgentCommunications();
```

### Real-time Updates

All agent data updates in real-time using Supabase subscriptions:
- Agent status changes
- New decisions
- Communication messages
- Metric updates

## Database Schema

### Tables

**agents**
- `id` - UUID primary key
- `name` - Agent name
- `role` - Agent role/purpose
- `description` - Detailed description
- `status` - Current status (active, idle, processing, error)
- `last_action` - Last action timestamp
- `actions_today` - Count of today's actions

**agent_configs**
- `id` - UUID primary key
- `agent_id` - Foreign key to agents
- `enabled` - Boolean activation status
- `thresholds` - JSONB threshold values
- `triggers` - Array of trigger types
- `output_targets` - Array of output destinations

**agent_decisions**
- `id` - UUID primary key
- `agent_id` - Foreign key to agents
- `input` - Input data received
- `reasoning` - Decision reasoning chain
- `output` - Decision output
- `severity` - Decision severity level
- `confidence` - Confidence score (0-1)
- `workflow_triggered` - Triggered workflow name

**agent_metrics**
- `id` - UUID primary key
- `agent_id` - Foreign key to agents
- `total_decisions` - Lifetime decision count
- `avg_confidence` - Average confidence score
- `success_rate` - Success percentage
- `avg_response_time` - Average processing time

**agent_communications**
- `id` - UUID primary key
- `from_agent_id` - Sender agent
- `to_agent_id` - Receiver agent
- `message_type` - Type of message
- `payload` - Message content (JSONB)

## Usage Examples

### Basic Agent Monitoring

```tsx
import { useAgents } from '@/hooks/useAgents';
import { AgentDetailCard } from '@/components/agents';

function AgentList() {
  const { data: agents } = useAgents();
  
  return (
    <div>
      {agents?.map(agent => (
        <AgentDetailCard
          key={agent.id}
          agent={agent}
          isSelected={false}
          onSelect={() => {}}
          onToggle={() => {}}
        />
      ))}
    </div>
  );
}
```

### Running an Agent

```tsx
import { useRunAgent } from '@/hooks/useAgents';
import { toast } from 'sonner';

function RunAgentButton({ agent }) {
  const runAgent = useRunAgent();
  
  const handleRun = async () => {
    try {
      await runAgent.mutateAsync({
        agentId: agent.id,
        agentName: agent.name,
        agentRole: agent.role,
      });
      toast.success('Agent started');
    } catch (error) {
      toast.error('Failed to run agent');
    }
  };
  
  return (
    <button onClick={handleRun}>
      Run Agent
    </button>
  );
}
```

### Updating Configuration

```tsx
import { useUpdateAgentConfig } from '@/hooks/useAgents';

function ConfigEditor({ agentId, config }) {
  const updateConfig = useUpdateAgentConfig();
  
  const handleSave = async (newThresholds) => {
    await updateConfig.mutateAsync({
      agentId,
      updates: { thresholds: newThresholds }
    });
  };
  
  return (
    <AgentThresholdEditor
      thresholds={config.thresholds}
      onSave={handleSave}
      onCancel={() => {}}
    />
  );
}
```

## Best Practices

### 1. Agent Configuration
- Set appropriate thresholds based on business requirements
- Configure triggers to avoid circular dependencies
- Define clear output targets for proper data flow

### 2. Monitoring
- Regularly review decision history for accuracy
- Monitor confidence scores - low confidence may indicate model drift
- Track success rates to identify underperforming agents

### 3. Performance
- Use filters to reduce data load when viewing large decision histories
- Leverage real-time subscriptions for live updates
- Implement pagination for large agent lists

### 4. Security
- Validate all threshold inputs
- Implement role-based access for agent configuration
- Audit all configuration changes

### 5. Maintenance
- Regularly review and update agent thresholds
- Archive old decisions to maintain performance
- Monitor agent communication patterns for bottlenecks

## Troubleshooting

### Agent Not Processing
1. Check agent status (should be "active")
2. Verify configuration is enabled
3. Check trigger configuration
4. Review recent error logs

### Low Confidence Scores
1. Review input data quality
2. Check if model needs retraining
3. Verify threshold configurations
4. Analyze decision history patterns

### Communication Issues
1. Check agent connection status
2. Verify output targets are configured
3. Review communication logs
4. Check for circular dependencies

### Performance Degradation
1. Monitor response times
2. Check decision volume
3. Review database query performance
4. Consider agent load balancing

## Future Enhancements

Planned features:
- Agent cloning/templates
- Bulk configuration updates
- Advanced analytics dashboard
- A/B testing for agent configurations
- Custom alert rules
- Integration with external ML platforms
- Agent collaboration patterns
- Automated optimization suggestions

## Support

For issues or questions:
- Check the troubleshooting section
- Review component documentation
- Check database schema
- Contact development team
