# Twilio Voice Calls - Threshold-Based System (Demo-Friendly)

## 🎯 Overview

Voice calls are now triggered based on **aggregate thresholds** rather than individual customers. This makes the system:
- ✅ **Demo-friendly**: Easy to trigger for demonstrations
- ✅ **Practical**: Focuses on systemic issues, not individual cases
- ✅ **Cost-effective**: Fewer calls, only when truly critical
- ✅ **Actionable**: Alerts indicate broader problems requiring immediate attention

---

## 📊 How It Works

### Threshold-Based Triggering

Voice calls are made when **ANY** of these thresholds are exceeded:

```
┌─────────────────────────────────────────────────────────────┐
│                    VOICE CALL TRIGGERS                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. High Risk Count                                         │
│     ≥ 5 customers with >75% churn probability              │
│     Default: 5 customers                                    │
│     Env var: VOICE_CALL_THRESHOLD_COUNT                     │
│                                                              │
│  2. Average Churn Rate                                      │
│     Average churn probability ≥ 65%                         │
│     Default: 0.65 (65%)                                     │
│     Env var: VOICE_CALL_THRESHOLD_CHURN                     │
│                                                              │
│  3. High Risk Percentage                                    │
│     ≥ 15% of all customers at high risk                     │
│     Default: 0.15 (15%)                                     │
│     Env var: VOICE_CALL_THRESHOLD_PERCENTAGE                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Example Scenarios

**Scenario 1: High Risk Count**
```
Prediction run results:
- Total customers: 50
- High risk (>75% churn): 6 customers
- Average churn: 45%

Result: ☎️ VOICE CALL TRIGGERED
Reason: 6 high-risk customers ≥ threshold of 5
```

**Scenario 2: Average Churn Rate**
```
Prediction run results:
- Total customers: 50
- High risk (>75% churn): 3 customers
- Average churn: 68%

Result: ☎️ VOICE CALL TRIGGERED
Reason: Average churn 68% ≥ threshold of 65%
```

**Scenario 3: High Risk Percentage**
```
Prediction run results:
- Total customers: 50
- High risk (>75% churn): 10 customers
- Average churn: 55%

Result: ☎️ VOICE CALL TRIGGERED
Reason: 20% high-risk ≥ threshold of 15%
```

**Scenario 4: All Within Limits**
```
Prediction run results:
- Total customers: 50
- High risk (>75% churn): 2 customers
- Average churn: 42%

Result: ✅ NO VOICE CALL
Reason: All thresholds within acceptable range
```

---

## 🚀 Quick Setup

### 1. Configure Thresholds

Add to `.env.local`:

```env
# Twilio credentials
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your_auth_token_here"
TWILIO_PHONE_NUMBER="+1234567890"
ALERT_PHONE_NUMBER="+1234567890"

# Thresholds (adjust for your demo)
VOICE_CALL_THRESHOLD_COUNT="5"        # 5+ high-risk customers
VOICE_CALL_THRESHOLD_CHURN="0.65"     # 65% average churn
VOICE_CALL_THRESHOLD_PERCENTAGE="0.15" # 15% high-risk percentage
```

### 2. Adjust for Demo

**For easier triggering during demos:**

```env
# More sensitive thresholds (triggers more easily)
VOICE_CALL_THRESHOLD_COUNT="3"        # Only 3 high-risk customers needed
VOICE_CALL_THRESHOLD_CHURN="0.50"     # 50% average churn
VOICE_CALL_THRESHOLD_PERCENTAGE="0.10" # 10% high-risk percentage
```

**For production (less sensitive):**

```env
# Conservative thresholds (triggers only for serious issues)
VOICE_CALL_THRESHOLD_COUNT="10"       # 10+ high-risk customers
VOICE_CALL_THRESHOLD_CHURN="0.75"     # 75% average churn
VOICE_CALL_THRESHOLD_PERCENTAGE="0.20" # 20% high-risk percentage
```

---

## 🧪 Testing

### Method 1: Run Prediction Cron

```bash
# Trigger the prediction cron
curl -X POST http://localhost:3000/api/cron/predictions \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Watch the console output for threshold checks
# If thresholds exceeded, voice call will be made
```

### Method 2: Test Endpoint (Simulated)

```bash
# Test with aggregate data
curl -X POST http://localhost:3000/api/test-voice-call \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-secret-123" \
  -d '{
    "alert_type": "aggregate_threshold",
    "high_risk_count": 8,
    "total_customers": 50,
    "avg_churn_rate": 0.72,
    "thresholds_exceeded": [
      "8 customers at high risk (threshold: 5)",
      "Average churn rate 72% (threshold: 65%)"
    ]
  }'
```

### Method 3: Dashboard

1. Go to http://localhost:3000/agents
2. Click "Trigger Pipeline"
3. System runs predictions
4. Checks thresholds automatically
5. Voice call made if exceeded

---

## 📞 What You'll Hear

When thresholds are exceeded:

```
🔊 "Critical alert from SIM-OPS.

    [X] customers are at high risk of churning.
    
    This represents [Y] percent of your customer base.
    
    Average churn probability is [Z] percent.
    
    Immediate action required.
    
    Check your email and Slack for details."

[Pause 2 seconds]

🔊 "Press 1 to acknowledge this alert,
    or press 2 to escalate.
    
    Waiting for your response..."
```

**Example:**
```
"Critical alert from SIM-OPS. 8 customers are at high risk of churning. 
This represents 16 percent of your customer base. Average churn 
probability is 72 percent. Immediate action required. Check your 
email and Slack for details."
```

---

## 📊 Console Output

When prediction cron runs, you'll see:

```bash
🤖 Starting autonomous prediction run...
📊 Processing 50 customers...
✅ Autonomous predictions completed:
   - Churn predictions: 50
   - CLV predictions: 50
   - Agent chains executed: 10
   - Failed: 0
   - High risk customers: 8
   - Execution time: 12453ms

📊 Threshold Check:
   - High risk customers: 8 (threshold: 5)
   - Average churn rate: 72.3% (threshold: 65.0%)
   - High risk percentage: 16.0% (threshold: 15.0%)

🚨 CRITICAL THRESHOLD EXCEEDED!
   Reasons:
   - 8 customers at high risk (threshold: 5)
   - Average churn rate 72.3% (threshold: 65.0%)
   - 16.0% of customers at high risk (threshold: 15.0%)
   
   ✅ Voice call triggered and alert created
```

---

## 🎯 Demo Tips

### For Successful Demo

1. **Set Low Thresholds**
   ```env
   VOICE_CALL_THRESHOLD_COUNT="2"
   VOICE_CALL_THRESHOLD_CHURN="0.40"
   ```

2. **Seed High-Risk Data**
   - Add customers with high churn indicators
   - Low engagement, payment failures, etc.

3. **Run Prediction**
   ```bash
   curl -X POST http://localhost:3000/api/cron/predictions \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

4. **Show Real-Time**
   - Open console to show threshold checks
   - Show phone ringing
   - Show email/Slack alerts
   - Show database logs

### Demo Script

```
1. "Let me show you our autonomous alerting system"
2. "We've configured thresholds for critical situations"
3. "Let's trigger a prediction run..." [Run cron]
4. "The system is analyzing 50 customers..." [Show console]
5. "Look - 8 customers are at high risk!" [Point to output]
6. "This exceeds our threshold of 5..." [Show threshold check]
7. "Watch what happens..." [Phone rings]
8. "The system automatically called me!" [Answer phone]
9. "It's giving me the critical details..." [Listen to message]
10. "I can acknowledge or escalate right from the call" [Press 1]
11. "And everything is logged..." [Show database]
```

---

## 🔧 Customization

### Change Thresholds

Edit `.env.local`:

```env
# Very sensitive (for demos)
VOICE_CALL_THRESHOLD_COUNT="2"
VOICE_CALL_THRESHOLD_CHURN="0.40"
VOICE_CALL_THRESHOLD_PERCENTAGE="0.08"

# Balanced (recommended)
VOICE_CALL_THRESHOLD_COUNT="5"
VOICE_CALL_THRESHOLD_CHURN="0.65"
VOICE_CALL_THRESHOLD_PERCENTAGE="0.15"

# Conservative (production)
VOICE_CALL_THRESHOLD_COUNT="10"
VOICE_CALL_THRESHOLD_CHURN="0.75"
VOICE_CALL_THRESHOLD_PERCENTAGE="0.20"
```

### Change Voice Message

Edit `src/lib/actions/executor.ts`, find the aggregate alert section:

```typescript
message: `Critical alert from SIM-OPS. ${high_risk_count} customers are at high risk of churning. This represents ${((high_risk_count / total_customers) * 100).toFixed(0)} percent of your customer base. Average churn probability is ${(avg_churn_rate * 100).toFixed(0)} percent. Immediate action required. Check your email and Slack for details.`
```

### Disable Individual Customer Calls

Individual customer calls are **already disabled** by default. To re-enable:

Edit `src/lib/actions/executor.ts`, uncomment:

```typescript
// CRITICAL ONLY: Make voice call for individual customer (disabled by default)
// Uncomment if you want voice calls for individual customers
if (context.severity === "critical") {
    await this.makeVoiceCall({...});
}
```

---

## 📊 Monitoring

### Check Threshold Status

```sql
-- Recent threshold checks
SELECT * FROM activity_logs
WHERE message LIKE '%threshold%'
ORDER BY created_at DESC
LIMIT 10;

-- Critical alerts created
SELECT * FROM risk_alerts
WHERE severity = 'critical'
ORDER BY created_at DESC;

-- Voice calls made
SELECT * FROM activity_logs
WHERE type = 'voice_call'
AND metadata->>'alert_type' = 'aggregate_churn_alert'
ORDER BY created_at DESC;
```

### Dashboard View

The system creates a risk alert in the database:

```
Title: "Critical: High Churn Risk Threshold Exceeded"
Description: "8 customers at high risk. 8 customers at high risk (threshold: 5). Average churn rate 72.3% (threshold: 65.0%)"
Severity: critical
Status: active
```

---

## 💡 Benefits

### Aggregate vs Individual

| Aspect | Individual Alerts | Aggregate Alerts |
|--------|------------------|------------------|
| **Frequency** | Many calls | Few calls |
| **Cost** | Higher | Lower |
| **Actionability** | One customer | Systemic issue |
| **Demo-friendly** | Hard to trigger | Easy to trigger |
| **Noise** | High | Low |
| **Focus** | Tactical | Strategic |

### Why Aggregate is Better

1. **Systemic Focus**: Alerts indicate broader problems
2. **Cost Effective**: Fewer calls = lower costs
3. **Less Noise**: Only truly critical situations
4. **Actionable**: Requires strategic response
5. **Demo-Friendly**: Easy to configure and trigger

---

## 🎉 Success!

Your voice call system is now:
- ✅ Threshold-based (aggregate)
- ✅ Demo-friendly (easy to trigger)
- ✅ Cost-effective (fewer calls)
- ✅ Actionable (strategic alerts)
- ✅ Configurable (adjust thresholds)

**Next Steps**:
1. Configure thresholds in `.env.local`
2. Run prediction cron
3. Watch for threshold checks
4. Receive voice call when exceeded
5. Demonstrate to stakeholders!

---

## 📚 Related Documentation

- **Setup Guide**: `TWILIO_VOICE_SETUP.md`
- **Quick Start**: `TWILIO_QUICK_START.md`
- **Integration Summary**: `TWILIO_INTEGRATION_SUMMARY.md`
- **Visual Diagrams**: `docs/TWILIO_INTEGRATION_DIAGRAM.md`

**Your system now uses intelligent threshold-based alerting!** 🎯📞
