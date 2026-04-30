/**
 * Workflow Execution Engine
 * Executes workflow nodes in sequence with data passing
 */

import { createClient } from "@/lib/supabase/client";
import { DatabaseError, getErrorMessage, WorkflowError } from "@/types/errors";
import type {
  NodeExecutionContext,
  NodeExecutionResult,
  NodeOutput,
  WorkflowConnection,
  WorkflowExecutionResult,
  WorkflowNode,
} from "@/types/workflow";
import { IntegrationConfigManager } from "../integrations/config";
import { MockAPI } from "../integrations/mock-api";
import { SendGridIntegration } from "../integrations/sendgrid";
import { SlackIntegration } from "../integrations/slack";
import { StripeIntegration } from "../integrations/stripe";
import { mlClient } from "../ml/client";
import { MLDataPipeline } from "../ml/pipeline";

export class WorkflowExecutor {
  /**
   * Execute a complete workflow
   */
  static async execute(
    workflowId: string,
    nodes: WorkflowNode[],
    connections: WorkflowConnection[],
  ): Promise<WorkflowExecutionResult> {
    const startTime = Date.now();
    const startedAt = new Date().toISOString();
    const supabase = createClient();

    // Create workflow run record
    const { data: runData, error: runError } = await supabase
      .from("workflow_runs")
      .insert({
        workflow_id: workflowId,
        status: "running",
        total_steps: nodes.length,
        steps_completed: 0,
      })
      .select()
      .single();

    if (runError) {
      throw new DatabaseError(
        `Failed to create workflow run: ${runError.message}`,
      );
    }

    const runId = runData.id;
    const nodeResults: NodeExecutionResult[] = [];
    const context: NodeExecutionContext = {}; // Shared context between nodes

    // Fetch workflow metadata (name, node count) for richer notifications
    const { data: workflowMeta } = await supabase
      .from("workflows")
      .select("name, run_count")
      .eq("id", workflowId)
      .single();
    context["__workflowMeta"] = {
      id: workflowId,
      name: workflowMeta?.name || "Workflow",
      runCount: (workflowMeta?.run_count || 0) + 1,
      totalNodes: nodes.length,
      startedAt,
    };

    try {
      // Sort nodes by execution order (based on connections)
      const executionOrder = this.getExecutionOrder(nodes, connections);

      // Execute nodes in order
      for (const node of executionOrder) {
        const nodeStartTime = Date.now();

        try {
          const result = await this.executeNode(node, context);
          const duration = Date.now() - nodeStartTime;

          nodeResults.push({
            nodeId: node.id,
            nodeType: node.type,
            success: true,
            output: result,
            executedAt: new Date().toISOString(),
            duration,
          });

          // Update context with node output
          context[node.id] = result;

          // Update progress
          await supabase
            .from("workflow_runs")
            .update({
              steps_completed: nodeResults.length,
            })
            .eq("id", runId);
        } catch (error: any) {
          const duration = Date.now() - nodeStartTime;

          nodeResults.push({
            nodeId: node.id,
            nodeType: node.type,
            success: false,
            output: null,
            error: error.message,
            executedAt: new Date().toISOString(),
            duration,
          });

          // Continue execution even if a node fails
          console.error(`Node ${node.id} failed:`, error);
        }
      }

      const completedAt = new Date().toISOString();
      const duration = Date.now() - startTime;
      const successfulNodes = nodeResults.filter((r) => r.success).length;
      const failedNodes = nodeResults.filter((r) => !r.success).length;
      const status =
        failedNodes === 0
          ? "success"
          : successfulNodes > 0
            ? "partial"
            : "failed";

      // Update workflow run
      await supabase
        .from("workflow_runs")
        .update({
          status: status === "success" ? "completed" : "failed",
          completed_at: completedAt,
          error_message: failedNodes > 0 ? `${failedNodes} nodes failed` : null,
        })
        .eq("id", runId);

      // Fetch current workflow stats to safely increment run_count
      const { data: workflowData } = await supabase
        .from("workflows")
        .select("run_count")
        .eq("id", workflowId)
        .single();

      const newRunCount = (workflowData?.run_count || 0) + 1;

      // Update workflow stats
      await supabase
        .from("workflows")
        .update({
          last_run: completedAt,
          run_count: newRunCount,
        })
        .eq("id", workflowId);

      return {
        workflowId,
        runId,
        status,
        startedAt,
        completedAt,
        duration,
        nodeResults,
        totalNodes: nodes.length,
        successfulNodes,
        failedNodes,
      };
    } catch (error: unknown) {
      console.error("Workflow Execution Failed at top level:", error);
      // Update run as failed
      await supabase
        .from("workflow_runs")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
          error_message: getErrorMessage(error),
        })
        .eq("id", runId);

      throw error;
    }
  }

  /**
   * Execute a single node
   */
  private static async executeNode(
    node: WorkflowNode,
    context: NodeExecutionContext,
  ): Promise<NodeOutput> {
    switch (node.type) {
      case "trigger":
        return this.executeTriggerNode(node, context);
      case "data":
        return this.executeDataNode(node, context);
      case "ml":
        return this.executeMLNode(node, context);
      case "decision":
        return this.executeDecisionNode(node, context);
      case "condition":
        return this.executeConditionNode(node, context);
      case "action":
        return this.executeActionNode(node, context);
      case "alert":
        return this.executeAlertNode(node, context);
      case "notify":
        return this.executeNotifyNode(node, context);
      case "report":
        return this.executeReportNode(node, context);
      default:
        throw new WorkflowError(`Unknown node type: ${node.type}`);
    }
  }

  /**
   * Trigger Node - Starts the workflow
   */
  private static async executeTriggerNode(
    node: WorkflowNode,
    context: NodeExecutionContext,
  ): Promise<NodeOutput> {
    return {
      type: "trigger",
      triggered: true,
      timestamp: new Date().toISOString(),
      triggerType: String((node.config as any)?.triggerType || "manual"),
    };
  }

  /**
   * Data Node - Fetch data from sources
   */
  private static async executeDataNode(
    node: WorkflowNode,
    context: NodeExecutionContext,
  ): Promise<NodeOutput> {
    const source = String((node.config as any)?.source || "mock");

    // Check for configured integrations
    const stripeConfig = IntegrationConfigManager.getStripeConfig();

    if (source === "stripe" && stripeConfig) {
      const stripe = new StripeIntegration(stripeConfig.apiKey);
      const metrics = await stripe.getMetrics(30);

      return {
        type: "data",
        revenue: metrics.revenue,
        customers: metrics.activeSubscriptions,
        churnRate: metrics.churnRate,
        activeUsers: metrics.activeSubscriptions,
        timestamp: new Date().toISOString(),
        source: "stripe",
      };
    }

    // Default to mock data
    const metrics = await MockAPI.getMetrics();
    return {
      type: "data",
      revenue: metrics.revenue,
      customers: metrics.customers,
      churnRate: metrics.churnRate,
      activeUsers: metrics.activeUsers,
      timestamp: metrics.timestamp,
      source: "mock",
    };
  }

  /**
   * ML Node - Run predictions with real ML models
   */
  private static async executeMLNode(
    node: WorkflowNode,
    context: NodeExecutionContext,
  ): Promise<NodeOutput> {
    const modelType = String((node.config as any)?.modelType || "churn");
    const inputSource = String((node.config as any)?.inputSource || "previous");

    try {
      // Get input data from context or database
      let inputData: Record<string, unknown>;
      if (inputSource === "previous") {
        const contextKeys = Object.keys(context);
        const lastKey = contextKeys[contextKeys.length - 1];
        inputData = lastKey
          ? (context[lastKey] as unknown as Record<string, unknown>)
          : {};
      } else if (inputSource === "database") {
        inputData = await this.fetchMLInputData(
          (node.config as any)?.dataQuery as string | undefined,
        );
      } else {
        inputData = (node.config as any)?.inputData || {};
      }

      // Execute prediction based on model type
      switch (modelType as string) {
        case "churn":
          return await this.executeChurnPrediction(inputData);
        case "anomaly":
          return await this.executeAnomalyDetection(inputData);
        case "revenue":
          return await this.executeRevenueForecast(inputData);
        case "clv":
          return await this.executeCLVPrediction(inputData);
        default:
          throw new Error(`Unknown model type: ${modelType}`);
      }
    } catch (error: any) {
      console.error(`ML node execution failed:`, error);
      // Return error info instead of throwing to allow workflow to continue
      return {
        type: "ml",
        predictions: [],
        error: true,
        message: String(error.message),
        modelType: modelType as any,
        fallback: true,
      } as unknown as NodeOutput;
    }
  }

  /**
   * Execute churn prediction
   */
  private static async executeChurnPrediction(inputData: any): Promise<any> {
    const supabase = createClient();

    // If inputData has customer info, use it directly
    if (inputData.customer_id || inputData.customerId) {
      const customerId = inputData.customer_id || inputData.customerId;

      // Fetch customer from database
      const { data: customer } = await supabase
        .from("customers")
        .select("*")
        .eq("id", customerId)
        .single();

      if (!customer) {
        throw new Error(`Customer not found: ${customerId}`);
      }

      // Extract features and predict
      const features = MLDataPipeline.extractChurnFeatures(customer);
      const validation = MLDataPipeline.validateChurnFeatures(features);

      if (!validation.valid) {
        throw new Error(`Invalid features: ${validation.errors.join(", ")}`);
      }

      const prediction = await mlClient.predictChurn({
        customer_id: customerId,
        features,
      });

      // Store prediction
      await supabase.from("predictions").insert({
        customer_id: customerId,
        prediction_type: "churn",
        prediction_value: prediction.churn_probability,
        confidence: prediction.confidence,
        risk_level: prediction.risk_level,
        metadata: {
          contributing_factors: prediction.contributing_factors,
          recommended_actions: prediction.recommended_actions,
        },
      });

      return prediction;
    }

    // If inputData has multiple customers
    if (inputData.customers && Array.isArray(inputData.customers)) {
      const predictions = await Promise.all(
        inputData.customers.slice(0, 10).map(async (customer: any) => {
          try {
            const features = MLDataPipeline.extractChurnFeatures(customer);
            return await mlClient.predictChurn({
              customer_id: customer.id,
              features,
            });
          } catch (error) {
            console.error(
              `Prediction failed for customer ${customer.id}:`,
              error,
            );
            return null;
          }
        }),
      );

      return {
        predictions: predictions.filter((p) => p !== null),
        total: inputData.customers.length,
        processed: predictions.filter((p) => p !== null).length,
      };
    }

    // Fallback: fetch recent customers
    const { data: customers } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (!customers || customers.length === 0) {
      throw new Error("No customers found for prediction");
    }

    const predictions = await Promise.all(
      customers.map(async (customer) => {
        try {
          const features = MLDataPipeline.extractChurnFeatures(customer);
          return await mlClient.predictChurn({
            customer_id: customer.id,
            features,
          });
        } catch (error) {
          return null;
        }
      }),
    );

    return {
      predictions: predictions.filter((p) => p !== null),
      total: customers.length,
    };
  }

  /**
   * Execute anomaly detection
   */
  private static async executeAnomalyDetection(inputData: any): Promise<any> {
    // If inputData has metric data
    if (inputData.values && inputData.timestamps) {
      const result = await mlClient.detectAnomalies({
        metric_name: inputData.metric_name || "metric",
        values: inputData.values,
        timestamps: inputData.timestamps,
      });

      return result;
    }

    // If inputData has metrics array
    if (inputData.metrics && Array.isArray(inputData.metrics)) {
      const data = MLDataPipeline.prepareAnomalyData(
        inputData.metric_name || "metric",
        inputData.metrics,
      );

      const result = await mlClient.detectAnomalies(data);
      return result;
    }

    // Fallback: use deterministic static data
    const mockMetrics = Array.from({ length: 30 }, (_, i) => {
      const seed = i + 1;
      return {
        value: 100 + ((seed * 13) % 20),
        timestamp: new Date(
          Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
        ).toISOString(),
      };
    });

    const data = MLDataPipeline.prepareAnomalyData("revenue", mockMetrics);
    return await mlClient.detectAnomalies(data);
  }

  /**
   * Execute revenue forecast
   */
  private static async executeRevenueForecast(inputData: any): Promise<any> {
    const supabase = createClient();

    // If inputData has historical data
    if (inputData.historical_data && Array.isArray(inputData.historical_data)) {
      const forecastPeriods = inputData.forecast_periods || 30;

      const result = await mlClient.forecastRevenue({
        historical_data: inputData.historical_data,
        forecast_periods: forecastPeriods,
      });

      return result;
    }

    // Fetch historical revenue from database
    const { data: transactions } = await supabase
      .from("transactions")
      .select("amount, created_at")
      .order("created_at", { ascending: true })
      .limit(90);

    if (!transactions || transactions.length === 0) {
      // Use deterministic static data as fallback
      const mockData = Array.from({ length: 30 }, (_, i) => {
        const seed = i + 1;
        const dateStr = new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];
        return {
          date: dateStr || "",
          revenue: 30000 + ((seed * 77) % 10000),
        };
      });

      return await mlClient.forecastRevenue({
        historical_data: mockData,
        forecast_periods: 30,
      });
    }

    // Aggregate by date
    const dailyRevenue = transactions.reduce((acc: any, t: any) => {
      const splitArr = new Date(t.created_at).toISOString().split("T");
      const date = splitArr.length > 0 ? splitArr[0] : "";
      if (date) {
        if (!acc[date]) acc[date] = 0;
        acc[date] += t.amount;
      }
      return acc;
    }, {});

    const historicalData = Object.entries(dailyRevenue).map(
      ([date, revenue]) => ({
        date: String(date || ""),
        revenue: revenue as number,
      }),
    );

    return await mlClient.forecastRevenue({
      historical_data: historicalData,
      forecast_periods: inputData.forecast_periods || 30,
    });
  }

  /**
   * Execute CLV prediction
   */
  private static async executeCLVPrediction(inputData: any): Promise<any> {
    const supabase = createClient();

    // If inputData has customer info
    if (inputData.customer_id || inputData.customerId) {
      const customerId = inputData.customer_id || inputData.customerId;

      // Fetch customer from database
      const { data: customer } = await supabase
        .from("customers")
        .select("*")
        .eq("id", customerId)
        .single();

      if (!customer) {
        throw new Error(`Customer not found: ${customerId}`);
      }

      // Extract features and predict
      const features = MLDataPipeline.extractCLVFeatures(customer);
      const validation = MLDataPipeline.validateCLVFeatures(features);

      if (!validation.valid) {
        throw new Error(`Invalid features: ${validation.errors.join(", ")}`);
      }

      const prediction = await mlClient.predictCLV({
        customer_id: customerId,
        features,
      });

      // Store prediction
      await supabase.from("predictions").insert({
        customer_id: customerId,
        prediction_type: "clv",
        prediction_value: prediction.predicted_clv,
        confidence: prediction.confidence,
        risk_level: prediction.clv_segment,
        metadata: {
          factors: prediction.factors,
        },
      });

      return prediction;
    }

    // Fallback: fetch recent customers
    const { data: customers } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (!customers || customers.length === 0) {
      throw new Error("No customers found for CLV prediction");
    }

    const predictions = await Promise.all(
      customers.map(async (customer) => {
        try {
          const features = MLDataPipeline.extractCLVFeatures(customer);
          return await mlClient.predictCLV({
            customer_id: customer.id,
            features,
          });
        } catch (error) {
          return null;
        }
      }),
    );

    return {
      predictions: predictions.filter((p) => p !== null),
      total: customers.length,
    };
  }

  /**
   * Fetch ML input data from database
   */
  private static async fetchMLInputData(query?: string): Promise<any> {
    const supabase = createClient();

    // Default: fetch recent customers
    const { data: customers } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    return { customers: customers || [] };
  }

  /**
   * Decision Node - Apply business rules
   */
  private static async executeDecisionNode(
    node: WorkflowNode,
    context: Record<string, any>,
  ): Promise<any> {
    const keys = Object.keys(context);
    const lastKey = keys[keys.length - 1];
    const previousOutput: any = lastKey ? context[lastKey] : undefined;

    // Simple decision logic based on previous node output
    let severity: "low" | "medium" | "high" | "critical" = "low";
    let action = "monitor";

    if (
      previousOutput?.churnRate > 5 ||
      previousOutput?.churn_probability > 0.8
    ) {
      severity = "critical";
      action = "immediate_action";
    } else if (
      previousOutput?.churnRate > 3 ||
      previousOutput?.churn_probability > 0.6
    ) {
      severity = "high";
      action = "retention_campaign";
    } else if (previousOutput?.anomaly_detected) {
      severity = "medium";
      action = "investigate";
    }

    return {
      severity,
      action,
      reasoning: `Evaluated based on input data. Severity: ${severity}`,
      confidence: 0.9,
    };
  }

  /**
   * Condition Node - Branch logic
   */
  private static async executeConditionNode(
    node: WorkflowNode,
    context: Record<string, any>,
  ): Promise<any> {
    const keys = Object.keys(context);
    const lastKey = keys[keys.length - 1];
    const previousOutput: any = lastKey ? context[lastKey] : undefined;
    const condition = (node.config as any)?.condition || "true";

    // Simple condition evaluation
    const result =
      previousOutput?.severity === "critical" ||
      previousOutput?.severity === "high";

    return {
      conditionMet: result,
      branch: result ? "true" : "false",
    };
  }

  /**
   * Action Node - Execute actions
   */
  private static async executeActionNode(
    node: WorkflowNode,
    context: Record<string, any>,
  ): Promise<any> {
    const actionType = (node.config as any)?.actionType || "retention_campaign";
    const keys = Object.keys(context);
    const lastKey = keys[keys.length - 1];
    const previousOutput: any = lastKey ? context[lastKey] : undefined;

    const result = await MockAPI.executeAction(
      actionType as string,
      previousOutput,
    );

    return result;
  }

  /**
   * Alert Node - Send alerts
   */
  private static async executeAlertNode(
    node: WorkflowNode,
    context: Record<string, any>,
  ): Promise<any> {
    const keys = Object.keys(context);
    const lastKey = keys[keys.length - 1];
    const previousOutput: any = lastKey ? context[lastKey] : undefined;
    const supabase = createClient();

    // Create risk alert
    await supabase.from("risk_alerts").insert({
      title: `Workflow Alert: ${previousOutput?.action || "Action Required"}`,
      description: previousOutput?.reasoning || "Workflow generated alert",
      severity: previousOutput?.severity || "medium",
      source: "Workflow",
      status: "active",
    });

    return {
      alertCreated: true,
      severity: previousOutput?.severity,
    };
  }

  /**
   * Notify Node - Send notifications
   */
  private static async executeNotifyNode(
    node: WorkflowNode,
    context: Record<string, any>,
  ): Promise<any> {
    const keys = Object.keys(context).filter((k) => k !== "__workflowMeta");
    const lastKey = keys[keys.length - 1];
    const previousOutput: any = lastKey ? context[lastKey] : undefined;
    const meta = context["__workflowMeta"] || {};

    // UI saves it as 'channel', fallback to 'notifyType' for backwards compatibility
    const notifyType =
      (node.config as any)?.channel ||
      (node.config as any)?.notifyType ||
      "slack";

    const workflowName: string = meta.name || "Workflow";
    const severity: "low" | "medium" | "high" | "critical" =
      previousOutput?.severity || "low";
    const title = `${workflowName} — Execution Update`;
    const details =
      previousOutput?.reasoning ||
      previousOutput?.summary ||
      `Workflow "${workflowName}" completed successfully.`;

    // Build a rich data object for the Slack message fields
    const notifyData: Record<string, unknown> = {
      workflow: workflowName,
      status: previousOutput?.action || previousOutput?.status || "completed",
      severity,
      confidence: previousOutput?.confidence ?? undefined,
      reasoning: previousOutput?.reasoning || details,
      nodes_executed: meta.totalNodes ?? undefined,
      run: meta.runCount ? `#${meta.runCount}` : undefined,
      started_at: meta.startedAt
        ? new Date(meta.startedAt).toLocaleString()
        : undefined,
    };
    // Remove undefined keys to keep the message clean
    Object.keys(notifyData).forEach(
      (k) => notifyData[k] === undefined && delete notifyData[k],
    );

    const slackConfig = IntegrationConfigManager.getSlackConfig();
    const sendgridConfig = IntegrationConfigManager.getSendGridConfig();

    if (notifyType === "slack") {
      // First try: server-side API route that uses SLACK_WEBHOOK_URL env var
      try {
        const response = await fetch("/api/integrations/slack", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            severity,
            title,
            details,
            data: notifyData,
          }),
        });

        if (response.ok) {
          return {
            notificationSent: true,
            type: notifyType,
            via: "server",
          };
        }

        // Non-501 errors mean the env var is set but something else went wrong
        const resJson = await response.json().catch(() => ({}));
        if (response.status !== 501) {
          console.warn("Slack API route error:", resJson);
        }
      } catch (fetchError) {
        console.warn("Failed to reach Slack API route:", fetchError);
      }

      // Second try: localStorage-configured webhook/token
      if (slackConfig) {
        const slack = new SlackIntegration(slackConfig);
        await slack.sendAlert(severity, title, details, notifyData);
        return {
          notificationSent: true,
          type: notifyType,
          via: "localStorage",
        };
      }

      // Fallback: mock notification
      await MockAPI.sendNotification(
        notifyType as any,
        "team@company.com",
        `[${workflowName}] ${details}`,
      );
    } else if (notifyType === "email" && sendgridConfig) {
      const sendgrid = new SendGridIntegration(sendgridConfig.apiKey);
      await sendgrid.sendAlertEmail(
        [sendgridConfig.fromEmail],
        title,
        details,
        severity,
      );
    } else {
      // Mock notification
      await MockAPI.sendNotification(
        notifyType as any,
        "team@company.com",
        `[${workflowName}] ${details}`,
      );
    }

    return {
      notificationSent: true,
      type: notifyType,
    };
  }

  /**
   * Report Node - Generate reports
   */
  private static async executeReportNode(
    node: WorkflowNode,
    context: Record<string, any>,
  ): Promise<any> {
    const supabase = createClient();

    // Log to activity
    await supabase.from("activity_logs").insert({
      type: "success",
      source: "workflow",
      message: "Workflow completed successfully",
      metadata: {
        nodeCount: Object.keys(context).length,
        results: context,
      },
    });

    return {
      reportGenerated: true,
      summary: `Workflow completed with ${Object.keys(context).length} nodes`,
      context,
    };
  }

  /**
   * Get execution order based on connections
   */
  private static getExecutionOrder(
    nodes: WorkflowNode[],
    connections: WorkflowConnection[],
  ): WorkflowNode[] {
    // Simple topological sort
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const inDegree = new Map(nodes.map((n) => [n.id, 0]));
    const adjList = new Map<string, string[]>();

    // Build adjacency list and calculate in-degrees
    for (const conn of connections) {
      if (!adjList.has(conn.from)) {
        adjList.set(conn.from, []);
      }
      adjList.get(conn.from)!.push(conn.to);
      inDegree.set(conn.to, (inDegree.get(conn.to) || 0) + 1);
    }

    // Find nodes with no incoming edges (start nodes)
    const queue: string[] = [];
    for (const [nodeId, degree] of inDegree.entries()) {
      if (degree === 0) {
        queue.push(nodeId);
      }
    }

    // If no start nodes, use first node
    if (queue.length === 0 && nodes.length > 0) {
      const firstId = nodes[0]?.id;
      if (firstId) queue.push(firstId);
    }

    const result: WorkflowNode[] = [];
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      const node = nodeMap.get(nodeId);
      if (node) {
        result.push(node);
      }

      const neighbors = adjList.get(nodeId) || [];
      for (const neighbor of neighbors) {
        const newDegree = (inDegree.get(neighbor) || 0) - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) {
          queue.push(neighbor);
        }
      }
    }

    // Add any remaining nodes that weren't connected
    for (const node of nodes) {
      if (!result.find((n) => n.id === node.id)) {
        result.push(node);
      }
    }

    return result;
  }
}
