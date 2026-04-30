# 📊 Dataset Description - Complete Data Dictionary

## Overview

This document describes all datasets, tables, fields, data types, time ranges, and relationships in the SIM-OPS system.

---

## 🗄️ **Database Tables**

### **1. `customers` Table**

**Purpose:** Stores customer information and status

**Time Range:** Historical data from 6 months ago to present

**Record Count:** ~100-300 customers (varies based on generation)

| Field Name | Data Type | Format | Example | Description | Nullable |
|------------|-----------|--------|---------|-------------|----------|
| `id` | UUID | String | `a1b2c3d4-...` | Unique customer identifier | No |
| `email` | VARCHAR | String | `john@example.com` | Customer email address | No |
| `name` | VARCHAR | String | `John Doe` | Customer full name | Yes |
| `status` | ENUM | String | `active`, `at_risk`, `churned`, `inactive` | Current customer status | No |
| `created_at` | TIMESTAMP | ISO 8601 | `2024-06-15T10:30:00Z` | Account creation date | No |
| `last_activity` | TIMESTAMP | ISO 8601 | `2024-12-20T15:45:00Z` | Last login/activity | Yes |
| `total_spend` | DECIMAL | Number | `1250.50` | Lifetime revenue (USD) | Yes |
| `engagement_score` | INTEGER | Number | `75` | Engagement score (0-100) | Yes |
| `support_tickets` | INTEGER | Number | `3` | Total support tickets opened | Yes |
| `failed_payments` | INTEGER | Number | `1` | Count of failed payment attempts | Yes |
| `subscription_tier` | VARCHAR | String | `pro`, `basic`, `enterprise` | Current subscription level | Yes |
| `churned_at` | TIMESTAMP | ISO 8601 | `2024-11-30T12:00:00Z` | Date customer churned | Yes |

**Status Values:**
- `active` - Currently paying customer
- `at_risk` - Flagged by ML model or agents (churn probability >80%)
- `churned` - Cancelled subscription
- `inactive` - Account exists but not active

**Time Distribution:**
```
Created At Range: [NOW - 6 months] to [NOW]
Last Activity: [NOW - 30 days] to [NOW]
Churned At: [NOW - 3 months] to [NOW] (only for churned customers)
```

---

### **2. `transactions` Table**

**Purpose:** Stores all payment transactions

**Time Range:** Last 30 days (rolling window)

**Record Count:** ~200-1000 transactions

| Field Name | Data Type | Format | Example | Description | Nullable |
|------------|-----------|--------|---------|-------------|----------|
| `id` | UUID | String | `tx_a1b2c3...` | Unique transaction ID | No |
| `customer_id` | UUID | String | `a1b2c3d4-...` | Foreign key to customers | No |
| `amount` | DECIMAL | Number | `99.99` | Transaction amount (USD) | No |
| `status` | ENUM | String | `completed`, `failed`, `pending` | Transaction status | No |
| `created_at` | TIMESTAMP | ISO 8601 | `2024-12-15T14:30:00Z` | Transaction timestamp | No |
| `payment_method` | VARCHAR | String | `credit_card`, `paypal` | Payment method used | Yes |
| `description` | TEXT | String | `Monthly subscription` | Transaction description | Yes |
| `metadata` | JSONB | JSON | `{"invoice_id": "INV-123"}` | Additional metadata | Yes |

**Status Values:**
- `completed` - Successfully processed (counts toward MRR)
- `failed` - Payment failed (affects health score)
- `pending` - Processing (not counted yet)

**Amount Distribution:**
```
Range: $10 - $500
Average: ~$75
Median: ~$50
```

**Time Distribution:**
```
Created At Range: [NOW - 30 days] to [NOW]
Frequency: ~7-10 transactions per day during simulation
```

---

### **3. `agents` Table**

**Purpose:** Stores agent configuration and status

**Time Range:** Static configuration (updated in real-time)

**Record Count:** 6-10 agents (6 new + 4 legacy)

| Field Name | Data Type | Format | Example | Description | Nullable |
|------------|-----------|--------|---------|-------------|----------|
| `id` | VARCHAR | String | `monitoring`, `prediction` | Unique agent identifier | No |
| `name` | VARCHAR | String | `Monitoring Agent` | Human-readable name | No |
| `role` | VARCHAR | String | `KPI deviation detection` | Agent's role description | No |
| `status` | ENUM | String | `active`, `idle`, `processing`, `error` | Current agent status | No |
| `last_action` | TEXT | String | `Churn rate exceeds...` | Last decision made | Yes |
| `actions_today` | INTEGER | Number | `15` | Count of actions today | No |
| `created_at` | TIMESTAMP | ISO 8601 | `2024-01-01T00:00:00Z` | Agent creation date | No |
| `updated_at` | TIMESTAMP | ISO 8601 | `2024-12-20T16:00:00Z` | Last update timestamp | No |
| `config` | JSONB | JSON | `{"thresholds": {...}}` | Agent configuration | Yes |

**Status Values:**
- `active` - Running and ready
- `idle` - Paused or waiting
- `processing` - Currently executing
- `error` - Encountered an error

**Agent IDs:**
```
Text-based (new):
- monitoring
- prediction
- decision
- action
- reporting
- feedback

UUID-based (legacy):
- a1111111-1111-4111-8111-111111111111 (Data Monitor)
- a2222222-2222-4222-8222-222222222222 (ML Predictor)
- a3333333-3333-4333-8333-333333333333 (Decision Engine)
- a4444444-4444-4444-8444-444444444444 (Action Executor)
```

---

### **4. `agent_decisions` Table**

**Purpose:** Logs all agent decisions and actions

**Time Range:** Last 30 days (rolling window)

**Record Count:** ~50-500 decisions

| Field Name | Data Type | Format | Example | Description | Nullable |
|------------|-----------|--------|---------|-------------|----------|
| `id` | UUID | String | `dec_a1b2c3...` | Unique decision ID | No |
| `agent_id` | VARCHAR | String | `monitoring` | Foreign key to agents | No |
| `input` | TEXT | String | `Triggered by: schedule` | Input that triggered decision | Yes |
| `reasoning` | TEXT | String | `Current churn rate is...` | Agent's reasoning | No |
| `output` | TEXT | String | `ALERT: High churn...` | Decision output | No |
| `severity` | ENUM | String | `low`, `medium`, `high`, `critical` | Decision severity | No |
| `confidence` | DECIMAL | Number | `0.92` | Confidence score (0-1) | No |
| `workflow_triggered` | VARCHAR | String | `retention_campaign` | Workflow name if triggered | Yes |
| `created_at` | TIMESTAMP | ISO 8601 | `2024-12-20T15:30:00Z` | Decision timestamp | No |
| `metadata` | JSONB | JSON | `{"churn_rate": 4.0}` | Additional data | Yes |

**Severity Distribution:**
```
low: ~60% (routine monitoring)
medium: ~25% (requires attention)
high: ~12% (urgent action needed)
critical: ~3% (immediate response required)
```

**Confidence Distribution:**
```
Range: 0.0 - 1.0
Average: ~0.85
High confidence: >0.9
Low confidence: <0.7
```

**Time Distribution:**
```
Created At Range: [NOW - 30 days] to [NOW]
Frequency: ~5-20 decisions per day
Peak times: During pipeline runs
```

---

### **5. `ml_predictions` Table**

**Purpose:** Stores ML model predictions for customers

**Time Range:** Last 7 days (rolling window)

**Record Count:** ~100-500 predictions

| Field Name | Data Type | Format | Example | Description | Nullable |
|------------|-----------|--------|---------|-------------|----------|
| `id` | UUID | String | `pred_a1b2c3...` | Unique prediction ID | No |
| `customer_id` | UUID | String | `a1b2c3d4-...` | Foreign key to customers | No |
| `prediction_type` | VARCHAR | String | `churn`, `clv`, `anomaly` | Type of prediction | No |
| `prediction_data` | JSONB | JSON | `{"churn_probability": 0.85}` | Prediction results | No |
| `confidence` | DECIMAL | Number | `0.87` | Model confidence (0-1) | No |
| `created_at` | TIMESTAMP | ISO 8601 | `2024-12-20T10:00:00Z` | Prediction timestamp | No |
| `expires_at` | TIMESTAMP | ISO 8601 | `2024-12-21T10:00:00Z` | Prediction expiry (24h) | Yes |
| `metadata` | JSONB | JSON | `{"model_version": "v1.0"}` | Model metadata | Yes |

**Prediction Types:**
- `churn` - Churn probability prediction
- `clv` - Customer Lifetime Value prediction
- `anomaly` - Anomaly detection score
- `revenue` - Revenue forecast

**Prediction Data Structure (Churn):**
```json
{
  "churn_probability": 0.85,
  "risk_level": "high",
  "contributing_factors": [
    "low_engagement",
    "failed_payment",
    "decreased_usage"
  ],
  "recommended_actions": [
    "retention_campaign",
    "account_manager_outreach"
  ]
}
```

**Confidence Distribution:**
```
Range: 0.6 - 0.95
Average: ~0.87 (based on model accuracy)
High confidence: >0.9
Low confidence: <0.75
```

---

### **6. `predictions` Table (Aggregate)

**Purpose:** Stores aggregated predictions for dashboard charts

**Time Range:** Last 6 months (historical)

**Record Count:** ~180 records (1 per day for 6 months)

| Field Name | Data Type | Format | Example | Description | Nullable |
|------------|-----------|--------|---------|-------------|----------|
| `id` | UUID | String | `agg_a1b2c3...` | Unique record ID | No |
| `type` | VARCHAR | String | `churn`, `revenue` | Prediction type | No |
| `prediction` | JSONB | JSON | `{"value": 0.04}` | Aggregated prediction | No |
| `input_data` | JSONB | JSON | `{}` | Input data used | Yes |
| `confidence` | DECIMAL | Number | `0.85` | Aggregate confidence | No |
| `created_at` | TIMESTAMP | ISO 8601 | `2024-12-20T00:00:00Z` | Record timestamp | No |

**Prediction Structure (Churn):**
```json
{
  "value": 0.04,
  "churn_probability": 0.04,
  "high_risk_customers": 15,
  "total_customers": 230
}
```

**Prediction Structure (Revenue):**
```json
{
  "value": 305000,
  "forecast": [
    {"date": "2024-12-27", "amount": 308000},
    {"date": "2025-01-03", "amount": 312000},
    {"date": "2025-01-10", "amount": 315000},
    {"date": "2025-01-17", "amount": 318000}
  ]
}
```

---

### **7. `activity_logs` Table**

**Purpose:** System-wide activity and audit logs

**Time Range:** Last 30 days (rolling window)

**Record Count:** ~100-1000 logs

| Field Name | Data Type | Format | Example | Description | Nullable |
|------------|-----------|--------|---------|-------------|----------|
| `id` | UUID | String | `log_a1b2c3...` | Unique log ID | No |
| `type` | ENUM | String | `info`, `warning`, `error`, `success` | Log type | No |
| `source` | VARCHAR | String | `agent`, `system`, `user` | Log source | No |
| `message` | TEXT | String | `Retention workflow triggered` | Log message | No |
| `metadata` | JSONB | JSON | `{"customer_count": 15}` | Additional context | Yes |
| `created_at` | TIMESTAMP | ISO 8601 | `2024-12-20T15:45:00Z` | Log timestamp | No |

**Type Distribution:**
```
info: ~70% (routine operations)
success: ~20% (successful actions)
warning: ~8% (potential issues)
error: ~2% (failures)
```

---

### **8. `workflows` Table**

**Purpose:** Workflow definitions and execution status

**Time Range:** Static definitions, execution history last 30 days

**Record Count:** ~5-10 workflows

| Field Name | Data Type | Format | Example | Description | Nullable |
|------------|-----------|--------|---------|-------------|----------|
| `id` | UUID | String | `wf_a1b2c3...` | Unique workflow ID | No |
| `name` | VARCHAR | String | `Retention Campaign` | Workflow name | No |
| `trigger` | VARCHAR | String | `churn_rate > 3%` | Trigger condition | No |
| `status` | ENUM | String | `active`, `completed`, `failed` | Current status | No |
| `last_run` | TIMESTAMP | ISO 8601 | `2024-12-20T14:00:00Z` | Last execution time | Yes |
| `success_count` | INTEGER | Number | `45` | Successful executions | No |
| `failure_count` | INTEGER | Number | `2` | Failed executions | No |
| `created_at` | TIMESTAMP | ISO 8601 | `2024-01-01T00:00:00Z` | Workflow creation | No |

---

## 📅 **Time Ranges Summary**

| Table | Time Range | Retention | Update Frequency |
|-------|------------|-----------|------------------|
| `customers` | 6 months historical | Permanent | Real-time |
| `transactions` | 30 days rolling | 30 days | Every 3s (simulation) |
| `agents` | Current state | Permanent | Real-time |
| `agent_decisions` | 30 days rolling | 30 days | Per agent run |
| `ml_predictions` | 7 days rolling | 7 days | Per prediction run |
| `predictions` | 6 months historical | 6 months | Daily |
| `activity_logs` | 30 days rolling | 30 days | Real-time |
| `workflows` | Current + 30 days | Permanent | Per execution |

---

## 🔢 **Data Type Reference**

### **Timestamp Format:**
```
Format: ISO 8601
Example: 2024-12-20T15:30:45.123Z
Timezone: UTC
Precision: Milliseconds
```

### **UUID Format:**
```
Format: UUID v4
Example: a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
Length: 36 characters (with hyphens)
```

### **Decimal Format:**
```
Precision: 2 decimal places for currency
Precision: 4 decimal places for probabilities
Range: 0.0000 - 9999.9999
```

### **ENUM Values:**

**Customer Status:**
```
- active
- at_risk
- churned
- inactive
```

**Transaction Status:**
```
- completed
- failed
- pending
```

**Agent Status:**
```
- active
- idle
- processing
- error
```

**Severity Levels:**
```
- low
- medium
- high
- critical
```

**Log Types:**
```
- info
- success
- warning
- error
```

---

## 📊 **Data Volume & Statistics**

### **Current Dataset Size:**

```
Customers: ~230 active + 49 at-risk + 6 churned = ~285 total
Transactions: ~211 (last 30 days)
  - Completed: ~191 (90.5%)
  - Failed: ~20 (9.5%)
Agent Decisions: ~50-100 (last 30 days)
ML Predictions: ~100-200 (last 7 days)
Activity Logs: ~200-500 (last 30 days)
```

### **Growth Rates:**

```
Customers: +2-5 per day (during simulation)
Transactions: +7-10 per day (during simulation)
Agent Decisions: +5-20 per day (depending on pipeline runs)
ML Predictions: +20-50 per day (during active prediction)
```

### **Data Generation:**

**"Generate History" creates:**
```
Customers: 100-200 records
Transactions: 500-1000 records (6 months)
Predictions: 50-100 records
Time span: 6 months of historical data
```

**"Live Traffic" simulation generates:**
```
Every 3 seconds:
- 70% chance: 1 transaction ($50-$200)
- 20% chance: 1 new customer
- 10% chance: nothing
```

---

## 🔗 **Relationships**

### **Entity Relationship Diagram:**

```
customers (1) ──< (many) transactions
    │
    └──< (many) ml_predictions
    │
    └──< (many) agent_decisions (via metadata)

agents (1) ──< (many) agent_decisions
    │
    └──< (many) activity_logs

workflows (1) ──< (many) activity_logs
```

### **Foreign Keys:**

```sql
transactions.customer_id → customers.id
ml_predictions.customer_id → customers.id
agent_decisions.agent_id → agents.id
```

---

## 📈 **Sample Data Queries**

### **Get Customer with All Related Data:**
```sql
SELECT 
  c.*,
  COUNT(DISTINCT t.id) as transaction_count,
  SUM(t.amount) FILTER (WHERE t.status = 'completed') as total_revenue,
  COUNT(DISTINCT p.id) as prediction_count,
  MAX(p.prediction_data->>'churn_probability')::float as latest_churn_prob
FROM customers c
LEFT JOIN transactions t ON t.customer_id = c.id
LEFT JOIN ml_predictions p ON p.customer_id = c.id
WHERE c.id = 'customer-uuid-here'
GROUP BY c.id;
```

### **Get Time-Series Data (Last 30 Days):**
```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as transaction_count,
  SUM(amount) FILTER (WHERE status = 'completed') as daily_revenue,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_count
FROM transactions
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date;
```

### **Get Agent Performance:**
```sql
SELECT 
  a.name,
  a.status,
  COUNT(ad.id) as total_decisions,
  AVG(ad.confidence) as avg_confidence,
  COUNT(*) FILTER (WHERE ad.severity = 'critical') as critical_decisions
FROM agents a
LEFT JOIN agent_decisions ad ON ad.agent_id = a.id
WHERE ad.created_at >= NOW() - INTERVAL '7 days'
GROUP BY a.id, a.name, a.status;
```

---

## 🎯 **Data Quality Rules**

### **Validation Rules:**

**Customers:**
- Email must be unique
- Status must be valid enum
- Engagement score: 0-100
- Created_at must be <= NOW

**Transactions:**
- Amount must be > 0
- Customer_id must exist in customers table
- Created_at must be <= NOW

**ML Predictions:**
- Confidence must be 0-1
- Expires_at must be > created_at
- Customer_id must exist

**Agent Decisions:**
- Confidence must be 0-1
- Severity must be valid enum
- Agent_id must exist

---

## 📝 **Notes**

1. **Time Zones:** All timestamps are stored in UTC
2. **Currency:** All amounts are in USD
3. **Retention:** Old data is automatically cleaned up based on retention policies
4. **Indexes:** Primary keys and foreign keys are indexed for performance
5. **Real-time:** Supabase subscriptions enable real-time updates
6. **Simulation:** "Live Traffic" generates synthetic but realistic data patterns

---

**This dataset powers all metrics, predictions, and visualizations in the SIM-OPS system!** 🚀
