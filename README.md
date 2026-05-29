<div align="center">
  <!-- Banner Placeholder -->
  <img src="/public/readme/banner.png" alt="SIM-OPS Banner" width="100%" />

  # SIM-OPS
  
  **Autonomous AI that predicts churn and executes retention before it's too late.**

  [![Live Demo](https://img.shields.io/badge/Live-Demo-indigo?style=for-the-badge)](https://sim-ops-demo.vercel.app)
  [![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
</div>

---

## 🛑 The Problem
Modern SaaS businesses often realize a customer is at risk of churning *after* they've already made the decision to leave. Sales and customer success teams are drowning in data, reacting to fires instead of proactively retaining high-value accounts.

## 🚀 The Solution
**SIM-OPS (Smart Intelligence Management for Operations Planning & Supervision)** is an autonomous, multi-agent AI system that constantly monitors telemetry, predicts customer churn with high accuracy, and proactively triggers multi-channel retention workflows without requiring human intervention.

---

## ✨ Key Features
- **🔮 Predictive ML Models:** Uses Random Forest classifiers to predict churn probabilities and Customer Lifetime Value (CLV) with >85% accuracy.
- **🤖 Autonomous Multi-Agent Pipeline:** A choreographed crew of specialized AI agents (Monitoring, Prediction, Decision, Action) powered by LangChain and LLMs to evaluate risks and act.
- **⚡ Automated Retention Workflows:** Instantly generates and executes personalized retention campaigns (Slack alerts, Jira tickets, dynamic Email sequences, and Twilio voice calls) when risk thresholds are breached.
- **📊 Real-Time Operations Dashboard:** A modern, beautiful command center built with Next.js and Tailwind CSS that visualizes live AI agent activity, revenue impact, and active anomalies.

---

## 🛠️ Tech Stack

| Category         | Technologies                                                                 |
| ---------------- | ---------------------------------------------------------------------------- |
| **Frontend**     | Next.js 14 (App Router), React, TypeScript, Tailwind CSS, shadcn/ui, Recharts |
| **Backend & DB** | Supabase (PostgreSQL + Auth), Next.js Server Actions, Vercel Cron Jobs       |
| **AI & ML**      | Python, Scikit-Learn (Random Forest/Isolation Forest), LangChain, Gemini Pro  |
| **Integrations** | Slack API, Jira API, Resend (Emails), Twilio (Voice Calls), Stripe           |

---

## 💻 Local Setup Instructions

### Prerequisites
- Node.js (v18+)
- Python (v3.11+)
- A Supabase Project
- API Keys for Google AI Studio (Gemini), Twilio, and Resend.

### 1. Clone & Install
```bash
git clone https://github.com/yourusername/sim-ops.git
cd sim-ops

# Install frontend dependencies
npm install

# Install ML service dependencies
cd ml-service
pip install -r requirements.txt
cd ..
```

### 2. Environment Configuration
Create a `.env.local` file in the root directory (see [Environment Variables Reference](#-environment-variables-reference) below).
```bash
cp .env.example .env.local
```

### 3. Database Setup
Ensure you have linked your Supabase project, then run the database setup scripts.
```bash
npm run db:setup
npm run seed:customers  # Optional: Seed mock data
```

### 4. Run the Application
You will need to run the Next.js app, the ML service, and the autonomous scheduler.
```bash
# Terminal 1: Next.js Frontend
npm run dev

# Terminal 2: Python ML Service
cd ml-service
python start.py

# Terminal 3: Local Task Scheduler
npm run scheduler:test
```
Visit `http://localhost:3000` to view the dashboard!

---

## 🔑 Environment Variables Reference

Your `.env.local` should contain the following critical variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://postgres:pass@db.your-project.supabase.co:5432/postgres

# AI / Machine Learning
GOOGLE_AI_API_KEY=your-gemini-api-key
NEXT_PUBLIC_ML_SERVICE_URL=http://localhost:8000

# Integrations (Optional for core functionality, required for Action Agent)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
RESEND_API_KEY=re_...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

---

## 📸 Screenshots

| Dashboard Overview | Customer Insights |
| :---: | :---: |
| <img src="/public/readme/dashboard-placeholder.png" alt="Dashboard" width="400"/> | <img src="/public/readme/customer-placeholder.png" alt="Customer Detail" width="400"/> |
| *Real-time monitoring of AI agents and KPI metrics.* | *Deep dive into risk factors and automated retention plans.* |

---

<div align="center">
  <p>Built with ❤️ by a Full-Stack + AI Developer.</p>
</div>
