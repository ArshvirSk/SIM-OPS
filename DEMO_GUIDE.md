# SIM-OPS Demo Guide - Live Voice Call Demo

## 🎯 Demo Flow (5 Minutes)

This guide shows how to demonstrate the **threshold-based voice call system** live, with automatic customer seeding.

---

## 🚀 Pre-Demo Setup (2 minutes)

### 1. Configure for Easy Triggering

Edit `.env.local` to use **demo-friendly thresholds**:

```env
# Twilio credentials
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your_auth_token_here"
TWILIO_PHONE_NUMBER="+1234567890"
ALERT_PHONE_NUMBER="+1234567890"  # Your phone number

# DEMO THRESHOLDS (very sensitive - triggers easily)
VOICE_CALL_THRESHOLD_COUNT="3"        # Only 3 high-risk customers needed
VOICE_CALL_THRESHOLD_CHURN="0.50"     # 50% average churn
VOICE_CALL_THRESHOLD_PERCENTAGE="0.08" # 8% high-risk percentage

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 2. Clear Existing Data (Optional)

If you want a fresh demo:

```sql
-- In Supabase SQL Editor
DELETE FROM customers;
DELETE FROM ml_predictions;
DELETE FROM risk_alerts;
```

### 3. Start Your App

```bash
npm run dev
```

---

## 🎬 Live Demo Script

### Part 1: Introduction (30 seconds)

**Say:**
> "Let me show you our autonomous AI operations system. It continuously monitors customer health and automatically alerts us when critical thresholds are exceeded."

**Show:**
- Dashboard at http://localhost:3000
- Point out the "Trigger Pipeline" button

---

### Part 2: Trigger the System (30 seconds)

**Say:**
> "Watch what happens when I trigger the prediction system..."

**Do:**
1. Click **"Trigger Pipeline"** button in the dashboard
2. Or run via terminal:
   ```bash
   curl -X POST http://localhost:3000/api/cron/predictions \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

**Show:**
- Open browser console (F12)
- Terminal output if using curl

---

### Part 3: Auto-Seeding (30 seconds)

**Console Output:**
```
🤖 Starting autonomous prediction run...
📦 No customers found - auto-seeding demo data...
   ✅ Created 50 customers
   📊 Distribution: 10 high-risk, 40 low/medium-risk
📊 Processing 50 customers...
```

**Say:**
> "The system detected no customers, so it automatically created 50 diverse customer profiles. This includes high-risk, medium-risk, and low-risk customers with realistic data."

**Explain:**
- 20% high-risk (churning)
- 40% medium-risk (stable)
- 40% low-risk (engaged)

---

### Part 4: ML Predictions (1 minute)

**Console Output:**
```
✅ Autonomous predictions completed:
   - Churn predictions: 50
   - CLV predictions: 50
   - Agent chains executed: 10
   - Failed: 0
   - High risk customers: 8
   - Execution time: 12453ms
```

**Say:**
> "The system just analyzed all 50 customers using machine learning models. It identified 8 customers at high risk of churning."

**Show:**
- Point to "High risk customers: 8"
- Explain ML models ran in background

---

### Part 5: Threshold Check (1 minute)

**Console Output:**
```
📊 Threshold Check:
   - High risk customers: 8 (threshold: 3)
   - Average churn rate: 62.3% (threshold: 50.0%)
   - High risk percentage: 16.0% (threshold: 8.0%)

🚨 CRITICAL THRESHOLD EXCEEDED!
   Reasons:
   - 8 customers at high risk (threshold: 3)
   - Average churn rate 62.3% (threshold: 50.0%)
   - 16.0% of customers at high risk (threshold: 8.0%)
   
   ✅ Voice call triggered and alert created
```

**Say:**
> "Now watch this - the system checks our configured thresholds. We set it to alert if more than 3 customers are at high risk. We have 8, so all three thresholds are exceeded."

**Explain:**
- Threshold 1: 8 customers ≥ 3 ✓
- Threshold 2: 62% churn ≥ 50% ✓
- Threshold 3: 16% high-risk ≥ 8% ✓

**Say:**
> "Because thresholds are exceeded, the system is now triggering multi-channel alerts..."

---

### Part 6: Voice Call! (1 minute)

**Your phone rings!** ☎️

**Say:**
> "And there it is - my phone is ringing right now!"

**Do:**
1. Answer the phone on speaker
2. Let everyone hear the message

**Voice Message:**
```
"Critical alert from SIM-OPS. 

8 customers are at high risk of churning. 

This represents 16 percent of your customer base. 

Average churn probability is 62 percent. 

Immediate action required. 

Check your email and Slack for details.

[Pause]

Press 1 to acknowledge this alert, or press 2 to escalate."
```

**Say:**
> "The system is giving me all the critical details via voice. I can acknowledge or escalate right from the call."

**Do:**
- Press **1** to acknowledge
- Show the response: "Thank you for acknowledging..."

---

### Part 7: Multi-Channel Alerts (30 seconds)

**Say:**
> "But that's not all - the system also sent alerts through multiple channels simultaneously."

**Show:**
1. **Slack** (if configured):
   - Show the alert in Slack channel
   - Point out the formatted message with metrics

2. **Email** (if configured):
   - Open email inbox
   - Show the detailed HTML email with tables

3. **Jira** (if configured):
   - Show the created ticket
   - Point out priority and description

4. **Database**:
   ```sql
   SELECT * FROM risk_alerts 
   WHERE severity = 'critical' 
   ORDER BY created_at DESC 
   LIMIT 1;
   ```

---

### Part 8: Dashboard Updates (30 seconds)

**Say:**
> "And everything is logged in real-time in our dashboard."

**Show:**
1. Go to **Agents** page
2. Show **Activity Log** tab
3. Point out recent decisions
4. Show **Unit KPIs** with metrics

**Highlight:**
- Total decisions made
- Success rate
- Response time
- Confidence scores

---

## 🎯 Key Demo Points

### What Makes This Impressive

1. **Fully Autonomous**
   - No manual intervention needed
   - Auto-seeds data if missing
   - Runs predictions automatically
   - Checks thresholds automatically
   - Triggers alerts automatically

2. **Intelligent Thresholds**
   - Not per-customer (noisy)
   - Aggregate-based (strategic)
   - Configurable sensitivity
   - Multiple threshold types

3. **Multi-Channel**
   - Voice call (immediate)
   - Slack (team awareness)
   - Email (detailed info)
   - Jira (action tracking)
   - Database (audit trail)

4. **Production-Ready**
   - Real ML models (86.94% accuracy)
   - Scalable architecture
   - Comprehensive logging
   - Error handling

---

## 🎨 Customization for Your Demo

### Make It Easier to Trigger

```env
# Super sensitive (always triggers)
VOICE_CALL_THRESHOLD_COUNT="1"
VOICE_CALL_THRESHOLD_CHURN="0.30"
VOICE_CALL_THRESHOLD_PERCENTAGE="0.05"
```

### Make It Harder to Trigger

```env
# Conservative (rarely triggers)
VOICE_CALL_THRESHOLD_COUNT="15"
VOICE_CALL_THRESHOLD_CHURN="0.80"
VOICE_CALL_THRESHOLD_PERCENTAGE="0.25"
```

### Adjust Customer Distribution

Edit `src/app/api/cron/predictions/route.ts`, find `autoSeedCustomers()`:

```typescript
// More high-risk customers (easier to trigger)
case 4: // Churning customers (40% instead of 20%)
  if (i % 5 === 4 || i % 5 === 3) {
    profile = { /* high-risk profile */ };
  }
```

---

## 🔄 Demo Reset

To run the demo again:

### Option 1: Quick Reset (Keep Customers)

```sql
-- Clear predictions and alerts only
DELETE FROM ml_predictions;
DELETE FROM risk_alerts;
DELETE FROM agent_decisions WHERE created_at > NOW() - INTERVAL '1 hour';
```

Then trigger pipeline again.

### Option 2: Full Reset (Fresh Start)

```sql
-- Clear everything
DELETE FROM customers;
DELETE FROM ml_predictions;
DELETE FROM risk_alerts;
DELETE FROM agent_decisions;
```

Then trigger pipeline - it will auto-seed again.

---

## 📊 Expected Timeline

```
0:00 - Click "Trigger Pipeline"
0:01 - Auto-seed customers (if needed)
0:05 - ML predictions running
0:10 - Predictions complete
0:11 - Threshold check
0:12 - Voice call initiated
0:15 - Phone rings
0:20 - Answer and listen
0:30 - Acknowledge alert
0:35 - Show other channels
0:40 - Show dashboard
```

**Total: ~40 seconds from click to phone ringing!**

---

## 💡 Demo Tips

### Before Demo

- [ ] Test Twilio credentials work
- [ ] Set demo-friendly thresholds
- [ ] Clear old data (optional)
- [ ] Have phone ready and charged
- [ ] Test phone volume (loud enough for audience)
- [ ] Open browser console for logs
- [ ] Have dashboard open in browser
- [ ] Test internet connection

### During Demo

- [ ] Speak clearly and confidently
- [ ] Let the phone ring audibly
- [ ] Put phone on speaker when answering
- [ ] Show console output on screen
- [ ] Highlight key metrics
- [ ] Explain the "why" not just "what"
- [ ] Show multiple channels
- [ ] Emphasize automation

### After Demo

- [ ] Show dashboard data
- [ ] Explain business value
- [ ] Discuss customization options
- [ ] Answer questions
- [ ] Offer to run again with different thresholds

---

## 🎤 Sample Talking Points

### Opening
> "This is SIM-OPS - an autonomous AI system that monitors your business 24/7 and takes action when critical situations arise."

### During Auto-Seed
> "Notice how the system is intelligent - it detected no data and automatically created realistic customer profiles. In production, this would be your real customers."

### During Predictions
> "Right now, machine learning models are analyzing each customer's behavior, engagement, payment history, and support tickets to predict churn risk."

### During Threshold Check
> "The system doesn't alert for every single customer - that would be noisy. Instead, it looks at aggregate metrics and only alerts when systemic issues arise."

### During Voice Call
> "This is the key differentiator - critical alerts get immediate voice calls. You can't miss this. And I can respond right from the call."

### Closing
> "All of this happened automatically in under a minute. No human intervention. No manual checks. The system is continuously watching and will alert us the moment something critical happens."

---

## 🎯 Success Metrics

Your demo is successful if:

- ✅ Phone rings within 30 seconds
- ✅ Voice message is clear and audible
- ✅ Audience understands the automation
- ✅ Thresholds make sense
- ✅ Multi-channel alerts are visible
- ✅ Dashboard shows real-time data
- ✅ Questions are answered confidently

---

## 🚨 Troubleshooting During Demo

### Phone Doesn't Ring

**Quick Fix:**
1. Check console for "Voice call initiated"
2. If yes, check phone number is correct
3. If no, check Twilio credentials
4. Fallback: Show Slack/Email alerts instead

### No Customers Auto-Seeded

**Quick Fix:**
1. Check console for "auto-seeding" message
2. If error, run manual seed before demo
3. Explain: "We pre-loaded customer data"

### Thresholds Not Exceeded

**Quick Fix:**
1. Lower thresholds in `.env.local`
2. Restart app
3. Trigger again
4. Or explain: "System is healthy - no alerts needed"

---

## 📚 Follow-Up Materials

After demo, share:
- `TWILIO_THRESHOLD_GUIDE.md` - Technical details
- `TWILIO_INTEGRATION_SUMMARY.md` - Overview
- `README.md` - Project documentation
- Dashboard URL for live exploration

---

**Your demo is now fully automated and ready to impress!** 🎯📞✨

**Key Advantage**: No manual setup during demo - just click and watch it work!
