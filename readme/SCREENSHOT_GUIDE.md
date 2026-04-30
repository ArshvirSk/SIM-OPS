# 📸 Screenshot Guide for SIM-OPS

## Overview
This guide will help you capture all necessary screenshots for the README documentation.

## Required Screenshots

### 1. Banner (banner.png)
**Dimensions**: 1200x300px  
**Tool**: Canva / Figma / Photoshop

**Content**:
- Background: Gradient from #0ea5e9 to #06b6d4
- Text: "SIM-OPS" (large, bold, white)
- Subtitle: "AI-Powered Customer Retention Platform" (smaller, white)
- Icons: Robot emoji 🤖, Chart emoji 📊, Lightning emoji ⚡

**Quick Create**:
1. Go to https://www.canva.com
2. Create custom size: 1200x300
3. Add gradient background (blue)
4. Add text and icons
5. Download as PNG

---

### 2. Dashboard (dashboard.png)
**URL**: `http://localhost:3000`  
**Dimensions**: 1920x1080px

**What to Show**:
- ✅ KPI cards at top (Churn Rate, CLV, Revenue, Active Customers)
- ✅ Prediction trend chart
- ✅ Risk distribution chart
- ✅ Recent activity feed
- ✅ Agent status indicators

**Steps**:
1. Start dev server: `npm run dev`
2. Navigate to dashboard
3. Wait for data to load
4. Press `Win + Shift + S` (Windows) or `Cmd + Shift + 4` (Mac)
5. Capture full screen
6. Save as `dashboard.png`

---

### 3. Customer Detail (customer-detail.png)
**URL**: `http://localhost:3000/customers/[any-customer-id]`  
**Dimensions**: 1920x1080px

**What to Show**:
- ✅ Customer info card with risk score
- ✅ Risk score visualization (circular progress)
- ✅ Contributing factors list with percentages
- ✅ AI-generated recommendations
- ✅ Historical activity

**Steps**:
1. Go to dashboard
2. Click on any customer card
3. Wait for AI recommendations to load
4. Scroll to show all sections
5. Take screenshot
6. Save as `customer-detail.png`

---

### 4. Action Plan Modal (customer-actions.png)
**URL**: Same as customer detail  
**Dimensions**: 1920x1080px

**What to Show**:
- ✅ Action plan modal (open)
- ✅ Timeline with steps
- ✅ Success metrics
- ✅ Resources needed
- ✅ Draft content panel (sliding from right)

**Steps**:
1. On customer detail page
2. Click "View Action Plan" on any recommendation
3. Wait for modal to open
4. Click "Get Draft" button
5. Wait for draft panel to slide in from right
6. Take screenshot showing both modal and panel
7. Save as `customer-actions.png`

---

### 5. Agents Page (agents.png)
**URL**: `http://localhost:3000/agents`  
**Dimensions**: 1920x1080px

**What to Show**:
- ✅ All 6 agent cards
- ✅ Status indicators (idle/active/processing)
- ✅ Actions today count
- ✅ Last action timestamp
- ✅ Run buttons

**Steps**:
1. Navigate to Agents page
2. Ensure some agents have activity
3. Take screenshot
4. Save as `agents.png`

---

### 6. Agent Communication (agent-communication.png)
**URL**: `http://localhost:3000/agents`  
**Dimensions**: 1920x1080px

**What to Show**:
- ✅ Agent communication flow diagram
- ✅ Message arrows between agents
- ✅ Recent communications list

**Steps**:
1. On agents page, scroll down
2. Find "Agent Communications" section
3. Take screenshot of the flow diagram
4. Save as `agent-communication.png`

---

### 7. Predictions (predictions.png)
**URL**: `http://localhost:3000/predictions`  
**Dimensions**: 1920x1080px

**What to Show**:
- ✅ Prediction history table
- ✅ Risk distribution chart
- ✅ Filter controls
- ✅ Pagination

**Steps**:
1. Navigate to Predictions page
2. Ensure table has data
3. Take screenshot
4. Save as `predictions.png`

---

### 8. ML Training (ml-training.png)
**URL**: `http://localhost:3000/ml-training`  
**Dimensions**: 1920x1080px

**What to Show**:
- ✅ Model selection dropdown
- ✅ Training button
- ✅ Model metrics display
- ✅ Training status

**Steps**:
1. Navigate to ML Training page
2. Take screenshot
3. Save as `ml-training.png`

---

### 9. Alerts (alerts.png)
**URL**: `http://localhost:3000/alerts`  
**Dimensions**: 1920x1080px

**What to Show**:
- ✅ Active alerts list
- ✅ Severity badges (critical, high, medium)
- ✅ Alert details
- ✅ Timestamp

**Steps**:
1. Navigate to Alerts page
2. Ensure some alerts exist
3. Take screenshot
4. Save as `alerts.png`

---

### 10. Incidents (incidents.png)
**URL**: `http://localhost:3000/incidents`  
**Dimensions**: 1920x1080px

**What to Show**:
- ✅ Incident list
- ✅ Priority levels (P1, P2, P3)
- ✅ Incident details
- ✅ Auto-generated runbook

**Steps**:
1. Navigate to Incidents page
2. Click on an incident to expand
3. Take screenshot showing runbook
4. Save as `incidents.png`

---

### 11. Scheduler Terminal (scheduler-terminal.png)
**Dimensions**: 1920x1080px

**What to Show**:
- ✅ Terminal with `npm run scheduler:test` running
- ✅ Scheduler status dashboard
- ✅ Job execution logs
- ✅ Success indicators

**Steps**:
1. Open terminal
2. Run: `npm run scheduler:test`
3. Wait for status dashboard to appear
4. Take screenshot
5. Save as `scheduler-terminal.png`

---

### 12. ML Service Terminal (ml-service-terminal.png)
**Dimensions**: 1920x1080px

**What to Show**:
- ✅ Terminal with `python start.py` running
- ✅ FastAPI startup logs
- ✅ Model loading messages
- ✅ API endpoints ready message

**Steps**:
1. Open terminal
2. `cd ml-service`
3. Run: `python start.py`
4. Wait for "Application startup complete"
5. Take screenshot
6. Save as `ml-service-terminal.png`

---

### 13. Architecture Diagram (architecture-diagram.png)
**Dimensions**: 1200x800px  
**Tool**: Draw.io / Excalidraw / Figma

**What to Show**:
- ✅ Frontend layer (Next.js)
- ✅ Multi-Agent System layer
- ✅ ML Service layer (Python)
- ✅ External Integrations (Slack, Twilio, etc.)
- ✅ Database layer (Supabase)
- ✅ Arrows showing data flow

**Steps**:
1. Go to https://app.diagrams.net
2. Create new diagram
3. Add boxes for each component
4. Add arrows showing connections
5. Export as PNG
6. Save as `architecture-diagram.png`

---

### 14. Mobile Responsive (mobile-responsive.png)
**Dimensions**: 375x812px (iPhone 13)

**What to Show**:
- ✅ Dashboard on mobile view
- ✅ Responsive navigation
- ✅ Touch-optimized buttons
- ✅ Collapsible sections

**Steps**:
1. Open Chrome DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select "iPhone 13 Pro"
4. Navigate to dashboard
5. Take screenshot (Ctrl+Shift+P → "Capture screenshot")
6. Save as `mobile-responsive.png`

---

## Quick Screenshot Checklist

- [ ] banner.png
- [ ] dashboard.png
- [ ] customer-detail.png
- [ ] customer-actions.png
- [ ] agents.png
- [ ] agent-communication.png
- [ ] predictions.png
- [ ] ml-training.png
- [ ] alerts.png
- [ ] incidents.png
- [ ] scheduler-terminal.png
- [ ] ml-service-terminal.png
- [ ] architecture-diagram.png
- [ ] mobile-responsive.png

## Image Optimization

After taking all screenshots, optimize them:

```bash
# Using ImageMagick (install first)
cd readme
mogrify -strip -quality 85 *.png

# Or use online tools:
# - TinyPNG: https://tinypng.com
# - Squoosh: https://squoosh.app
```

## Tips for Better Screenshots

1. **Clean Browser**: Use incognito mode or clear cache
2. **Zoom Level**: Set browser zoom to 100%
3. **Hide Cursor**: Move cursor out of frame
4. **Full Data**: Ensure all data is loaded before capturing
5. **Consistent Theme**: Use same theme (light/dark) for all screenshots
6. **High Resolution**: Use 1920x1080 or higher for clarity
7. **Annotations**: Add arrows/highlights if needed (use Snagit or similar)

## Troubleshooting

**Problem**: Screenshots are blurry  
**Solution**: Increase browser zoom to 125%, then scale down image

**Problem**: Data not showing  
**Solution**: Run `npm run seed:customers` to generate sample data

**Problem**: Agents not active  
**Solution**: Run `npm run scheduler:test` to trigger agent activity

**Problem**: No predictions  
**Solution**: Trigger cron job manually or wait for scheduler

## Need Help?

If you need help taking screenshots or creating diagrams, feel free to ask!
