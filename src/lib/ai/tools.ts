/**
 * LangChain Tools for AI Agents
 * Function calling definitions for AI agents
 */

import { actionExecutor } from "@/lib/actions/executor";
import { mlClient } from "@/lib/ml/client";
import { createClient } from "@/lib/supabase/client";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

/**
 * Tool: Fetch customer data from database
 */
export const fetchCustomerDataTool = new DynamicStructuredTool({
    name: "fetch_customer_data",
    description: "Retrieve customer behavioral data and metrics from the database. Use this to get current state of a customer including activity, engagement, and financial metrics.",
    schema: z.object({
        customer_id: z.string().describe("UUID of the customer to fetch"),
        include_history: z.boolean().optional().describe("Whether to include historical activity data"),
    }),
    func: async ({ customer_id, include_history }) => {
        const supabase = createClient();

        const { data: customer, error } = await supabase
            .from("customers")
            .select("*")
            .eq("id", customer_id)
            .single();

        if (error || !customer) {
            return JSON.stringify({ error: "Customer not found" });
        }

        // Optionally fetch recent predictions
        if (include_history) {
            const { data: predictions } = await supabase
                .from("ml_predictions")
                .select("*")
                .eq("customer_id", customer_id)
                .order("created_at", { ascending: false })
                .limit(5);

            return JSON.stringify({ customer, recent_predictions: predictions });
        }

        return JSON.stringify({ customer });
    },
});

/**
 * Tool: Run ML prediction model
 */
export const runMLPredictionTool = new DynamicStructuredTool({
    name: "run_ml_prediction",
    description: "Execute machine learning model to predict churn probability, customer lifetime value, or detect anomalies. Returns numerical predictions and risk classifications.",
    schema: z.object({
        model_type: z.enum(["churn", "clv", "anomaly"]).describe("Type of ML model to execute"),
        customer_id: z.string().describe("Customer UUID for prediction"),
        features: z.record(z.string(), z.number()).describe("Feature vector for the model"),
    }),
    func: async ({ model_type, customer_id, features }) => {
        try {
            let result;

            switch (model_type) {
                case "churn":
                    result = await mlClient.predictChurn({
                        customer_id,
                        features: features as any,
                    });
                    break;

                case "clv":
                    result = await mlClient.predictCLV({
                        customer_id,
                        features: features as any,
                    });
                    break;

                case "anomaly":
                    const values = Object.values(features) as number[];
                    result = await mlClient.detectAnomalies({
                        metric_name: "customer_behavior",
                        values: values,
                        timestamps: values.map((_, i) => new Date(Date.now() - i * 3600000).toISOString()),
                    });
                    break;
            }

            return JSON.stringify(result);
        } catch (error) {
            return JSON.stringify({ error: "ML prediction failed", message: String(error) });
        }
    },
});

/**
 * Tool: Calculate behavioral score
 */
export const calculateBehavioralScoreTool = new DynamicStructuredTool({
    name: "calculate_behavioral_score",
    description: "Calculate a composite engagement score (0-1) based on customer activity metrics. Higher scores indicate better engagement.",
    schema: z.object({
        feature_usage_rate: z.number().min(0).max(1),
        engagement_score: z.number().min(0).max(1),
        payment_failures: z.number().min(0),
        support_tickets: z.number().min(0),
    }),
    func: async ({ feature_usage_rate, engagement_score, payment_failures, support_tickets }) => {
        // Weighted behavioral score
        const usageWeight = 0.35;
        const engagementWeight = 0.35;
        const paymentPenalty = 0.15;
        const supportPenalty = 0.15;

        const paymentScore = Math.max(0, 1 - (payment_failures * 0.2));
        const supportScore = Math.max(0, 1 - (support_tickets * 0.1));

        const behavioralScore =
            feature_usage_rate * usageWeight +
            engagement_score * engagementWeight +
            paymentScore * paymentPenalty +
            supportScore * supportPenalty;

        return JSON.stringify({
            behavioral_score: behavioralScore,
            breakdown: {
                usage: feature_usage_rate,
                engagement: engagement_score,
                payment_health: paymentScore,
                support_health: supportScore,
            },
        });
    },
});

/**
 * Tool: Send alert to team
 */
export const sendAlertTool = new DynamicStructuredTool({
    name: "send_alert",
    description: "Send alert notification to the team via Slack, Jira, or Email based on severity level. Use this when action is required on a customer risk.",
    schema: z.object({
        severity: z.enum(["critical", "high", "medium", "low"]).describe("Alert severity level"),
        customer_id: z.string().describe("Customer UUID"),
        customer_name: z.string().describe("Customer name for personalization"),
        churn_probability: z.number().min(0).max(1).describe("Predicted churn risk (0-1)"),
        message: z.string().describe("Custom alert message to include"),
    }),
    func: async ({ severity, customer_id, customer_name, churn_probability, message }) => {
        try {
            await actionExecutor.execute({
                type: "churn_alert",
                severity,
                data: {
                    customer_id,
                    customer_name,
                    churn_probability,
                    custom_message: message,
                },
            });

            return JSON.stringify({
                success: true,
                message: `Alert sent via ${severity === "critical" ? "Slack + Jira + Email" : severity === "high" ? "Slack + Jira" : "Slack"}`,
            });
        } catch (error) {
            return JSON.stringify({
                success: false,
                error: String(error),
            });
        }
    },
});

/**
 * Tool: Query recent agent decisions
 */
export const queryAgentDecisionsTool = new DynamicStructuredTool({
    name: "query_agent_decisions",
    description: "Query recent decisions made by other agents. Use this to understand what actions have already been taken for a customer.",
    schema: z.object({
        customer_id: z.string().optional().describe("Filter by customer UUID"),
        limit: z.number().optional().default(5).describe("Number of recent decisions to fetch"),
    }),
    func: async ({ customer_id, limit = 5 }) => {
        const supabase = createClient();

        let query = supabase
            .from("agent_decisions")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(limit);

        if (customer_id) {
            query = query.eq("context->customer_id", customer_id);
        }

        const { data: decisions } = await query;

        return JSON.stringify(decisions || []);
    },
});

/**
 * All available tools for agents
 */
export const allTools = [
    fetchCustomerDataTool,
    runMLPredictionTool,
    calculateBehavioralScoreTool,
    sendAlertTool,
    queryAgentDecisionsTool,
];
