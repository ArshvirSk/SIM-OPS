# 🚀 SIM-OPS Quick Start Guide

## ⚡ Get Started in 30 Seconds

### 1. View Your Agents
```
http://localhost:3000/agents
```

### 2. Test Email
```
http://localhost:3000/api/test-email
```

### 3. Run Pipeline
Click **"Trigger Pipeline"** button in the UI

---

## 📧 Email Setup

**Status:** ✅ CONFIGURED

**Recipient:** your-email@example.com  
**Provider:** Resend  
**From:** SIM-OPS Agent Alerts

**You'll get emails for:**
- HIGH/CRITICAL churn alerts
- Model retraining alerts

---

## 🤖 The 6 Agents

| Agent | Icon | What It Does | Status |
|-------|------|--------------|--------|
| **Monitoring** | 🔍 | Watches KPIs & churn rate | ✅ ACTIVE |
| **Prediction** | 🧠 | Predicts customer churn | ✅ ACTIVE |
| **Decision** | ⚖️ | Classifies risk severity | ✅ ACTIVE |
| **Action** | ⚡ | Executes campaigns | ✅ ACTIVE |
| **Reporting** | 📝 | Generates reports | ✅ ACTIVE |
| **Feedback** | 🔄 | Monitors performance | ✅ ACTIVE |

---

## 🎯 Quick Actions

### Run Single Agent
```bash
curl -X POST http://localhost:3000/api/agents/run \
  -H "Content-Type: application/json" \
  -d '{"agentId":"monitoring","agentName":"Monitoring Agent","agentRole":"KPI deviation detection & threshold monitoring"}'
```

### Run All Agents
```bash
curl -X POST http://localhost:3000/api/agents/run-all \
  -H "Content-Type: application/json" \
  -d '{"agents":[{"id":"monitoring","name":"Monitoring Agent","role":"KPI deviation detection & threshold monitoring"},{"id":"prediction","name":"Prediction Agent","role":"ML inference & risk scoring"},{"id":"decision","name":"Decision Agent","role":"Severity classification & rule engine"},{"id":"action","name":"Action Agent","role":"Workflow execution & automation triggers"},{"id":"reporting","name":"Reporting Agent","role":"Summary generation & audit logging"},{"id":"feedback","name":"Feedback Agent","role":"Outcome tracking & retraining triggers"}]}'
```

### Test Email
```bash
curl http://localhost:3000/api/test-email
```

### Run Tests
```bash
node test-agent-pipeline.js
```

---

## 📊 Where to See Results

### UI Dashboard
```
http://localhost:3000/agents

Tabs:
- Activity Log: Recent decisions
- Logic Mesh: Pipeline visualization
- Unit KPIs: Performance metrics
- Core Config: Settings
```

### Email
```
Check: your-email@example.com
Look for: SIM-OPS Agent Alerts
```

### Database
```sql
-- Recent decisions
SELECT * FROM agent_decisions ORDER BY created_at DESC LIMIT 10;

-- Agent status
SELECT * FROM agents;

-- Predictions
SELECT * FROM ml_predictions ORDER BY created_at DESC LIMIT 10;
```

---

## 🔧 Configuration

### Email Settings (`.env.local`)
```env
EMAIL_TO="your-email@example.com"
EMAIL_FROM="onboarding@resend.dev"
EMAIL_FROM_NAME="SIM-OPS Agent Alerts"
RESEND_API_KEY="your_resend_api_key_here"
```

### Slack Settings (`.env.local`)
```env
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."
```

---

## 🎨 Pipeline Visualization

### How to View
```
1. Go to: http://localhost:3000/agents
2. Click: "Logic Mesh" tab
3. See: Animated pipeline with data flow
```

### What You'll See
- Agent nodes with status colors
- Connection lines showing data flow
- Animated packets moving between agents
- Real-time status updates
- Communication history

---

## ✅ Test Results

**Last Run:** ALL PASSED ✓

```
✓ Monitoring Agent (1.5s)
✓ Prediction Agent (4.8s)
✓ Decision Agent (1.1s)
✓ Action Agent (2.0s)
✓ Reporting Agent (0.9s)
✓ Feedback Agent (2.0s)
✓ Complete Pipeline (8.7s)
```

---

## 🚨 Troubleshooting

### No email received?
1. Check spam folder
2. Verify email in `.env.local`
3. Test: `curl http://localhost:3000/api/test-email`

### Pipeline not running?
1. Check dev server is running
2. Verify database connection
3. Check browser console

### ML predictions failing?
1. Start ML service: `cd ml-service && python start.py`
2. Train models: `python train_models.py`
3. System uses fallback if ML unavailable

---

## 📚 Full Documentation

- **SYSTEM_STATUS.md** - Complete system overview
- **AGENT_GUIDE.md** - Detailed agent explanations
- **EMAIL_SETUP_GUIDE.md** - Email configuration
- **PIPELINE_UI_GUIDE.md** - UI usage guide

---

## 🎊 You're All Set!

Your autonomous agent system is **fully operational**!

**Start here:**
```
http://localhost:3000/agents
```

**Test email:**
```
http://localhost:3000/api/test-email
```

**Run pipeline:**
```
Click "Trigger Pipeline" button
```

**Check email:**
```
your-email@example.com
```

---

## 💡 Pro Tips

1. **Generate Data:** Run pipeline 10+ times to build history
2. **Watch Visualization:** See agents communicate in real-time
3. **Check Emails:** Look for HIGH/CRITICAL alerts
4. **Monitor Performance:** View metrics in Unit KPIs tab
5. **Adjust Thresholds:** Customize in Core Config tab

---

**Everything is working! Start exploring!** 🚀✨
