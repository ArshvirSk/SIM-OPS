# Agent Components Quick Reference

Quick reference guide for all agent management components.

## Component Index

| Component | Purpose | Props |
|-----------|---------|-------|
| `AgentDetailCard` | Agent status card | `agent`, `isSelected`, `onSelect`, `onToggle` |
| `AgentConfigPanel` | Configuration display | `config`, `onConfigChange` |
| `AgentThresholdEditor` | Edit thresholds | `thresholds`, `onSave`, `onCancel` |
| `AgentDecisionHistory` | Decision log | `decisions` |
| `AgentMetricsPanel` | Performance metrics | `metrics`, `actionsToday` |
| `AgentPerformanceTrends` | 24h trend charts | `agentName`, `data?` |
| `AgentReasoningFlow` | Decision pipeline | `agentId` |
| `AgentCommunicationPipeline` | Inter-agent comms | none |
| `AgentConnectionStatus` | Connection monitor | none |
| `AgentSearchFilter` | Search & filter UI | `onSearchChange`, `onStatusFilter`, `onSeverityFilter` |
| `LiveDataFlowIndicator` | Connection status | `isConnected`, `packetsPerSecond`, `latency` |
| `CreateAgentDialog` | New agent form | `open`, `onOpenChange`, `onCreateAgent` |

## Component Details

### AgentDetailCard

Displays agent summary with status indicator.

```tsx
<AgentDetailCard
  agent={{
    id: "monitoring",
    name: "Monitoring Agent",
    role: "KPI monitoring",
    status: "active",
    lastAction: "2 min ago",
    actionsToday: 47,
    metrics: { /* ... */ },
    config: { /* ... */ }
  }}
  isSelected={true}
  onSelect={() => setSelected(agent.id)}
  onToggle={() => toggleAgent(agent.id)}
/>
```

**Features:**
- Status badge with color coding
- Metrics preview (decisions, success rate)
- Pause/Start button
- Click to select

---

### AgentConfigPanel

Read-only configuration display with toggle switch.

```tsx
<AgentConfigPanel
  config={{
    enabled: true,
    thresholds: { churnRate: 3, revenueDeviation: 5 },
    triggers: ["scheduled", "event-based"],
    outputTargets: ["Decision Agent"]
  }}
  onConfigChange={(newConfig) => updateConfig(newConfig)}
/>
```

**Sections:**
- Enable/disable switch
- Thresholds list
- Triggers badges
- Output targets badges

---

### AgentThresholdEditor

Interactive threshold editor with add/remove.

```tsx
<AgentThresholdEditor
  thresholds={{ churnRate: 3, maxRetries: 5 }}
  onSave={(updated) => saveThresholds(updated)}
  onCancel={() => setEditing(false)}
/>
```

**Features:**
- Edit existing thresholds
- Add new thresholds
- Remove thresholds
- Validation
- Save/Cancel actions

---

### AgentDecisionHistory

Expandable decision log with full details.

```tsx
<AgentDecisionHistory
  decisions={[
    {
      id: "d1",
      timestamp: "2026-01-28 09:15:23",
      input: "Churn rate: 4.1%",
      reasoning: "Exceeds threshold by 37%...",
      output: "ALERT: High churn detected",
      severity: "high",
      confidence: 0.94,
      workflowTriggered: "Churn Risk Automation"
    }
  ]}
/>
```

**Features:**
- Collapsible entries
- Severity color coding
- Confidence percentage
- Workflow links
- Full reasoning chain

---

### AgentMetricsPanel

Performance metrics with progress bars.

```tsx
<AgentMetricsPanel
  metrics={{
    totalDecisions: 1247,
    avgConfidence: 0.89,
    successRate: 0.96,
    avgResponseTime: 0.3
  }}
  actionsToday={47}
/>
```

**Displays:**
- Total decisions (lifetime)
- Actions today
- Success rate (with progress bar)
- Average confidence (with progress bar)
- Average response time

---

### AgentPerformanceTrends

24-hour performance trend charts.

```tsx
<AgentPerformanceTrends
  agentName="Monitoring Agent"
  data={trendData} // optional, generates mock if not provided
/>
```

**Charts:**
- Confidence over time (area chart)
- Success rate over time (area chart)
- Response time over time (area chart)
- Trend indicators (up/down with %)

**Data Format:**
```ts
interface TrendData {
  timestamp: string;
  decisions: number;
  confidence: number;
  successRate: number;
  responseTime: number;
}
```

---

### AgentReasoningFlow

Visual pipeline of agent reasoning stages.

```tsx
<AgentReasoningFlow agentId="monitoring" />
```

**Shows:**
- Step-by-step process
- Stage icons
- Stage descriptions
- Flow arrows

**Predefined Flows:**
- monitoring
- prediction
- decision
- action
- reporting
- feedback

---

### AgentCommunicationPipeline

Real-time inter-agent communication visualization.

```tsx
<AgentCommunicationPipeline />
```

**Features:**
- Visual agent chain
- Animated data transfers
- Active packet display
- Communication log
- Pause/resume control
- Real-time updates

---

### AgentConnectionStatus

Agent-to-agent connection monitor.

```tsx
<AgentConnectionStatus />
```

**Displays:**
- Connection pairs (from → to)
- Status (active/inactive/error)
- Message counts
- Last message preview
- Connection health summary

---

### AgentSearchFilter

Search and filter controls.

```tsx
<AgentSearchFilter
  onSearchChange={(query) => setSearch(query)}
  onStatusFilter={(status) => setStatusFilter(status)}
  onSeverityFilter={(severity) => setSeverityFilter(severity)}
/>
```

**Filters:**
- Text search (name, role, description)
- Status dropdown (all, active, idle, processing, error)
- Severity dropdown (all, low, medium, high, critical)
- Active filter badges
- Clear all button

---

### LiveDataFlowIndicator

Real-time connection status indicator.

```tsx
<LiveDataFlowIndicator
  isConnected={true}
  packetsPerSecond={2.5}
  latency={42}
/>
```

**Shows:**
- Connection status (WiFi icon)
- Packets per second
- Animated signal bars
- Latency in ms

---

### CreateAgentDialog

Modal form for creating new agents.

```tsx
<CreateAgentDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  onCreateAgent={async (data) => {
    await createAgent(data);
  }}
/>
```

**Fields:**
- Agent name (required)
- Role/purpose (required)
- Description (required, textarea)
- Initial status (dropdown)

**Validation:**
- Required field checks
- Loading state during creation
- Error handling

---

## Styling

All components use:
- Tailwind CSS for styling
- shadcn/ui base components
- Consistent border-2 style
- Monospace fonts for data
- Color-coded status indicators

**Status Colors:**
- `active` - foreground/primary
- `idle` - muted
- `processing` - accent with animation
- `error` - destructive

**Severity Colors:**
- `low` - muted
- `medium` - accent
- `high` - secondary
- `critical` - destructive

---

## Common Patterns

### Loading States

```tsx
{isLoading ? (
  <Skeleton className="h-32 w-full" />
) : (
  <AgentDetailCard {...props} />
)}
```

### Error Handling

```tsx
try {
  await runAgent.mutateAsync({ agentId, agentName, agentRole });
  toast.success("Agent started");
} catch (error) {
  toast.error("Failed to run agent");
}
```

### Real-time Updates

```tsx
const { data: agents } = useAgents(); // Auto-updates via subscription
```

### Filtering

```tsx
const filtered = agents.filter(agent => {
  if (searchQuery && !agent.name.includes(searchQuery)) return false;
  if (statusFilter !== 'all' && agent.status !== statusFilter) return false;
  return true;
});
```

---

## Integration Example

Complete agent management page:

```tsx
import {
  AgentDetailCard,
  AgentCommunicationPipeline,
  AgentSearchFilter,
  AgentDecisionHistory,
  AgentPerformanceTrends,
  CreateAgentDialog
} from '@/components/agents';
import { useAgents, useAgentWithDetails } from '@/hooks/useAgents';

export default function AgentsPage() {
  const [selectedId, setSelectedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  const { data: agents } = useAgents();
  const { data: details } = useAgentWithDetails(selectedId);
  
  const filtered = agents?.filter(/* ... */);
  
  return (
    <div>
      <AgentCommunicationPipeline />
      
      <div className="grid grid-cols-4 gap-6">
        <div>
          <AgentSearchFilter
            onSearchChange={setSearchQuery}
            onStatusFilter={setStatusFilter}
            onSeverityFilter={() => {}}
          />
          
          {filtered?.map(agent => (
            <AgentDetailCard
              key={agent.id}
              agent={agent}
              isSelected={selectedId === agent.id}
              onSelect={() => setSelectedId(agent.id)}
              onToggle={() => {}}
            />
          ))}
        </div>
        
        <div className="col-span-3">
          {details && (
            <>
              <AgentPerformanceTrends agentName={details.name} />
              <AgentDecisionHistory decisions={details.decisions} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## TypeScript Types

```ts
// Agent
interface Agent {
  id: string;
  name: string;
  role: string;
  description: string;
  status: "active" | "idle" | "processing" | "error";
  lastAction?: string;
  actionsToday: number;
  decisions: AgentDecision[];
  metrics: AgentMetrics;
  config: AgentConfig;
}

// Decision
interface AgentDecision {
  id: string;
  timestamp: string;
  input: string;
  reasoning: string;
  output: string;
  severity: "low" | "medium" | "high" | "critical";
  confidence: number;
  workflowTriggered?: string;
}

// Metrics
interface AgentMetrics {
  totalDecisions: number;
  avgConfidence: number;
  successRate: number;
  avgResponseTime: number;
}

// Config
interface AgentConfig {
  enabled: boolean;
  thresholds: Record<string, number>;
  triggers: string[];
  outputTargets: string[];
}
```

---

## Testing

Example test for AgentDetailCard:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { AgentDetailCard } from '@/components/agents';

test('renders agent card and handles selection', () => {
  const mockAgent = {
    id: 'test',
    name: 'Test Agent',
    status: 'active',
    // ... other props
  };
  
  const onSelect = jest.fn();
  
  render(
    <AgentDetailCard
      agent={mockAgent}
      isSelected={false}
      onSelect={onSelect}
      onToggle={() => {}}
    />
  );
  
  expect(screen.getByText('Test Agent')).toBeInTheDocument();
  
  fireEvent.click(screen.getByText('Test Agent'));
  expect(onSelect).toHaveBeenCalled();
});
```

---

## Performance Tips

1. **Memoization**: Use `useMemo` for filtered lists
2. **Pagination**: Limit decision history to recent entries
3. **Lazy Loading**: Load agent details only when selected
4. **Debouncing**: Debounce search input
5. **Virtual Scrolling**: For large agent lists

```tsx
const filteredAgents = useMemo(() => {
  return agents?.filter(/* ... */) || [];
}, [agents, searchQuery, statusFilter]);
```
