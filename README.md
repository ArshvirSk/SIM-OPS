# 🤖 SIM-OPS – Smart Intelligence Management for Operations Planning & Supervision

<div align="center">

![SIM-OPS Banner](/readme/banner.png)

**An autonomous AI-powered platform for predicting customer churn, detecting anomalies, and executing retention actions automatically.**

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.11-yellow)](https://www.python.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-purple)](LICENSE)

[Features](#-features) • [Architecture](#-architecture) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Demo](#-demo)

</div>

---

## 🌟 Features

### 🎯 Core Capabilities

- **🔮 ML-Powered Predictions**
  - Churn prediction with 85%+ accuracy
  - Customer Lifetime Value (CLV) forecasting
  - Anomaly detection in system metrics
  - Revenue forecasting with trend analysis

- **🤖 Multi-Agent AI System**
  - **Monitoring Agent**: Analyzes customer behavior patterns
  - **Prediction Agent**: Forecasts future trends and risks
  - **Decision Agent**: Evaluates actions based on business rules
  - **Action Agent**: Executes retention campaigns automatically
  - **Reporting Agent**: Generates comprehensive insights
  - **Feedback Agent**: Learns from action outcomes

- **⚡ Autonomous Actions**
  - Automatic Slack alerts for high-risk customers
  - Jira ticket creation with detailed analysis
  - Email campaigns with personalized content
  - **Voice calls** via Twilio for critical alerts
  - Aggregate threshold monitoring

- **📊 Real-Time Dashboard**
  - Live KPI tracking (churn rate, CLV, revenue)
  - Interactive prediction charts
  - Customer risk segmentation
  - Agent activity monitoring
  - System health indicators

- **🎨 Customer Intelligence**
  - 360° customer view with risk scores
  - AI-generated retention recommendations
  - Contributing factor analysis
  - Action plan generator with timelines
  - Draft content creator (emails, call scripts)

### 🛠️ Technical Features

- **Autonomous Scheduler**: Runs predictions and checks automatically
- **LangChain Integration**: AI-powered decision making with Gemini
- **Real-time Communication**: Agent-to-agent messaging system
- **Incident Management**: Auto-generated incident reports
- **ML Model Training**: Jupyter notebooks for model development
- **API-First Design**: RESTful endpoints for all operations

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Frontend                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Dashboard │  │Customers │  │ Agents   │  │Workflows │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                   Multi-Agent Orchestrator                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Monitoring│→ │Prediction│→ │ Decision │→ │  Action  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    ML Service (Python)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Churn   │  │   CLV    │  │ Anomaly  │  │ Revenue  │   │
│  │Predictor │  │Predictor │  │ Detector │  │Forecaster│   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                  External Integrations                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Slack   │  │   Jira   │  │  Resend  │  │  Twilio  │   │
│  │  Alerts  │  │ Tickets  │  │  Email   │  │  Voice   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│              Supabase (PostgreSQL + Auth)                    │
│  Customers | Predictions | Agents | Workflows | Logs        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.11+
- **Supabase** account
- **Google AI API** key (for Gemini)
- **Twilio** account (optional, for voice calls)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/sim-ops.git
cd sim-ops
```

### 2. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies
cd ml-service
pip install -r requirements.txt
cd ..
```

### 3. Configure Environment Variables

Create `.env.local` in the root directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
DATABASE_URL="postgresql://postgres:password@db.your-project.supabase.co:5432/postgres"

# ML Service
NEXT_PUBLIC_ML_SERVICE_URL="http://localhost:8000"

# AI Configuration
GOOGLE_AI_API_KEY="your-gemini-api-key"

# Cron Jobs
CRON_SECRET="your-secret-key"

# Integrations (Optional)
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."
RESEND_API_KEY="re_..."
EMAIL_FROM="onboarding@resend.dev"
EMAIL_TO="your-email@example.com"

# Twilio (Optional - for voice calls)
TWILIO_ACCOUNT_SID="ACxxxxx"
TWILIO_AUTH_TOKEN="your-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"
ALERT_PHONE_NUMBER="+1234567890"

# Voice Call Thresholds
VOICE_CALL_THRESHOLD_COUNT="1"        # Trigger if 1+ customers at high risk
VOICE_CALL_THRESHOLD_CHURN="0.30"     # Trigger if avg churn >30%
VOICE_CALL_THRESHOLD_PERCENTAGE="0.01" # Trigger if >1% at high risk
```

Create `ml-service/.env`:

```bash
GOOGLE_AI_API_KEY="your-gemini-api-key"
```

### 4. Set Up Database

```bash
# Run database setup
npm run db:setup

# Seed sample customers (optional)
npm run seed:customers
```

### 5. Train ML Models

```bash
cd ml-service

# Download datasets
python download_datasets.py

# Train models
python train_models.py

cd ..
```

### 6. Start the Application

**You need 3 terminals:**

**Terminal 1 - Next.js Server:**
```bash
npm run dev
```

**Terminal 2 - ML Service:**
```bash
cd ml-service
python start.py
```

**Terminal 3 - Autonomous Scheduler:**
```bash
npm run scheduler:test
```

### 7. Access the Application

- **Frontend**: http://localhost:3000
- **ML Service**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## 📖 Documentation

### Key Concepts

#### 🎯 Churn Prediction
The system predicts customer churn probability using:
- **Features**: Usage frequency, last login, support tickets, feature adoption
- **Model**: Random Forest Classifier (85%+ accuracy)
- **Risk Levels**: Low (<30%), Medium (30-60%), High (60-80%), Critical (>80%)

#### 💰 Customer Lifetime Value (CLV)
Predicts future revenue per customer:
- **Features**: Purchase history, engagement, tenure, support interactions
- **Model**: Random Forest Regressor
- **Segments**: Bronze (<$10K), Silver ($10K-$50K), Gold ($50K-$100K), Platinum (>$100K)

#### 🚨 Anomaly Detection
Detects unusual patterns in system metrics:
- **Algorithm**: Isolation Forest
- **Metrics**: Revenue, active users, API calls, error rates
- **Alerts**: Automatic notifications for critical anomalies

#### 🤖 Agent Pipeline
1. **Monitoring Agent**: Collects and analyzes customer data
2. **Prediction Agent**: Runs ML models and forecasts trends
3. **Decision Agent**: Applies business rules and determines actions
4. **Action Agent**: Executes retention campaigns (Slack, email, Jira, voice)
5. **Reporting Agent**: Generates insights and reports
6. **Feedback Agent**: Learns from action outcomes

### API Endpoints

#### Predictions
- `POST /api/cron/predictions` - Run batch predictions for all customers
- `POST /api/cron/anomalies` - Detect anomalies in system metrics
- `POST /api/cron/check-thresholds` - Check aggregate thresholds

#### ML Service
- `POST /predict/churn` - Predict churn for a customer
- `POST /predict/clv` - Predict customer lifetime value
- `POST /predict/anomaly` - Detect anomalies in metrics
- `POST /predict/revenue` - Forecast revenue trends

#### Agents
- `POST /api/agents/run` - Run a specific agent
- `POST /api/agents/run-all` - Run all agents
- `POST /api/agents/run-pipeline` - Execute full agent pipeline

### Autonomous Scheduler

The scheduler automatically runs:
- **Predictions**: Every 6 hours (or 5 min in test mode)
- **Anomaly Detection**: Every 1 hour (or 2 min in test mode)
- **Weekly Reports**: Every Monday at 9 AM

**Commands:**
```bash
# Production intervals
npm run scheduler

# Test mode (shorter intervals)
npm run scheduler:test
```

### Voice Call System

When aggregate thresholds are exceeded, the system automatically:
1. Sends Slack alert
2. Creates Jira ticket
3. Sends email to account manager
4. **Makes voice call** via Twilio

**Thresholds (configurable):**
- High-risk customer count
- Average churn rate
- High-risk percentage

**Voice Call Flow:**
1. System detects threshold exceeded
2. Generates voice message with TwiML
3. Calls configured phone number
4. Recipient can press 1 (acknowledge) or 2 (escalate)
5. Status tracked via webhooks

---



---

## 🎨 Screenshots

### 📊 Dashboard Overview
The main dashboard provides real-time insights into customer health, churn predictions, and system performance.

![Dashboard](docs/screenshots/dashboard.png)

**Key Features:**
- Live KPI tracking (Churn Rate, CLV, Revenue, Active Customers)
- Interactive prediction charts with trend analysis
- Recent activity feed
- Agent status monitoring
- Quick action buttons

---

### 👤 Customer Detail View
Comprehensive 360° view of individual customers with AI-powered insights and retention recommendations.

![Customer Detail](docs/screenshots/customer-detail.png)

**Highlights:**
- Risk score with financial impact metrics
- Contributing factors with importance weights
- AI-generated retention recommendations
- Historical activity timeline
- Quick action buttons

---

### 📋 Action Plan Generator
Detailed execution plans with timelines, success metrics, and draft content generation.

![Action Plan](docs/screenshots/customer-actions.png)

**Features:**
- Dynamic timeline based on action type
- Success metrics with targets
- Resource allocation planning
- Draft email/call content generator (sliding panel)
- Copy-to-clipboard functionality

---

### 🤖 Multi-Agent System
Visual representation of the autonomous agent pipeline with real-time status updates.

![Agents](docs/screenshots/agents.png)

**Agent Types:**
- **Monitoring Agent**: Analyzes customer behavior
- **Prediction Agent**: Forecasts trends
- **Decision Agent**: Evaluates actions
- **Action Agent**: Executes campaigns
- **Reporting Agent**: Generates insights
- **Feedback Agent**: Learns from outcomes

---

### 💬 Agent Communication Flow
Inter-agent messaging system showing how agents collaborate to make decisions.

![Agent Communication](docs/screenshots/agent-communication.png)

**Communication Pattern:**
1. Monitoring → Prediction (analysis data)
2. Prediction → Decision (forecast results)
3. Decision → Action (action commands)
4. Action → Reporting (execution results)
5. Reporting → Feedback (outcome analysis)

---

### 📈 Predictions Dashboard
Historical prediction data with filtering, sorting, and risk distribution analysis.

![Predictions](docs/screenshots/predictions.png)

**Capabilities:**
- Prediction history table
- Risk level distribution chart
- Filter by date range, risk level, customer
- Export to CSV
- Batch prediction status

---

### 🎓 ML Model Training
Interface for training and evaluating machine learning models with real-time progress tracking.

![ML Training](docs/screenshots/ml-training.png)

**Training Features:**
- Model selection (Churn, CLV, Anomaly, Revenue)
- Training progress indicators
- Model performance metrics
- Dataset statistics
- Model versioning

---

### 🔧 Incident Management
Auto-generated incident reports with detailed runbooks for on-call teams.

![Incidents](docs/screenshots/incidents.png)

**Incident Features:**
- AI-generated incident descriptions
- Actionable runbooks with time constraints
- Priority levels (P1, P2, P3)
- Assigned owners
- Resolution tracking

---

## 🧪 Testing

### Run ML Service Tests
```bash
cd ml-service
python test_service.py
```

### Test Predictions
```bash
curl -X POST http://localhost:8000/predict/churn \
  -H "Content-Type: application/json" \
  -d '{"customer_id": "test-123", "features": {...}}'
```

### Test Cron Jobs
```bash
curl -X POST http://localhost:3000/api/cron/predictions \
  -H "Authorization: Bearer your-cron-secret" \
  -H "Content-Type: application/json"
```

---

## 📊 ML Model Training

### Jupyter Notebooks

Located in `ml-service/`:
- `churn_prediction.ipynb` - Churn model development
- `clv_prediction.ipynb` - CLV model development
- `anomaly_detection.ipynb` - Anomaly detection
- `revenue_forecasting.ipynb` - Revenue forecasting

### Training with Kaggle Data

```bash
cd ml-service
python train_with_kaggle_data.py
```

### Model Files

Trained models are saved in `ml-service/models/saved/`:
- `churn_model.pkl`
- `churn_scaler.pkl`
- `clv_model.pkl`
- `clv_scaler.pkl`
- `anomaly_model.pkl`
- `revenue_model.pkl`

---

## 🔧 Configuration

### Threshold Configuration

Adjust voice call thresholds in `.env.local`:

```bash
# Trigger if 5+ customers at high risk
VOICE_CALL_THRESHOLD_COUNT="5"

# Trigger if average churn rate >65%
VOICE_CALL_THRESHOLD_CHURN="0.65"

# Trigger if >20% of customers at high risk
VOICE_CALL_THRESHOLD_PERCENTAGE="0.20"
```

### Scheduler Configuration

Edit `local-scheduler.js` to adjust intervals:

```javascript
schedules: {
  predictions: 6 * 60 * 60 * 1000,  // 6 hours
  anomalies: 60 * 60 * 1000,        // 1 hour
  weeklyReport: 24 * 60 * 60 * 1000 // 24 hours
}
```

---

## 🚢 Deployment

### Vercel Deployment

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

Cron jobs will run automatically via `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/predictions",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

### ML Service Deployment

Deploy Python service to:
- **Railway**: `railway up`
- **Render**: Connect GitHub repo
- **AWS Lambda**: Use Serverless framework
- **Docker**: `docker build -t ml-service .`

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Next.js** - React framework
- **Supabase** - Backend infrastructure
- **Scikit-learn** - ML models
- **LangChain** - AI orchestration
- **Google Gemini** - LLM capabilities
- **Twilio** - Voice communications
- **shadcn/ui** - UI components

---

## 📧 Contact

For questions or support, please open an issue or contact:
- **Email**: your-email@example.com
- **GitHub**: [@yourusername](https://github.com/yourusername)

---

<div align="center">

**Built with ❤️ for autonomous customer retention**

[⬆ Back to Top](#-sim-ops--smart-intelligence-management-for-operations-planning--supervision)

</div>

## 🔒 Security

### Environment Variables

**CRITICAL**: Never commit `.env.local` or any file containing secrets to git!

All sensitive configuration should be stored in environment variables:

```bash
# Copy the template
cp .env.local.template .env.local

# Edit with your actual credentials
# NEVER commit .env.local to git!
```

### Required Secrets

- **Supabase**: Database credentials and API keys
- **Google AI**: API key for LangChain agents
- **Resend**: API key for email notifications
- **Twilio**: Account SID and Auth Token for voice calls
- **CRON_SECRET**: Authentication for cron endpoints
- **Slack**: Webhook URL for notifications

### Secret Rotation

If secrets are exposed:

1. **Immediately** rotate all compromised credentials
2. Follow the guide: [`scripts/rotate-secrets.md`](scripts/rotate-secrets.md)
3. Update production environment variables
4. Clean git history if needed

### Security Best Practices

- ✅ Use `.env.local` for local development
- ✅ Use Vercel environment variables for production
- ✅ Rotate secrets quarterly
- ✅ Enable Supabase Row Level Security (RLS)
- ✅ Use HTTPS in production
- ✅ Validate all user input
- ✅ Monitor API usage and rate limits
- ❌ Never hardcode secrets in code
- ❌ Never commit `.env.local` to git
- ❌ Never expose service role keys

### Reporting Security Issues

Found a security vulnerability? Email: **arshvirsk26@gmail.com**

**DO NOT** create a public GitHub issue for security vulnerabilities.

See [`SECURITY.md`](SECURITY.md) for complete security documentation.

---

