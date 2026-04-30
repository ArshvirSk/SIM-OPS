// Centralized agent data and types for the AI Operations Manager

export type AgentStatus = "active" | "idle" | "processing" | "error";

export type DecisionSeverity = "low" | "medium" | "high" | "critical";

export interface AgentDecision {
    id: string;
    timestamp: string;
    input: string;
    reasoning: string;
    output: string;
    severity: DecisionSeverity;
    confidence: number;
    workflowTriggered?: string;
}

export interface AgentMetrics {
    totalDecisions: number;
    avgConfidence: number;
    successRate: number;
    avgResponseTime: number;
}

export interface AgentConfig {
    enabled: boolean;
    thresholds: Record<string, number>;
    triggers: string[];
    outputTargets: string[];
}

export interface Agent {
    id: string;
    name: string;
    role: string;
    description: string;
    status: AgentStatus;
    lastAction?: string;
    actionsToday: number;
    decisions: AgentDecision[];
    metrics: AgentMetrics;
    config: AgentConfig;
}

export const agentsData: Agent[] = [
    {
        id: "monitoring",
        name: "Monitoring Agent",
        role: "KPI deviation detection & threshold monitoring",
        description: "Continuously monitors business KPIs against defined thresholds. Detects anomalies and deviations in real-time, triggering alerts when metrics exceed acceptable bounds.",
        status: "active",
        lastAction: "2 min ago",
        actionsToday: 47,
        decisions: [
            {
                id: "d1",
                timestamp: "2026-01-28 09:15:23",
                input: "Churn rate: 4.1% (threshold: 3%)",
                reasoning: "Current churn rate exceeds threshold by 37%. Historical trend shows acceleration over past 7 days. Pattern matches Q3 2025 churn spike.",
                output: "ALERT: High churn deviation detected. Escalating to Decision Agent.",
                severity: "high",
                confidence: 0.94,
                workflowTriggered: "Churn Risk Automation"
            },
            {
                id: "d2",
                timestamp: "2026-01-28 09:10:45",
                input: "Monthly revenue: $298K (forecast: $305K)",
                reasoning: "Revenue 2.3% below forecast. Within acceptable variance range of 5%. No immediate action required.",
                output: "INFO: Minor revenue deviation logged. Continue monitoring.",
                severity: "low",
                confidence: 0.87
            },
            {
                id: "d3",
                timestamp: "2026-01-28 08:55:12",
                input: "Active users: 12,847 (baseline: 11,500)",
                reasoning: "User engagement up 11.7% vs baseline. Positive trend consistent with recent feature release.",
                output: "INFO: Positive deviation. No action required.",
                severity: "low",
                confidence: 0.91
            }
        ],
        metrics: {
            totalDecisions: 1247,
            avgConfidence: 0.89,
            successRate: 0.96,
            avgResponseTime: 0.3
        },
        config: {
            enabled: true,
            thresholds: {
                churnRate: 3,
                revenueDeviation: 5,
                userGrowth: -2
            },
            triggers: ["scheduled", "event-based"],
            outputTargets: ["Decision Agent", "Reporting Agent"]
        }
    },
    {
        id: "prediction",
        name: "Prediction Agent",
        role: "ML inference & risk scoring",
        description: "Executes machine learning models to generate predictions and risk scores. Handles churn prediction, revenue forecasting, and cost anomaly detection.",
        status: "processing",
        lastAction: "Running inference",
        actionsToday: 12,
        decisions: [
            {
                id: "p1",
                timestamp: "2026-01-28 09:14:00",
                input: "Customer segment: Enterprise (47 accounts)",
                reasoning: "Running churn classification model. Features: contract_age, support_tickets, usage_decline, payment_delays. Model: XGBoost v2.3.",
                output: "Prediction: 84% churn probability for 47 accounts. Confidence: 92%.",
                severity: "high",
                confidence: 0.92,
                workflowTriggered: "Churn Risk Automation"
            },
            {
                id: "p2",
                timestamp: "2026-01-28 09:00:00",
                input: "Q1 2026 sales pipeline data",
                reasoning: "Time-series forecasting using ARIMA + Prophet ensemble. Historical data: 24 months. Seasonal adjustment applied.",
                output: "Forecast: $1.15M Q1 revenue (8% below target $1.25M).",
                severity: "medium",
                confidence: 0.78
            },
            {
                id: "p3",
                timestamp: "2026-01-28 08:30:00",
                input: "Infrastructure cost data: Jan 2026",
                reasoning: "Anomaly detection using Isolation Forest. Flagged: compute_resources (+23% MoM). Pattern: unusual spike not correlated with traffic.",
                output: "ANOMALY: Compute costs 23% above normal. Investigation recommended.",
                severity: "medium",
                confidence: 0.72
            }
        ],
        metrics: {
            totalDecisions: 456,
            avgConfidence: 0.84,
            successRate: 0.91,
            avgResponseTime: 2.1
        },
        config: {
            enabled: true,
            thresholds: {
                minConfidence: 0.7,
                anomalyScore: 0.8
            },
            triggers: ["monitoring-agent", "scheduled"],
            outputTargets: ["Decision Agent"]
        }
    },
    {
        id: "decision",
        name: "Decision Agent",
        role: "Severity classification & rule engine",
        description: "Interprets predictions and monitoring alerts to classify severity levels. Applies business rules to determine appropriate actions and workflow triggers.",
        status: "active",
        lastAction: "5 min ago",
        actionsToday: 23,
        decisions: [
            {
                id: "dec1",
                timestamp: "2026-01-28 09:15:30",
                input: "Churn risk: 84% for 47 Enterprise accounts",
                reasoning: "Rule evaluation: IF churn_probability > 0.7 AND segment = 'Enterprise' AND account_count > 10 THEN severity = 'CRITICAL'. Additional factor: Q1 renewal window active.",
                output: "DECISION: Severity=CRITICAL. Trigger retention campaign. Escalate to Account Management.",
                severity: "critical",
                confidence: 0.96,
                workflowTriggered: "Churn Risk Automation"
            },
            {
                id: "dec2",
                timestamp: "2026-01-28 09:05:00",
                input: "Revenue forecast: 8% below target",
                reasoning: "Rule evaluation: IF revenue_deviation > 5% AND deviation < 15% THEN severity = 'MEDIUM'. Sales pipeline velocity declining but within recovery range.",
                output: "DECISION: Severity=MEDIUM. Generate weekly report. Notify Sales Leadership.",
                severity: "medium",
                confidence: 0.88,
                workflowTriggered: "Revenue Forecasting Pipeline"
            }
        ],
        metrics: {
            totalDecisions: 892,
            avgConfidence: 0.91,
            successRate: 0.94,
            avgResponseTime: 0.5
        },
        config: {
            enabled: true,
            thresholds: {
                criticalThreshold: 0.8,
                highThreshold: 0.6,
                mediumThreshold: 0.4
            },
            triggers: ["prediction-agent", "monitoring-agent"],
            outputTargets: ["Action Agent", "Reporting Agent"]
        }
    },
    {
        id: "action",
        name: "Action Agent",
        role: "Workflow execution & automation triggers",
        description: "Executes automated actions based on Decision Agent outputs. Triggers workflows, sends notifications, and initiates corrective measures.",
        status: "idle",
        lastAction: "15 min ago",
        actionsToday: 8,
        decisions: [
            {
                id: "act1",
                timestamp: "2026-01-28 09:00:00",
                input: "Execute: Retention Campaign for 47 accounts",
                reasoning: "Action selected: email_campaign + account_manager_alert + crm_flag. Execution order: parallel. Retry policy: 3 attempts.",
                output: "EXECUTED: Retention emails sent (47). Account managers notified (5). CRM flags set.",
                severity: "high",
                confidence: 1.0,
                workflowTriggered: "Churn Risk Automation"
            },
            {
                id: "act2",
                timestamp: "2026-01-28 08:00:00",
                input: "Generate weekly ops report",
                reasoning: "Action: generate_report. Template: weekly_operations. Recipients: ops-team@company.com. Format: PDF + email.",
                output: "EXECUTED: Weekly report generated and distributed to 12 recipients.",
                severity: "low",
                confidence: 1.0
            }
        ],
        metrics: {
            totalDecisions: 324,
            avgConfidence: 0.98,
            successRate: 0.99,
            avgResponseTime: 1.2
        },
        config: {
            enabled: true,
            thresholds: {
                maxRetries: 3,
                timeoutSeconds: 30
            },
            triggers: ["decision-agent"],
            outputTargets: ["Reporting Agent", "Feedback Agent"]
        }
    },
    {
        id: "reporting",
        name: "Reporting Agent",
        role: "Summary generation & audit logging",
        description: "Generates reports, summaries, and maintains comprehensive audit logs of all system activities. Provides explainability for all agent decisions.",
        status: "active",
        lastAction: "1 min ago",
        actionsToday: 156,
        decisions: [
            {
                id: "rep1",
                timestamp: "2026-01-28 09:15:35",
                input: "Log: Churn Risk Automation workflow completed",
                reasoning: "Audit entry: workflow_id=wf-1, execution_time=4.2s, steps_completed=6/6, outcome=success. Generating summary for stakeholders.",
                output: "LOGGED: Full audit trail stored. Summary email queued for 5 stakeholders.",
                severity: "low",
                confidence: 1.0
            },
            {
                id: "rep2",
                timestamp: "2026-01-28 09:10:00",
                input: "Generate: Decision explanation for churn alert",
                reasoning: "Creating human-readable explanation. Include: data inputs, model used, confidence score, rule applied, action taken.",
                output: "GENERATED: Explainability report for CHURN-2026-0128-001.",
                severity: "low",
                confidence: 1.0
            }
        ],
        metrics: {
            totalDecisions: 4521,
            avgConfidence: 0.99,
            successRate: 1.0,
            avgResponseTime: 0.2
        },
        config: {
            enabled: true,
            thresholds: {
                retentionDays: 90,
                summaryFrequency: 1
            },
            triggers: ["all-agents"],
            outputTargets: ["Dashboard", "Email", "Storage"]
        }
    },
    {
        id: "feedback",
        name: "Feedback Agent",
        role: "Outcome tracking & retraining triggers",
        description: "Tracks the outcomes of actions taken, measures effectiveness, and triggers model retraining when performance degrades.",
        status: "idle",
        lastAction: "1 hour ago",
        actionsToday: 3,
        decisions: [
            {
                id: "fb1",
                timestamp: "2026-01-28 08:00:00",
                input: "Evaluate: Retention campaign from Jan 21",
                reasoning: "Outcome tracking: 47 targeted accounts. Results after 7 days: 38 retained (81%), 5 churned (11%), 4 pending. Benchmark: 70% retention. Campaign successful.",
                output: "FEEDBACK: Campaign success rate 81% (above 70% target). Model confidence validated.",
                severity: "low",
                confidence: 0.95
            },
            {
                id: "fb2",
                timestamp: "2026-01-27 16:00:00",
                input: "Model drift check: Churn prediction model",
                reasoning: "Performance metrics: Accuracy 94.2% (baseline 92%). Precision 0.89, Recall 0.91. No drift detected. Next scheduled check: 7 days.",
                output: "FEEDBACK: Model performance stable. No retraining required.",
                severity: "low",
                confidence: 0.98
            },
            {
                id: "fb3",
                timestamp: "2026-01-25 12:00:00",
                input: "Model drift check: Cost anomaly model",
                reasoning: "Performance degradation detected: False positive rate increased from 5% to 12%. Drift threshold exceeded. Retraining recommended.",
                output: "ALERT: Model drift detected. Triggered retraining workflow.",
                severity: "medium",
                confidence: 0.85,
                workflowTriggered: "Model Retraining Pipeline"
            }
        ],
        metrics: {
            totalDecisions: 89,
            avgConfidence: 0.92,
            successRate: 0.97,
            avgResponseTime: 5.0
        },
        config: {
            enabled: true,
            thresholds: {
                driftThreshold: 0.1,
                minSuccessRate: 0.7,
                evaluationWindowDays: 7
            },
            triggers: ["scheduled", "manual"],
            outputTargets: ["Prediction Agent", "Reporting Agent"]
        }
    }
];
