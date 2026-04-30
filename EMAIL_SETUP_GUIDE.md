# 📧 Email Setup Guide

## ✅ Email Configuration Complete!

Your email integration is now set up and ready to use!

---

## 📋 Configuration Summary

### **Your Settings:**
```
Email Provider: Resend
API Key: ✅ Configured (see .env.local)
Recipient: your-email@example.com
From Email: onboarding@resend.dev
From Name: SIM-OPS Agent Alerts
```

### **What's Configured:**
- ✅ Resend API integration
- ✅ Email templates (HTML formatted)
- ✅ Monitoring Agent email alerts
- ✅ Feedback Agent email alerts
- ✅ Severity-based filtering (High & Critical only)

---

## 🧪 Test Your Email Setup

### **Method 1: Test Endpoint** (Easiest)

Open in your browser or use curl:
```bash
http://localhost:3000/api/test-email
```

Or with curl:
```bash
curl http://localhost:3000/api/test-email
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Test email sent successfully to your-email@example.com",
  "config": {
    "from": "SIM-OPS Agent Alerts <onboarding@resend.dev>",
    "to": "your-email@example.com"
  }
}
```

**Check your inbox:** your-email@example.com

You should receive an email with:
- Subject: "🎉 SIM-OPS Email Test - Configuration Successful!"
- Beautiful HTML formatting
- Test data table
- Link to dashboard

---

### **Method 2: Trigger Real Agent Alert**

Run an agent that will trigger an email:

```bash
# Run Monitoring Agent (will send email if churn is high)
curl -X POST http://localhost:3000/api/agents/run \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "monitoring",
    "agentName": "Monitoring Agent",
    "agentRole": "KPI deviation detection & threshold monitoring"
  }'
```

**When You'll Get Emails:**
- ✅ Monitoring Agent detects HIGH or CRITICAL churn
- ✅ Feedback Agent triggers retraining (CRITICAL or HIGH)

---

## 📧 Email Examples

### **1. Monitoring Agent Alert**

**Subject:** 🔴 Monitoring Agent: Churn rate exceeds threshold: 4.0% > 3%

**Content:**
```
┌─────────────────────────────────────┐
│ Monitoring Agent Alert              │
├─────────────────────────────────────┤
│ 🔴 High                             │
│                                     │
│ Current churn rate is 33% above     │
│ threshold. Data from Stripe. This   │
│ requires immediate attention.       │
│                                     │
│ Churn Rate: 4.0%                    │
│ Threshold: 3%                       │
│ Deviation: 33%                      │
│ Active Customers: 1,247             │
│ Source: Stripe                      │
│                                     │
│ [View in Dashboard →]               │
└─────────────────────────────────────┘
```

---

### **2. Feedback Agent Alert**

**Subject:** 🚨 Feedback Agent: Model retraining triggered (confidence: 0.0%)

**Content:**
```
┌─────────────────────────────────────┐
│ Feedback Agent Alert                │
├─────────────────────────────────────┤
│ 🚨 Critical                         │
│                                     │
│ Analyzed 45 predictions and 67      │
│ decisions over 7 days. Retraining   │
│ threshold breached.                 │
│                                     │
│ Predictions Analyzed: 45            │
│ Decisions Analyzed: 67              │
│ Avg Confidence: 0.0%                │
│ Confidence Drift: 10.5%             │
│ Action Success Rate: 73.1%          │
│ Threshold: 70%                      │
│                                     │
│ [View in Dashboard →]               │
└─────────────────────────────────────┘
```

---

## ⚙️ Configuration Details

### **Environment Variables:**

Your `.env.local` should have:
```env
# Email Configuration
EMAIL_TO="your-email@example.com"
EMAIL_FROM="onboarding@resend.dev"
EMAIL_FROM_NAME="SIM-OPS Agent Alerts"
RESEND_API_KEY="your_resend_api_key_here"
```

### **When Emails Are Sent:**

| Agent | Condition | Severity |
|-------|-----------|----------|
| **Monitoring** | Churn > threshold | HIGH or CRITICAL |
| **Feedback** | Retraining needed | HIGH or CRITICAL |
| **Prediction** | Not configured yet | - |
| **Decision** | Not configured yet | - |
| **Action** | Not configured yet | - |
| **Reporting** | Not configured yet | - |

---

## 🎨 Email Features

### **Beautiful HTML Templates:**
- ✅ Responsive design
- ✅ Color-coded severity (Blue/Yellow/Orange/Red)
- ✅ Data tables with key metrics
- ✅ Action buttons linking to dashboard
- ✅ Professional formatting
- ✅ Mobile-friendly

### **Severity Colors:**
- 🔵 **Low:** Blue (#3b82f6)
- 🟡 **Medium:** Yellow (#f59e0b)
- 🟠 **High:** Orange (#ef4444)
- 🔴 **Critical:** Red (#dc2626)

---

## 🔧 Customization

### **Change Recipient Email:**

Edit `.env.local`:
```env
EMAIL_TO="your-email@example.com"
```

### **Change From Email:**

**Note:** With Resend free tier, you can only send from:
- `onboarding@resend.dev` (default)
- Your verified domain (requires DNS setup)

To use your own domain:
1. Go to https://resend.com/domains
2. Add your domain
3. Update DNS records
4. Update `.env.local`:
   ```env
   EMAIL_FROM="alerts@yourdomain.com"
   ```

### **Change From Name:**

Edit `.env.local`:
```env
EMAIL_FROM_NAME="Your Company Alerts"
```

---

## 📊 Add Email to More Agents

Want other agents to send emails too? Here's how:

### **Example: Add to Prediction Agent**

Edit `src/lib/agents/executor.ts`:

```typescript
// In executePredictionAgent method, after Slack alert:

// Send Email alert if high-risk customers found
if (highRisk.length >= criticalCount) {
  const emailConfig = getEmailConfig();
  const emailTo = process.env.EMAIL_TO;

  if (emailConfig && emailTo) {
    const email = new EmailIntegration(emailConfig);
    await email.sendAgentSummary(
      emailTo,
      "Prediction Agent",
      `${highRisk.length} high-risk customers identified`,
      `ML analysis found ${highRisk.length} customers with >80% churn probability.`,
      severity,
      {
        "Total Analyzed": validPredictions.length,
        "High Risk": highRisk.length,
        "Medium Risk": mediumRisk.length,
        "Model Accuracy": "86.94%",
      }
    );
  }
}
```

---

## 🧪 Testing Checklist

- [ ] Test endpoint returns success
- [ ] Email received in inbox (check spam folder)
- [ ] Email displays correctly (HTML formatting)
- [ ] Links work (dashboard button)
- [ ] Run Monitoring Agent
- [ ] Receive Monitoring Agent email
- [ ] Run Feedback Agent
- [ ] Receive Feedback Agent email

---

## 🚨 Troubleshooting

### **Issue: No email received**

**Check:**
1. ✅ Spam/Junk folder
2. ✅ Email address is correct in `.env.local`
3. ✅ Resend API key is valid
4. ✅ Dev server restarted after changing `.env.local`

**Test:**
```bash
curl http://localhost:3000/api/test-email
```

---

### **Issue: "Email not configured" error**

**Fix:**
```bash
# Restart dev server
# Stop with Ctrl+C
npm run dev
```

Environment variables are loaded on server start.

---

### **Issue: Email from wrong address**

**Note:** Resend free tier only allows `onboarding@resend.dev`

To use custom domain:
1. Upgrade Resend plan
2. Add and verify your domain
3. Update `EMAIL_FROM` in `.env.local`

---

### **Issue: HTML not rendering**

**Check:** Email client supports HTML
- ✅ Gmail: Full support
- ✅ Outlook: Full support
- ✅ Apple Mail: Full support
- ⚠️ Some clients may show plain text

---

## 📈 Email Limits

### **Resend Free Tier:**
- 100 emails/day
- 1 email/second
- From `onboarding@resend.dev` only

### **Resend Pro:**
- 50,000 emails/month
- Custom domains
- Higher rate limits

---

## 🎯 Next Steps

1. **Test the setup:**
   ```bash
   curl http://localhost:3000/api/test-email
   ```

2. **Check your inbox:**
   - Look for test email
   - Verify formatting
   - Click dashboard link

3. **Trigger real alerts:**
   ```bash
   # Run agents to generate alerts
   curl -X POST http://localhost:3000/api/agents/run-all \
     -H "Content-Type: application/json" \
     -d '{"agents":[...]}'
   ```

4. **Monitor emails:**
   - Check for Monitoring Agent alerts
   - Check for Feedback Agent alerts
   - Verify data is correct

---

## 📚 Files Created/Modified

### **Created:**
- ✅ `src/lib/integrations/email.ts` - Email integration class
- ✅ `src/app/api/test-email/route.ts` - Test endpoint
- ✅ `EMAIL_SETUP_GUIDE.md` - This guide

### **Modified:**
- ✅ `.env.local` - Added email configuration
- ✅ `src/lib/agents/executor.ts` - Added email alerts to agents

---

## 🎊 You're All Set!

Your email integration is complete and ready to use!

**Test it now:**
```
http://localhost:3000/api/test-email
```

**Check your inbox:** arshvirsk26@gmail.com

You should receive a beautiful test email! 📧✨
