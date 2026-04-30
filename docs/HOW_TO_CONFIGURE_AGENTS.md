# How to Configure Agents

Step-by-step guide to configure your agents in SIM-OPS.

## Quick Steps

### 1. Go to Agents Page
```
http://localhost:3000/agents
```

### 2. Select an Agent
Click on any agent card in the left sidebar

### 3. Click Configuration Tab
Click the "CONFIGURATION" tab at the top

### 4. Click "Edit" Button
Click the "Edit" button in the top right of the configuration panel

### 5. Configure Settings

#### **Agent Enabled Toggle**
- Turn ON to activate the agent
- Turn OFF to pause the agent

#### **Edit Thresholds** (Numeric values that control behavior)
1. See existing thresholds with editable input fields
2. Modify any threshold value directly
3. Click the **-** button to remove a threshold
4. To add a new threshold:
   - Enter threshold name (e.g., `maxRetries`, `minConfidence`)
   - Enter numeric value
   - Click the **+** button
5. Common thresholds:
   - `churnRate`: 3
   - `revenueDeviation`: 5
   - `minConfidence`: 0.7
   - `maxRetries`: 3
   - `timeoutSeconds`: 30

#### **Add Triggers** (What activates this agent)
1. Click the dropdown under "TRIGGERS"
2. Select a trigger type:
   - `scheduled` - Runs on a schedule
   - `event-based` - Triggered by events
   - `monitoring-agent` - Triggered by Monitoring Agent
   - `prediction-agent` - Triggered by Prediction Agent
   - `decision-agent` - Triggered by Decision Agent
   - `action-agent` - Triggered by Action Agent
   - `manual` - Only runs when you click "Run Agent"
   - `realtime` - Runs continuously
   - `webhook` - Triggered by external webhook
3. Click the **+** button to add
4. Repeat to add multiple triggers
5. Click **X** on any badge to remove it

#### **Add Output Targets** (Where results go)
1. Click the dropdown under "OUTPUT TARGETS"
2. Select where results should go:
   - `Decision Agent` - Send to Decision Agent
   - `Action Agent` - Send to Action Agent
   - `Reporting Agent` - Send to Reporting Agent
   - `Feedback Agent` - Send to Feedback Agent
   - `Monitoring Agent` - Send to Monitoring Agent
   - `Prediction Agent` - Send to Prediction Agent
   - `Dashboard` - Display on dashboard
   - `Email` - Send email notifications
   - `Slack` - Send to Slack
   - `Webhook` - Send to external webhook
   - `Database` - Store in database
3. Click the **+** button to add
4. Repeat to add multiple targets
5. Click **X** on any badge to remove it

### 6. Click "Save Configuration"
Your changes are saved to the database immediately

## Configuration Examples

### Example 1: Monitoring Agent
```
Enabled: ON
Triggers:
  - scheduled
  - event-based
Output Targets:
  - Decision Agent
  - Reporting Agent
```

### Example 2: Security Agent
```
Enabled: ON
Triggers:
  - realtime
  - webhook
Output Targets:
  - Decision Agent
  - Action Agent
  - Email
  - Slack
```

### Example 3: Custom Analysis Agent
```
Enabled: ON
Triggers:
  - manual
  - scheduled
Output Targets:
  - Dashboard
  - Reporting Agent
```

## Configuring Thresholds

Thresholds are numeric values that control agent behavior. You can now edit them directly in the Configuration Editor.

### How to Edit Thresholds

1. Select your agent
2. Go to Configuration tab
3. Click "Edit" button
4. Scroll to "THRESHOLDS" section
5. Modify existing values directly in the input fields
6. Click **-** button to remove a threshold
7. Add new thresholds:
   - Enter name in first field
   - Enter value in second field
   - Click **+** button
8. Click "Save Configuration"

### Common Thresholds

**For Monitoring Agents:**
```json
{
  "churnRate": 3,
  "revenueDeviation": 5,
  "userGrowth": -2
}
```

**For Prediction Agents:**
```json
{
  "minConfidence": 0.7,
  "anomalyScore": 0.8
}
```

**For Decision Agents:**
```json
{
  "criticalThreshold": 0.8,
  "highThreshold": 0.6,
  "mediumThreshold": 0.4
}
```

**For Action Agents:**
```json
{
  "maxRetries": 3,
  "timeoutSeconds": 30
}
```

## Understanding Agent Flow

### Triggers → Agent → Output Targets

```
[Monitoring Agent] ──triggers──> [Decision Agent] ──sends to──> [Action Agent]
```

### Example Flow

1. **Monitoring Agent** detects high churn rate
2. **Triggers** Decision Agent (via `monitoring-agent` trigger)
3. **Decision Agent** evaluates severity
4. **Sends to** Action Agent (via `Action Agent` output target)
5. **Action Agent** executes retention campaign
6. **Sends to** Reporting Agent (via `Reporting Agent` output target)

## Best Practices

### Triggers
- ✅ Use `scheduled` for regular checks
- ✅ Use `event-based` for reactive responses
- ✅ Use `manual` for testing
- ✅ Use agent names to create pipelines
- ✅ Combine multiple triggers for flexibility

### Output Targets
- ✅ Send to `Decision Agent` for evaluation
- ✅ Send to `Action Agent` for execution
- ✅ Send to `Reporting Agent` for logging
- ✅ Send to `Dashboard` for visibility
- ✅ Send to `Email`/`Slack` for notifications

### Agent Enabled
- ✅ Keep OFF while configuring
- ✅ Turn ON when ready to run
- ✅ Turn OFF to pause temporarily
- ✅ Check decisions tab after enabling

## Testing Your Configuration

### 1. Configure the Agent
Set triggers and output targets

### 2. Keep Agent Disabled
Leave "Agent Enabled" OFF for testing

### 3. Run Manually
Click "Run Agent" button to test

### 4. Check Results
Go to "Decision History" tab to see output

### 5. Verify Communication
Go to "Connections" tab to see data flow

### 6. Enable Agent
Turn "Agent Enabled" ON when satisfied

## Troubleshooting

### Agent not running?
- ✅ Check "Agent Enabled" is ON
- ✅ Verify triggers are configured
- ✅ Check if trigger conditions are met
- ✅ Look for errors in Decision History

### No output?
- ✅ Check output targets are configured
- ✅ Verify target agents exist
- ✅ Check agent is actually running
- ✅ Look at Communications tab

### Configuration not saving?
- ✅ Click "Save Configuration" button
- ✅ Check browser console for errors
- ✅ Verify Supabase connection
- ✅ Refresh page and check again

### Can't add triggers/targets?
- ✅ Make sure you clicked "Edit" button
- ✅ Select from dropdown first
- ✅ Click + button to add
- ✅ Don't add duplicates

## Visual Guide

### Configuration Panel (Read-Only)
```
┌─────────────────────────────────┐
│ CONFIGURATION            [Edit] │
├─────────────────────────────────┤
│ Agent Enabled         [ON/OFF]  │
│                                 │
│ THRESHOLDS                      │
│ • churnRate: 3                  │
│ • revenueDeviation: 5           │
│                                 │
│ TRIGGERS                        │
│ [scheduled] [event-based]       │
│                                 │
│ OUTPUT TARGETS                  │
│ [Decision Agent] [Reporting]    │
└─────────────────────────────────┘
```

### Configuration Editor (Edit Mode)
```
┌─────────────────────────────────┐
│ Edit Configuration         [X]  │
├─────────────────────────────────┤
│ Agent Enabled         [ON/OFF]  │
│                                 │
│ THRESHOLDS                      │
│ Churn Rate          [3] [-]     │
│ Revenue Deviation   [5] [-]     │
│ [threshold name] [value] [+]    │
│                                 │
│ TRIGGERS                        │
│ [Select trigger...] [+]         │
│ [scheduled X] [event-based X]   │
│                                 │
│ OUTPUT TARGETS                  │
│ [Select target...] [+]          │
│ [Decision Agent X] [Reporting X]│
│                                 │
│ [Save Configuration] [Cancel]   │
└─────────────────────────────────┘
```

## Quick Reference

| Action | Steps |
|--------|-------|
| Enable agent | Config tab → Toggle ON → Save |
| Edit threshold | Config tab → Edit → Modify value → Save |
| Add threshold | Config tab → Edit → Enter name & value → + → Save |
| Remove threshold | Config tab → Edit → Click - button → Save |
| Add trigger | Config tab → Edit → Select trigger → + → Save |
| Add output | Config tab → Edit → Select target → + → Save |
| Remove trigger | Config tab → Edit → Click X on badge → Save |
| Remove output | Config tab → Edit → Click X on badge → Save |
| Test agent | Select agent → Run Agent button |
| View results | Decision History tab |

## Next Steps

After configuring:
1. ✅ Test with "Run Agent"
2. ✅ Check Decision History
3. ✅ Verify Communications
4. ✅ Enable agent
5. ✅ Monitor performance
6. ✅ Adjust as needed

## Need Help?

- **Full Guide:** `docs/CREATE_AGENT_GUIDE.md`
- **Component Reference:** `docs/AGENT_COMPONENTS_REFERENCE.md`
- **Database Setup:** `docs/SUPABASE_SETUP.md`
