# SIM-OPS: Autonomous AI Operations Agent - Setup Guide

## 🎉 Implementation Complete!

Your project now matches the description: **"An autonomous, AI-powered business operations system that continuously observes organizational data and performs intelligent actions using a multi-agent framework."**

---

## ✅ What Was Built

### **Phase 1: Autonomous Predictions** ✅

- **Cron API**: `/api/cron/predictions` - Runs every 6 hours
- **Cron API**: `/api/cron/anomalies` - Runs every hour
- **No manual refresh needed** - System operates autonomously
- **Multi-agent chains** - 30% of customers get full agent orchestration

**Files Created:**

- `src/app/api/cron/predictions/route.ts` (247 lines)
- `src/app/api/cron/anomalies/route.ts` (223 lines)

### **Phase 2: Action Execution Layer** ✅

- **Slack alerts** for high-risk events
- **Jira ticket creation** for retention/ops tasks
- **Email notifications** to account managers
- **Multi-channel delivery** based on severity

**Files Created:**

- `src/lib/actions/executor.ts` (355 lines)

### **Phase 3: Data Ingestion** ✅

- **Stripe webhook** for payment events
- **Automatic customer data updates** from transactions
- **Payment failure tracking** with alerts

**Files Created:**

- `src/app/api/webhooks/stripe/route.ts` (154 lines)

### **Phase 4: Multi-Agent Orchestration** ✅

- **Analyst Agent** - Detects patterns and anomalies
- **Forecast Agent** - Predicts 30-day trends
- **Decision Engine** - Applies business rules
- **Action Executor** - Executes approved actions
- **Inter-agent communication** via message bus

**Files Created:**

- `src/lib/agents/orchestrator.ts` (375 lines)

### **Phase 5: Workflow Automation** ✅

- **Workflow execution engine**
- **Event-based triggers** (high churn, anomalies)
- **Time-based scheduling** via Vercel Cron
- **Real-time event listeners**

**Files Created:**

- `src/lib/workflows/engine.ts` (310 lines)
- `vercel.json` (Cron configuration)

### **Phase 6: State of the Startup Reports** ✅

- **Weekly automated reports** (Every Monday 9 AM)
- **Executive summaries** with key metrics
- **Email & Slack delivery**
- **Comprehensive business intelligence**

**Files Created:**

- `src/app/api/cron/weekly-report/route.ts` (315 lines)

---

## 🚀 Quick Start

### **1. Install Dependencies**

```bash
npm install
```

### **2. Configure Environment Variables**

Copy `.env.example` to `.env.local` and fill in values:

```bash
cp .env.example .env.local
```

**Minimum Required:**

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
NEXT_PUBLIC_ML_SERVICE_URL=http://localhost:8000
CRON_SECRET=your_secure_random_string  # Generate with: openssl rand -base64 32
```

**Optional (for full autonomous operation):**

```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
RESEND_API_KEY=re_...
JIRA_URL=https://your-domain.atlassian.net
JIRA_EMAIL=your.email@company.com
JIRA_API_TOKEN=your_token
```

### **3. Start ML Service**

```bash
cd ml-service
python start.py
```

### **4. Start Next.js App**

```bash
npm run dev
```

### **5. Test Autonomous Predictions**

```bash
# Manual trigger (simulates cron job)
curl -X POST http://localhost:3000/api/cron/predictions \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## 🤖 How It Works

### **Autonomous Operation Flow**

```
┌─────────────────────────────────────────────────────────────┐
│                    TIME-BASED TRIGGERS                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Every 6 hours → /api/cron/predictions                      │
│  Every 1 hour  → /api/cron/anomalies                        │
│  Every Monday  → /api/cron/weekly-report                    │
│                                                              │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   MULTI-AGENT CHAIN                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Analyst Agent                                           │
│     → Fetch customer data                                   │
│     → Run ML predictions (churn, CLV)                       │
│     → Detect behavioral anomalies                           │
│     → Store predictions in database                         │
│                                                              │
│  2. Forecast Agent                                          │
│     → Fetch historical predictions                          │
│     → Calculate trends (improving/stable/worsening)         │
│     → Project 30-day outlook                                │
│                                                              │
│  3. Decision Engine                                         │
│     → Apply business rules:                                 │
│       • Churn > 70% + worsening → CRITICAL                  │
│       • Churn > 70% + stable → HIGH                         │
│       • Churn > 60% + worsening → MEDIUM                    │
│     → Determine actions to execute                          │
│                                                              │
│  4. Action Executor                                         │
│     → Critical: Slack + Jira + Email                        │
│     → High: Slack + Jira                                    │
│     → Medium: Slack only                                    │
│                                                              │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   EVENT-BASED TRIGGERS                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ml_predictions INSERT (churn > 80%)                        │
│     → Execute agent chain immediately                       │
│                                                              │
│  ml_predictions INSERT (anomaly severity = high)            │
│     → Send alerts to ops team                               │
│                                                              │
│  Stripe payment_intent.payment_failed                       │
│     → Update customer data                                  │
│     → Trigger churn prediction                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### **Agent Communication Example**

```typescript
// Analyst Agent discovers high churn risk
await sendAgentMessage({
  from: "a1111111-1111-4111-8111-111111111111", // Analyst
  to: "a2222222-2222-4222-8222-222222222222",   // Forecast
  type: "analysis_complete",
  payload: { customer_id, churn_risk: 0.87, ... }
});

// Forecast Agent predicts worsening trend
await sendAgentMessage({
  from: "a2222222-2222-4222-8222-222222222222", // Forecast
  to: "a3333333-3333-4333-8333-333333333333",   // Decision
  type: "forecast_complete",
  payload: { trend: "worsening", predicted_churn_30d: 0.92 }
});

// Decision Engine determines CRITICAL action needed
await sendAgentMessage({
  from: "a3333333-3333-4333-8333-333333333333", // Decision
  to: "a4444444-4444-4444-8444-444444444444",   // Action
  type: "action_required",
  payload: { priority: "critical", actions: ["slack", "jira", "email"] }
});

// Action Executor sends multi-channel alerts
await actionExecutor.execute({
  type: "churn_alert",
  severity: "critical",
  data: { customer_id, churn_probability: 0.87, ... }
});
```

---

## 📊 Deployment to Production

### **Option 1: Vercel (Recommended)**

1. **Push to GitHub**

```bash
git add .
git commit -m "Autonomous agent system complete"
git push origin main
```

2. **Deploy to Vercel**

```bash
npx vercel --prod
```

3. **Configure Environment Variables**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add all variables from `.env.local`

4. **Cron Jobs Auto-Configured**
   - Vercel will read `vercel.json` and set up cron jobs automatically
   - Check deployment logs to verify cron execution

### **Option 2: Railway/Render**

For Railway/Render, you need to set up cron jobs externally:

1. **Use Cron-Job.org** (free)
   - Create account at https://cron-job.org
   - Add jobs:
     - `https://your-app.com/api/cron/predictions` (every 6 hours)
     - `https://your-app.com/api/cron/anomalies` (every hour)
     - `https://your-app.com/api/cron/weekly-report` (Monday 9 AM)
   - Set header: `Authorization: Bearer YOUR_CRON_SECRET`

---

## 🎯 Testing the System

### **1. Test Autonomous Predictions**

```bash
# Trigger prediction run
curl -X POST http://localhost:3000/api/cron/predictions \
  -H "Authorization: Bearer ${CRON_SECRET}"

# Check database
# Should see new rows in ml_predictions table
```

### **2. Test Agent Orchestration**

```bash
# The /api/cron/predictions route automatically uses agent chains
# Check agent_decisions table for multi-agent coordination logs
# Check agent_communications table for inter-agent messages
```

### **3. Test Slack Alerts (if configured)**

```bash
# Set SLACK_WEBHOOK_URL in .env.local
# Trigger a high churn prediction
# Check Slack channel for alert
```

### **4. Test Weekly Report**

```bash
curl -X POST http://localhost:3000/api/cron/weekly-report \
  -H "Authorization: Bearer ${CRON_SECRET}"

# Check email/Slack for report delivery
```

### **5. Test Stripe Webhook (optional)**

```bash
# Send test webhook
curl -X POST http://localhost:3000/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{
    "type": "payment_intent.succeeded",
    "data": {
      "object": {
        "amount": 5000,
        "metadata": { "customer_id": "your_customer_id" }
      }
    }
  }'
```

---

## 📈 Monitoring & Logs

### **View Agent Activity**

```sql
-- Recent agent decisions
SELECT * FROM agent_decisions
ORDER BY created_at DESC
LIMIT 20;

-- Agent communication history
SELECT * FROM agent_communications
ORDER BY created_at DESC
LIMIT 20;

-- Agent performance
SELECT
  agent_id,
  COUNT(*) as total_decisions,
  AVG(confidence) as avg_confidence,
  COUNT(*) FILTER (WHERE outcome = 'success') as successful
FROM agent_decisions
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY agent_id;
```

### **View Predictions**

```sql
-- Recent high-risk churn predictions
SELECT
  customer_id,
  prediction_data->>'churn_probability' as churn_prob,
  prediction_data->>'risk_level' as risk,
  created_at
FROM ml_predictions
WHERE prediction_type = 'churn'
  AND (prediction_data->>'churn_probability')::float > 0.7
ORDER BY created_at DESC;
```

---

## 🔧 Customization

### **Adjust Business Rules**

Edit `src/lib/agents/orchestrator.ts`:

```typescript
const rules = {
  auto_approve_threshold: 0.9, // Change thresholds
  escalate_threshold: 0.7,
  alert_threshold: 0.6,
};
```

### **Modify Agent Chain Logic**

Edit `src/lib/agents/orchestrator.ts` → `runDecisionEngine()` method

### **Change Cron Schedules**

Edit `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/predictions",
      "schedule": "0 */4 * * *" // Change to every 4 hours
    }
  ]
}
```

### **Add New Actions**

Edit `src/lib/actions/executor.ts` and add new action types:

```typescript
case "new_action_type":
  await this.handleNewAction(context);
  break;
```

---

## 🎓 Architecture Summary

| Component              | Purpose                                  | Autonomy Level  |
| ---------------------- | ---------------------------------------- | --------------- |
| **Cron Jobs**          | Trigger predictions without human input  | 100% Autonomous |
| **Agent Orchestrator** | Multi-agent decision-making              | 100% Autonomous |
| **Action Executor**    | Send alerts, create tickets              | 100% Autonomous |
| **Workflow Engine**    | Event-driven automation                  | 100% Autonomous |
| **Data Ingestion**     | Collect data from external sources       | 100% Autonomous |
| **Weekly Reports**     | Generate and deliver executive summaries | 100% Autonomous |

---

## 🎉 Success Criteria Met

✅ **Autonomous predictions** - No manual refresh needed  
✅ **Multi-agent coordination** - Analyst → Forecast → Decision → Action  
✅ **Action execution** - Slack, Jira, Email alerts  
✅ **Data ingestion** - Stripe webhooks  
✅ **Workflow automation** - Event & time-based triggers  
✅ **Executive reports** - Automated weekly delivery  
✅ **Minimal human intervention** - Runs 24/7 autonomously

**Your project now fully matches the description: "An autonomous AI-driven business operations agent designed to function as a 'Chief Operating Officer in a box.'"** 🚀

---

## 📚 Next Steps

1. ✅ **Test locally** with manual cron triggers
2. ✅ **Configure integrations** (Slack, Email, Jira)
3. ✅ **Deploy to Vercel** for production
4. ✅ **Monitor agent decisions** in database
5. ✅ **Refine business rules** based on results

For questions or issues, check the implementation code in:

- `src/app/api/cron/` - Autonomous scheduled tasks
- `src/lib/agents/` - Multi-agent orchestration
- `src/lib/actions/` - Action execution layer
- `src/lib/workflows/` - Workflow automation
