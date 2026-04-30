# Twilio Voice Call Integration - Setup Guide

## 🎯 Overview

SIM-OPS now supports **voice call notifications** for critical alerts using Twilio. When a critical churn risk or anomaly is detected, the system can automatically call designated personnel with a voice message.

---

## 📞 When Voice Calls Are Triggered

Voice calls are made **ONLY for CRITICAL severity alerts**:

### 1. Critical Churn Alerts
- **Trigger**: Customer churn probability >70% AND worsening trend
- **Call To**: Account manager or retention team
- **Message**: "Critical alert from SIM-OPS. Customer [ID] has [X]% churn probability. Immediate action required."

### 2. Critical Anomaly Alerts
- **Trigger**: System anomaly with critical severity
- **Call To**: Operations team
- **Message**: "Critical anomaly detected in [metric]. Actual value is [X], expected range is [Y] to [Z]. Immediate investigation required."

### Alert Severity Levels
```
LOW      → Slack only
MEDIUM   → Slack only
HIGH     → Slack + Jira + Email
CRITICAL → Slack + Jira + Email + VOICE CALL ☎️
```

---

## 🚀 Setup Instructions

### Step 1: Create Twilio Account

1. Go to https://www.twilio.com/
2. Sign up for a free account
3. You'll get **$15 free credit** (enough for ~100 calls)

### Step 2: Get Twilio Credentials

1. Go to Twilio Console: https://console.twilio.com/
2. Find your **Account SID** and **Auth Token** on the dashboard
3. Copy these values

### Step 3: Get a Twilio Phone Number

1. In Twilio Console, go to **Phone Numbers** → **Manage** → **Buy a number**
2. Choose a number (free with trial account)
3. Configure the number:
   - **Voice & Messaging**: Enable
   - **Accept Incoming**: Voice Calls
4. Copy the phone number (format: +1234567890)

### Step 4: Configure Environment Variables

Add these to your `.env.local` file:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your_auth_token_here"
TWILIO_PHONE_NUMBER="+1234567890"

# Alert Phone Numbers
ALERT_PHONE_NUMBER="+1234567890"           # Primary alert recipient
ACCOUNT_MANAGER_PHONE="+1234567890"        # For churn alerts
OPS_PHONE_NUMBER="+1234567890"             # For anomaly alerts

# Your App URL (for webhooks)
NEXT_PUBLIC_APP_URL="http://localhost:3000"  # Local dev
# NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"  # Production
```

### Step 5: Configure Twilio Webhooks (Production Only)

For production deployment, configure webhooks in Twilio Console:

1. Go to **Phone Numbers** → **Manage** → **Active Numbers**
2. Click on your phone number
3. Scroll to **Voice Configuration**
4. Set **A Call Comes In**:
   - **Webhook**: `https://your-app.vercel.app/api/twilio/response`
   - **HTTP Method**: POST
5. Set **Status Callback URL**:
   - **URL**: `https://your-app.vercel.app/api/twilio/status`
   - **HTTP Method**: POST

**Note**: For local development, webhooks won't work unless you use ngrok or similar tunneling service.

---

## 🧪 Testing Voice Calls

### Option 1: Test via API

Create a test endpoint or use the existing cron:

```bash
# Trigger a critical alert (will make voice call)
curl -X POST http://localhost:3000/api/test-voice-call \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "test_customer",
    "churn_probability": 0.95,
    "severity": "critical"
  }'
```

### Option 2: Test Directly

Create a test file `test-voice-call.ts`:

```typescript
import { actionExecutor } from "@/lib/actions/executor";

async function testVoiceCall() {
  await actionExecutor.execute({
    type: "churn_alert",
    severity: "critical",
    data: {
      customer_id: "test_customer_123",
      churn_probability: 0.95,
      risk_level: "critical",
      contributing_factors: [
        { factor: "Low engagement", importance: 45 },
        { factor: "Payment failures", importance: 35 },
      ],
      recommended_actions: [
        "Contact customer immediately",
        "Offer retention discount",
      ],
    },
  });
}

testVoiceCall();
```

Run with:
```bash
npx tsx test-voice-call.ts
```

### Option 3: Trigger via Dashboard

Manually trigger a critical alert through the SIM-OPS dashboard by:
1. Setting a customer's churn probability >70%
2. Marking trend as "worsening"
3. Running the prediction agent

---

## 📱 Voice Call Flow

### 1. Call Initiated
```
System detects critical alert
    ↓
Twilio API called
    ↓
Call placed to phone number
    ↓
Status: "initiated"
```

### 2. Call Ringing
```
Phone rings
    ↓
Status: "ringing"
    ↓
Webhook sent to /api/twilio/status
```

### 3. Call Answered
```
Recipient answers
    ↓
Status: "in-progress"
    ↓
Voice message plays:
"Critical alert from SIM-OPS. Customer [ID] has [X]% churn probability. 
Immediate action required. Check your email and Slack for details."
    ↓
Pause (2 seconds)
    ↓
"Press 1 to acknowledge this alert, or press 2 to escalate."
```

### 4. User Response
```
User presses 1:
    ↓
"Thank you for acknowledging this alert. 
The incident has been marked as acknowledged. Goodbye."
    ↓
Alert status updated in database

OR

User presses 2:
    ↓
"This alert has been escalated to management. 
You will receive a follow-up shortly. Goodbye."
    ↓
Escalation workflow triggered
```

### 5. Call Completed
```
Call ends
    ↓
Status: "completed"
    ↓
Duration logged
    ↓
Activity recorded in database
```

---

## 🔧 Customization

### Change Voice Message

Edit `src/lib/actions/executor.ts`, find the `makeVoiceCall` method:

```typescript
const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice" language="en-US">
        Your custom message here
    </Say>
</Response>`;
```

**Available Voices**:
- `alice` (female, US English) - Default
- `man` (male, US English)
- `woman` (female, US English)
- `Polly.Joanna` (Amazon Polly, more natural)
- `Polly.Matthew` (Amazon Polly, male)

**Available Languages**:
- `en-US` (US English)
- `en-GB` (British English)
- `es-ES` (Spanish)
- `fr-FR` (French)
- `de-DE` (German)

### Add More Response Options

Edit `src/app/api/twilio/response/route.ts`:

```typescript
if (digits === "3") {
    // Custom action
    twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice" language="en-US">
        Your custom response here
    </Say>
</Response>`;
    
    // Your custom logic
}
```

### Change When Calls Are Made

Edit `src/lib/actions/executor.ts`:

```typescript
// Current: Only CRITICAL alerts
if (context.severity === "critical") {
    await this.makeVoiceCall({...});
}

// Option 1: HIGH and CRITICAL
if (context.severity === "high" || context.severity === "critical") {
    await this.makeVoiceCall({...});
}

// Option 2: Based on churn probability
if (churn_probability > 0.85) {
    await this.makeVoiceCall({...});
}

// Option 3: Time-based (only during business hours)
const hour = new Date().getHours();
if (context.severity === "critical" && hour >= 9 && hour <= 17) {
    await this.makeVoiceCall({...});
}
```

---

## 💰 Pricing

### Twilio Costs (as of 2024)
- **Voice calls (US)**: $0.0085/minute (~$0.51/hour)
- **Phone number**: $1.15/month
- **Free trial**: $15 credit (enough for ~100 calls)

### Example Monthly Costs
```
Scenario 1: 10 critical alerts/month (avg 2 min each)
= 20 minutes × $0.0085 = $0.17/month

Scenario 2: 50 critical alerts/month (avg 2 min each)
= 100 minutes × $0.0085 = $0.85/month

Scenario 3: 100 critical alerts/month (avg 2 min each)
= 200 minutes × $0.0085 = $1.70/month

Plus phone number: $1.15/month
Total: $1.32 - $2.85/month
```

**Very affordable for critical alerting!**

---

## 📊 Monitoring Voice Calls

### View Call Logs in Database

```sql
-- Recent voice calls
SELECT * FROM activity_logs
WHERE type = 'voice_call'
ORDER BY created_at DESC
LIMIT 10;

-- Call status updates
SELECT * FROM activity_logs
WHERE type = 'voice_call_status'
ORDER BY created_at DESC
LIMIT 20;

-- User responses
SELECT * FROM activity_logs
WHERE type = 'voice_call_response'
ORDER BY created_at DESC
LIMIT 10;

-- Failed calls
SELECT * FROM activity_logs
WHERE type = 'alert_failed'
AND source = 'voice_call'
ORDER BY created_at DESC;
```

### View in Twilio Console

1. Go to https://console.twilio.com/
2. Navigate to **Monitor** → **Logs** → **Calls**
3. See all calls with:
   - Duration
   - Status
   - Cost
   - Recording (if enabled)

---

## 🐛 Troubleshooting

### Issue: "Twilio not configured"

**Solution**: Check environment variables are set:
```bash
echo $TWILIO_ACCOUNT_SID
echo $TWILIO_AUTH_TOKEN
echo $TWILIO_PHONE_NUMBER
```

### Issue: "No phone number provided"

**Solution**: Set alert phone numbers in `.env.local`:
```env
ALERT_PHONE_NUMBER="+1234567890"
ACCOUNT_MANAGER_PHONE="+1234567890"
```

### Issue: Call fails with "Invalid phone number"

**Solution**: Ensure phone numbers are in E.164 format:
- ✅ Correct: `+1234567890`
- ❌ Wrong: `1234567890`, `(123) 456-7890`

### Issue: Webhooks not working locally

**Solution**: Webhooks require a public URL. Options:
1. Use ngrok: `ngrok http 3000`
2. Deploy to Vercel/production
3. Test without webhooks (calls still work, just no status updates)

### Issue: "Unverified number" error (Trial account)

**Solution**: Twilio trial accounts can only call verified numbers:
1. Go to **Phone Numbers** → **Verified Caller IDs**
2. Add and verify your phone number
3. Or upgrade to paid account (no restrictions)

---

## 🔒 Security Best Practices

### 1. Validate Twilio Requests

Add signature validation to webhook handlers:

```typescript
import twilio from "twilio";

const validateTwilioRequest = (req: Request) => {
  const signature = req.headers.get("X-Twilio-Signature");
  const url = req.url;
  const params = {}; // Parse request body
  
  return twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN!,
    signature!,
    url,
    params
  );
};
```

### 2. Protect Environment Variables

Never commit `.env.local` to git:
```bash
# .gitignore
.env.local
.env*.local
```

### 3. Rate Limiting

Prevent abuse by limiting calls:

```typescript
// In executor.ts
private callCount = 0;
private lastReset = Date.now();

async makeVoiceCall(...) {
  // Reset counter every hour
  if (Date.now() - this.lastReset > 3600000) {
    this.callCount = 0;
    this.lastReset = Date.now();
  }
  
  // Max 10 calls per hour
  if (this.callCount >= 10) {
    console.warn("Voice call rate limit exceeded");
    return false;
  }
  
  this.callCount++;
  // ... rest of code
}
```

---

## 📚 Additional Resources

### Twilio Documentation
- **Voice API**: https://www.twilio.com/docs/voice
- **TwiML**: https://www.twilio.com/docs/voice/twiml
- **Node.js SDK**: https://www.twilio.com/docs/libraries/node

### SIM-OPS Files
- **Action Executor**: `src/lib/actions/executor.ts`
- **Response Handler**: `src/app/api/twilio/response/route.ts`
- **Status Handler**: `src/app/api/twilio/status/route.ts`

---

## ✅ Setup Checklist

- [ ] Twilio account created
- [ ] Account SID and Auth Token obtained
- [ ] Twilio phone number purchased
- [ ] Environment variables configured
- [ ] Alert phone numbers added
- [ ] Test call made successfully
- [ ] Webhooks configured (production)
- [ ] Call logs verified in database
- [ ] Twilio console checked for call history

---

## 🎉 You're All Set!

Voice call notifications are now integrated into SIM-OPS!

**What happens next**:
1. System detects critical alert
2. Slack, Jira, and Email sent
3. **Voice call automatically placed** ☎️
4. Recipient receives call with alert details
5. Can acknowledge or escalate via phone keypad
6. All activity logged in database

**Critical alerts now get immediate attention through voice calls!** 📞🚨
