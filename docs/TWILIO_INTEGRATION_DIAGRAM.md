# Twilio Voice Call Integration - Visual Flow

## 🎯 Complete System Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    CRITICAL ALERT DETECTED                       │
│                                                                  │
│  • Churn probability >70% + worsening trend                     │
│  • System anomaly with critical severity                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                   MULTI-CHANNEL NOTIFICATION                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Slack Alert        → #alerts channel                        │
│  2. Jira Ticket        → RETENTION/OPS project                  │
│  3. Email              → Account manager/Ops team               │
│  4. VOICE CALL ☎️      → Phone number (NEW!)                    │
│                                                                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                      TWILIO API CALL                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  POST https://api.twilio.com/2010-04-01/Accounts/{SID}/Calls   │
│                                                                  │
│  Parameters:                                                     │
│  • To: +1234567890 (alert recipient)                           │
│  • From: +1987654321 (Twilio number)                           │
│  • TwiML: Voice message XML                                     │
│  • StatusCallback: /api/twilio/status                          │
│                                                                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                      CALL INITIATED                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Status: "initiated"                                            │
│  Call SID: CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx                   │
│                                                                  │
│  Webhook → /api/twilio/status                                   │
│  Logged in activity_logs table                                  │
│                                                                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                      PHONE RINGING                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Status: "ringing"                                              │
│  📱 Ring... Ring... Ring...                                     │
│                                                                  │
│  Webhook → /api/twilio/status                                   │
│  Logged in activity_logs table                                  │
│                                                                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                      CALL ANSWERED                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Status: "in-progress"                                          │
│  🎧 User picks up phone                                         │
│                                                                  │
│  Webhook → /api/twilio/status                                   │
│  Logged in activity_logs table                                  │
│                                                                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                    VOICE MESSAGE PLAYS                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🔊 "Critical alert from SIM-OPS.                               │
│                                                                  │
│      Customer [ID] has [X] percent churn probability.           │
│      Immediate action required.                                 │
│                                                                  │
│      Check your email and Slack for details."                   │
│                                                                  │
│  [Pause 2 seconds]                                              │
│                                                                  │
│  🔊 "Press 1 to acknowledge this alert,                         │
│      or press 2 to escalate."                                   │
│                                                                  │
│  🔊 "Waiting for your response..."                              │
│                                                                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                     USER PRESSES KEY                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User presses: 1 or 2                                           │
│                                                                  │
│  Webhook → /api/twilio/response                                 │
│  Parameters: Digits=1, CallSid=CAxxxx, From=+1234567890        │
│                                                                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                ┌────────┴────────┐
                │                 │
                ↓                 ↓
┌──────────────────────┐  ┌──────────────────────┐
│   USER PRESSED 1     │  │   USER PRESSED 2     │
│   (Acknowledge)      │  │   (Escalate)         │
├──────────────────────┤  ├──────────────────────┤
│                      │  │                      │
│  🔊 "Thank you for   │  │  🔊 "This alert has  │
│  acknowledging this  │  │  been escalated to   │
│  alert. The incident │  │  management. You     │
│  has been marked as  │  │  will receive a      │
│  acknowledged.       │  │  follow-up shortly.  │
│  Goodbye."           │  │  Goodbye."           │
│                      │  │                      │
│  Database Update:    │  │  Database Update:    │
│  • Alert status →    │  │  • Log escalation    │
│    "acknowledged"    │  │  • Create high-      │
│  • acknowledged_at   │  │    priority ticket   │
│    timestamp         │  │  • Notify management │
│                      │  │                      │
└──────────┬───────────┘  └──────────┬───────────┘
           │                         │
           └────────┬────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│                      CALL COMPLETED                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Status: "completed"                                            │
│  Duration: 45 seconds                                           │
│  Cost: $0.006                                                   │
│                                                                  │
│  Webhook → /api/twilio/status                                   │
│  Logged in activity_logs table                                  │
│                                                                  │
│  Final Log Entry:                                               │
│  • type: "voice_call_status"                                    │
│  • status: "completed"                                          │
│  • duration: 45                                                 │
│  • call_sid: CAxxxx                                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Database Activity Logs

```
activity_logs table:

┌────────────────────────────────────────────────────────────────┐
│ id  │ type                  │ source      │ message            │
├────────────────────────────────────────────────────────────────┤
│ 1   │ voice_call            │ twilio      │ Call initiated     │
│ 2   │ voice_call_status     │ twilio      │ Status: initiated  │
│ 3   │ voice_call_status     │ twilio      │ Status: ringing    │
│ 4   │ voice_call_status     │ twilio      │ Status: answered   │
│ 5   │ voice_call_response   │ twilio      │ User pressed 1     │
│ 6   │ alert_delivered       │ voice_call  │ Alert acknowledged │
│ 7   │ voice_call_status     │ twilio      │ Status: completed  │
└────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Alternative Flows

### Flow 1: Call Not Answered

```
Call Initiated
    ↓
Phone Ringing
    ↓
No Answer (30 seconds)
    ↓
Status: "no-answer"
    ↓
Logged as "alert_failed"
    ↓
[Optional] Retry after 5 minutes
    OR
[Optional] Send SMS fallback
    OR
[Optional] Escalate to backup number
```

### Flow 2: Call Failed

```
Call Initiated
    ↓
Status: "failed"
    ↓
Reason: Invalid number / Network error
    ↓
Logged as "alert_failed"
    ↓
[Optional] Try alternative notification method
```

### Flow 3: Line Busy

```
Call Initiated
    ↓
Phone Ringing
    ↓
Status: "busy"
    ↓
Logged as "alert_failed"
    ↓
[Optional] Retry after 2 minutes
```

---

## 🎯 Integration Points

### 1. Action Executor
```
File: src/lib/actions/executor.ts

handleChurnAlert()
    ↓
if (severity === "critical")
    ↓
makeVoiceCall()
    ↓
Twilio API
```

### 2. Twilio Response Handler
```
File: src/app/api/twilio/response/route.ts

User presses key
    ↓
POST /api/twilio/response
    ↓
Parse digits (1 or 2)
    ↓
Update database
    ↓
Return TwiML response
```

### 3. Twilio Status Handler
```
File: src/app/api/twilio/status/route.ts

Call status changes
    ↓
POST /api/twilio/status
    ↓
Parse status
    ↓
Log to database
    ↓
Handle failures
```

---

## 📱 Phone Number Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    PHONE NUMBER ROUTING                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Alert Type: CHURN                                          │
│      ↓                                                       │
│  Check: ACCOUNT_MANAGER_PHONE                               │
│      ↓                                                       │
│  Fallback: ALERT_PHONE_NUMBER                               │
│                                                              │
│  Alert Type: ANOMALY                                        │
│      ↓                                                       │
│  Check: OPS_PHONE_NUMBER                                    │
│      ↓                                                       │
│  Fallback: ALERT_PHONE_NUMBER                               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Security Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY MEASURES                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Environment Variables                                    │
│     • TWILIO_ACCOUNT_SID (secret)                           │
│     • TWILIO_AUTH_TOKEN (secret)                            │
│     • Never committed to git                                │
│                                                              │
│  2. API Authentication                                       │
│     • Test endpoint requires Bearer token                   │
│     • Configurable via TEST_API_SECRET                      │
│                                                              │
│  3. Webhook Validation (Optional)                           │
│     • Verify X-Twilio-Signature header                      │
│     • Prevent unauthorized webhook calls                    │
│                                                              │
│  4. Rate Limiting (Optional)                                │
│     • Max calls per hour                                    │
│     • Prevent abuse and cost overruns                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 💰 Cost Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      COST BREAKDOWN                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Call Initiated                                             │
│      ↓                                                       │
│  Ringing (no charge)                                        │
│      ↓                                                       │
│  Answered                                                    │
│      ↓                                                       │
│  Billing starts: $0.0085/minute                             │
│      ↓                                                       │
│  Call duration: 2 minutes                                   │
│      ↓                                                       │
│  Total cost: $0.017                                         │
│                                                              │
│  Monthly phone number: $1.15                                │
│                                                              │
│  Example: 50 calls/month (2 min each)                       │
│  = 100 minutes × $0.0085 = $0.85                            │
│  + Phone number = $1.15                                     │
│  = Total: $2.00/month                                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Testing Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      TEST ENDPOINT                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  curl -X POST /api/test-voice-call                          │
│      ↓                                                       │
│  Verify Bearer token                                        │
│      ↓                                                       │
│  Create test alert data                                     │
│      ↓                                                       │
│  Call actionExecutor.execute()                              │
│      ↓                                                       │
│  Trigger voice call                                         │
│      ↓                                                       │
│  Return success response                                    │
│                                                              │
│  Expected result:                                           │
│  • Phone rings in 5-10 seconds                              │
│  • Voice message plays                                      │
│  • Database logs created                                    │
│  • Twilio console shows call                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Monitoring Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│                    MONITORING POINTS                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Database (activity_logs)                                │
│     • voice_call: Call initiated                            │
│     • voice_call_status: Status updates                     │
│     • voice_call_response: User responses                   │
│     • alert_delivered: Successful delivery                  │
│     • alert_failed: Failed calls                            │
│                                                              │
│  2. Twilio Console                                          │
│     • Call logs with duration                               │
│     • Status history                                        │
│     • Cost per call                                         │
│     • Error messages                                        │
│                                                              │
│  3. Application Logs                                        │
│     • Console output                                        │
│     • Error traces                                          │
│     • API responses                                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Success Metrics

```
┌─────────────────────────────────────────────────────────────┐
│                    KEY METRICS                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Call Success Rate                                          │
│  = (Answered calls / Total calls) × 100%                    │
│  Target: >90%                                               │
│                                                              │
│  Response Rate                                              │
│  = (Calls with user response / Answered calls) × 100%      │
│  Target: >80%                                               │
│                                                              │
│  Average Call Duration                                      │
│  = Total duration / Number of calls                         │
│  Target: 1-3 minutes                                        │
│                                                              │
│  Cost per Alert                                             │
│  = Total Twilio cost / Number of alerts                     │
│  Target: <$0.05                                             │
│                                                              │
│  Time to Acknowledgment                                     │
│  = Time from call to user response                          │
│  Target: <2 minutes                                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

**Visual representation of the complete Twilio voice call integration!** 📞📊
