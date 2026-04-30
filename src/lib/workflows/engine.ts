/**
 * Workflow Execution Engine
 * Executes pre-defined workflows with event-based and time-based triggers
 */

import { actionExecutor } from "@/lib/actions/executor";
import { agentOrchestrator } from "@/lib/agents/orchestrator";
import { createClient } from "@/lib/supabase/client";

export interface WorkflowNode {
    id: string;
    type: "trigger" | "data" | "ml" | "decision" | "action" | "condition";
    config: any;
}

export interface WorkflowConnection {
    from: string;
    to: string;
    condition?: string;
}

export interface Workflow {
    id: string;
    name: string;
    nodes: WorkflowNode[];
    connections: WorkflowConnection[];
    trigger_config?: any;
}

export class WorkflowEngine {
    private supabase = createClient();

    /**
     * Execute a workflow by ID
     */
    async executeWorkflow(workflowId: string): Promise<boolean> {
        const startTime = Date.now();
        console.log(`🔄 Executing workflow: ${workflowId}`);

        try {
            // Fetch workflow definition
            const { data: workflow, error } = await this.supabase
                .from("workflows")
                .select("*")
                .eq("id", workflowId)
                .single();

            if (error || !workflow) {
                console.error("Workflow not found:", workflowId);
                return false;
            }

            // Create workflow run record
            const { data: workflowRun } = await this.supabase
                .from("workflow_runs")
                .insert({
                    workflow_id: workflowId,
                    status: "running",
                    started_at: new Date().toISOString(),
                })
                .select()
                .single();

            // Execute nodes in order
            const context = {};
            let success = true;

            for (const node of workflow.nodes) {
                try {
                    await this.executeNode(node, context);
                } catch (error) {
                    console.error(`Node execution failed: ${node.id}`, error);
                    success = false;
                    break;
                }
            }

            // Update workflow run
            const executionTime = Date.now() - startTime;
            await this.supabase
                .from("workflow_runs")
                .update({
                    status: success ? "completed" : "error",
                    completed_at: new Date().toISOString(),
                    execution_time_ms: executionTime,
                })
                .eq("id", workflowRun?.id);

            // Update workflow stats
            await this.supabase.rpc("increment_workflow_stats", {
                p_workflow_id: workflowId,
                p_success: success,
            });

            console.log(
                `✅ Workflow ${success ? "completed" : "failed"} in ${executionTime}ms`
            );
            return success;
        } catch (error) {
            console.error("Workflow execution error:", error);
            return false;
        }
    }

    /**
     * Execute a single workflow node
     */
    private async executeNode(node: WorkflowNode, context: any): Promise<void> {
        console.log(`  Executing node: ${node.id} (${node.type})`);

        switch (node.type) {
            case "trigger":
                // Trigger nodes just initiate the workflow
                break;

            case "data":
                // Fetch data from database or API
                await this.executeDataNode(node, context);
                break;

            case "ml":
                // Run ML predictions
                await this.executeMLNode(node, context);
                break;

            case "decision":
                // Apply business logic
                await this.executeDecisionNode(node, context);
                break;

            case "action":
                // Execute actions (send alerts, create tickets, etc.)
                await this.executeActionNode(node, context);
                break;

            case "condition":
                // Conditional branching
                await this.executeConditionNode(node, context);
                break;

            default:
                console.warn(`Unknown node type: ${node.type}`);
        }
    }

    private async executeDataNode(node: WorkflowNode, context: any) {
        const { table, filter } = node.config;

        let query = this.supabase.from(table).select("*");

        if (filter) {
            Object.entries(filter).forEach(([key, value]) => {
                query = query.eq(key, value);
            });
        }

        const { data } = await query.limit(100);
        context[node.id] = data;
    }

    private async executeMLNode(node: WorkflowNode, context: any) {
        const { prediction_type, customer_ids } = node.config;

        // Execute multi-agent chain for each customer
        if (prediction_type === "churn" && customer_ids) {
            for (const customerId of customer_ids.slice(0, 10)) {
                await agentOrchestrator.executeAgentChain(customerId);
            }
        }
    }

    private async executeDecisionNode(node: WorkflowNode, context: any) {
        const { rules } = node.config;

        // Apply business rules
        const decisions = [];
        for (const rule of rules || []) {
            const result = this.evaluateRule(rule, context);
            if (result) {
                decisions.push(result);
            }
        }

        context[node.id] = decisions;
    }

    private async executeActionNode(node: WorkflowNode, context: any) {
        const { action_type, params } = node.config;

        switch (action_type) {
            case "send_alert":
                await actionExecutor.execute({
                    type: params.alert_type || "churn_alert",
                    severity: params.severity || "medium",
                    data: params.data || context,
                });
                break;

            case "create_report":
                // Generate report
                console.log("Generating report...");
                break;

            default:
                console.warn(`Unknown action type: ${action_type}`);
        }
    }

    private async executeConditionNode(node: WorkflowNode, context: any) {
        const { condition } = node.config;
        const result = this.evaluateCondition(condition, context);
        context[node.id] = result;
    }

    private evaluateRule(rule: any, context: any): any {
        // Simple rule evaluation (extend as needed)
        const { field, operator, value } = rule;
        const actualValue = this.getContextValue(field, context);

        switch (operator) {
            case ">":
                return actualValue > value ? rule : null;
            case "<":
                return actualValue < value ? rule : null;
            case "==":
                return actualValue === value ? rule : null;
            default:
                return null;
        }
    }

    private evaluateCondition(condition: string, context: any): boolean {
        // Simple condition evaluation
        try {
            // In production, use a safe expression evaluator
            return eval(condition);
        } catch {
            return false;
        }
    }

    private getContextValue(path: string, context: any): any {
        return path.split(".").reduce((obj, key) => obj?.[key], context);
    }

    /**
     * Register event-based workflow triggers
     */
    async registerEventTriggers() {
        console.log("🎯 Registering workflow event triggers...");

        // Listen for high churn predictions
        this.supabase
            .channel("workflow_triggers")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "ml_predictions",
                    filter: "prediction_type=eq.churn",
                },
                async (payload) => {
                    const prediction = payload.new as any;

                    // Trigger high churn response workflow
                    if (prediction.prediction_data?.churn_probability > 0.8) {
                        console.log(
                            `🚨 High churn detected, triggering workflow for customer ${prediction.customer_id}`
                        );
                        await agentOrchestrator.executeAgentChain(
                            prediction.customer_id
                        );
                    }
                }
            )
            .subscribe();

        // Listen for anomalies
        this.supabase
            .channel("anomaly_triggers")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "ml_predictions",
                    filter: "prediction_type=eq.anomaly",
                },
                async (payload) => {
                    const anomaly = payload.new as any;

                    if (anomaly.prediction_data?.severity === "high") {
                        console.log("🔍 High-severity anomaly detected, triggering alert");
                        await actionExecutor.execute({
                            type: "anomaly_alert",
                            severity: "high",
                            data: anomaly.prediction_data,
                        });
                    }
                }
            )
            .subscribe();

        console.log("✅ Event triggers registered");
    }
}

// Singleton instance
export const workflowEngine = new WorkflowEngine();

// Initialize event triggers on module load
if (typeof window === "undefined") {
    // Server-side only
    workflowEngine.registerEventTriggers();
}
