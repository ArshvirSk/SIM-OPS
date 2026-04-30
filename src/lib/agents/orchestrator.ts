/**
 * Multi-Agent Orchestration System
 * Coordinates multiple AI agents to analyze data, make decisions, and execute actions
 */

import { ActionContext, actionExecutor } from "@/lib/actions/executor";
import { mlClient } from "@/lib/ml/client";
import { MLDataPipeline } from "@/lib/ml/pipeline";
import { createClient } from "@/lib/supabase/client";

export interface AgentMessage {
  from: string;
  to: string;
  type: string;
  payload: any;
  timestamp: string;
}

export class MultiAgentOrchestrator {
  private supabase = createClient();
  private messageBus: AgentMessage[] = [];

  // Agent ID mapping - use the actual IDs from database
  private readonly AGENT_IDS = {
    ANALYST: "monitoring",      // Was: a1111111-1111-4111-8111-111111111111
    FORECAST: "prediction",     // Was: a2222222-2222-4222-8222-222222222222
    DECISION: "decision",       // Was: a3333333-3333-4333-8333-333333333333
    ACTION: "action",           // Was: a4444444-4444-4444-8444-444444444444
    REPORTING: "reporting",     // Was: a5555555-5555-4555-8555-555555555555
    FEEDBACK: "feedback",       // Was: a6666666-6666-4666-8666-666666666666
  };

  /**
   * Updates an agent's status, last action, and action count
   */
  private async updateAgentState(
    agentId: string,
    status: string,
    lastAction: string,
  ) {
    try {
      // First get current actions_today
      const { data } = await this.supabase
        .from("agents")
        .select("actions_today")
        .eq("id", agentId)
        .single();

      const newCount = (data?.actions_today || 0) + 1;

      await this.supabase
        .from("agents")
        .update({
          status,
          last_action: lastAction,
          updated_at: new Date().toISOString(),
          actions_today: newCount,
        })
        .eq("id", agentId);
    } catch (error) {
      console.error(`Failed to update agent ${agentId} state:`, error);
    }
  }

  /**
   * Execute full agent chain for a customer
   */
  async executeAgentChain(customerId: string): Promise<boolean> {
    try {
      console.log(`🤖 Starting agent chain for customer ${customerId}`);

      // Step 1: Analyst Agent - Collect and analyze data
      const analysisResult = await this.runAnalystAgent(customerId);
      if (!analysisResult) return false;

      // Step 2: Forecast Agent - Predict future state
      const forecastResult = await this.runForecastAgent(
        customerId,
        analysisResult,
      );

      // Step 3: Decision Engine - Determine actions
      const decision = await this.runDecisionEngine(
        customerId,
        analysisResult,
        forecastResult,
      );

      // Step 4: Action Executor - Execute decided actions
      if (decision.shouldAct) {
        await this.runActionAgent(decision, analysisResult);
      }

      return true;
    } catch (error) {
      console.error("Agent chain execution failed:", error);
      return false;
    }
  }

  /**
   * Analyst Agent: Detects patterns and anomalies
   */
  private async runAnalystAgent(customerId: string) {
    console.log("📊 Analyst Agent: Analyzing customer data...");

    // Fetch customer data
    const { data: customer } = await this.supabase
      .from("customers")
      .select("*")
      .eq("id", customerId)
      .single();

    if (!customer) {
      console.error("Customer not found");
      return null;
    }

    // Extract features
    const churnFeatures = MLDataPipeline.extractChurnFeatures(customer);
    const clvFeatures = MLDataPipeline.extractCLVFeatures(customer);

    // Run ML predictions
    const churnPrediction = await mlClient.predictChurn({
      customer_id: customerId,
      features: churnFeatures,
    });

    const clvPrediction = await mlClient.predictCLV({
      customer_id: customerId,
      features: clvFeatures,
    });

    // Detect behavioral anomalies
    const behavioralScore = this.calculateBehavioralScore(customer);

    const analysis = {
      customer_id: customerId,
      churn_risk: churnPrediction.churn_probability,
      risk_level: churnPrediction.risk_level,
      clv: clvPrediction.predicted_clv,
      clv_segment: clvPrediction.clv_segment,
      behavioral_score: behavioralScore,
      anomalies: this.detectBehavioralAnomalies(customer),
      contributing_factors: churnPrediction.contributing_factors,
      timestamp: new Date().toISOString(),
    };

    // Log agent decision
    await this.supabase.from("agent_decisions").insert({
      agent_id: this.AGENT_IDS.ANALYST,
      input: `Analyze customer ${customerId}`,
      output: `Analysis complete: risk=${analysis.risk_level}, churn=${(analysis.churn_risk * 100).toFixed(0)}%`,
      reasoning: JSON.stringify({
        steps: ["Fetched customer data", "Extracted ML features", "Ran churn prediction", "Ran CLV prediction", "Detected behavioral patterns"],
        data_points: Object.keys(churnFeatures).length,
      }),
      confidence: churnPrediction.confidence,
      severity: analysis.risk_level === "critical" ? "high" : "medium",
    });

    // Send message to Forecast Agent
    await this.sendAgentMessage({
      from: this.AGENT_IDS.ANALYST,
      to: this.AGENT_IDS.FORECAST,
      type: "analysis_complete",
      payload: analysis,
      timestamp: new Date().toISOString(),
    });

    await this.updateAgentState(
      this.AGENT_IDS.ANALYST,
      "active",
      `Analyzed customer ${customerId}`,
    );

    return analysis;
  }

  /**
   * Forecast Agent: Predicts short-term trends
   */
  private async runForecastAgent(customerId: string, analysis: any) {
    console.log("🔮 Forecast Agent: Predicting trends...");

    // Fetch historical predictions
    const { data: history } = await this.supabase
      .from("ml_predictions")
      .select("*")
      .eq("customer_id", customerId)
      .eq("prediction_type", "churn")
      .order("created_at", { ascending: false })
      .limit(10);

    // Calculate trend
    const trend = this.calculateTrend(history || []);

    // Forecast next 30 days
    const forecast = {
      customer_id: customerId,
      trend_direction: trend.direction, // "improving", "stable", "worsening"
      predicted_churn_in_30d: this.projectChurnRisk(analysis.churn_risk, trend),
      predicted_clv_change: this.projectCLVChange(analysis.clv, trend),
      confidence: trend.confidence,
      risk_timeline: this.generateRiskTimeline(analysis, trend),
    };

    // Log agent decision
    await this.supabase.from("agent_decisions").insert({
      agent_id: this.AGENT_IDS.FORECAST,
      input: `Forecast trends for customer ${customerId}`,
      output: `Forecast complete: trend=${forecast.trend_direction}, confidence=${(forecast.confidence * 100).toFixed(0)}%`,
      reasoning: JSON.stringify({
        steps: ["Fetched historical predictions", "Calculated trend direction", "Projected 30-day outlook", "Generated risk timeline"],
        historical_data_points: history?.length || 0,
      }),
      confidence: forecast.confidence,
      severity: forecast.trend_direction === "worsening" ? "high" : "medium",
    });

    // Send message to Decision Engine
    await this.sendAgentMessage({
      from: this.AGENT_IDS.FORECAST,
      to: this.AGENT_IDS.DECISION,
      type: "forecast_complete",
      payload: forecast,
      timestamp: new Date().toISOString(),
    });

    await this.updateAgentState(
      this.AGENT_IDS.FORECAST,
      "active",
      `Forecasted trends for customer ${customerId}`,
    );

    return forecast;
  }

  /**
   * Decision Engine: Evaluates and recommends actions
   */
  private async runDecisionEngine(
    customerId: string,
    analysis: any,
    forecast: any,
  ) {
    console.log("🧠 Decision Engine: Evaluating actions...");

    // Apply business rules
    const rules = {
      auto_approve_threshold: 0.9,
      escalate_threshold: 0.7,
      alert_threshold: 0.6,
    };

    const decision = {
      customer_id: customerId,
      shouldAct: false,
      actions: [] as string[],
      priority: "low",
      reasoning: [] as string[],
    };

    // Critical: High churn risk + worsening trend
    if (
      analysis.churn_risk > rules.escalate_threshold &&
      forecast.trend_direction === "worsening"
    ) {
      decision.shouldAct = true;
      decision.priority = "critical";
      decision.actions.push("send_slack_alert");
      decision.actions.push("create_jira_ticket");
      decision.actions.push("send_email_to_account_manager");
      decision.reasoning.push(
        `Churn risk ${(analysis.churn_risk * 100).toFixed(0)}% with worsening trend`,
      );
    }
    // High: High churn risk but stable/improving
    else if (analysis.churn_risk > rules.escalate_threshold) {
      decision.shouldAct = true;
      decision.priority = "high";
      decision.actions.push("send_slack_alert");
      decision.actions.push("create_jira_ticket");
      decision.reasoning.push(
        `Churn risk ${(analysis.churn_risk * 100).toFixed(0)}%`,
      );
    }
    // Medium: Moderate risk + worsening trend
    else if (
      analysis.churn_risk > rules.alert_threshold &&
      forecast.trend_direction === "worsening"
    ) {
      decision.shouldAct = true;
      decision.priority = "medium";
      decision.actions.push("send_slack_alert");
      decision.reasoning.push("Moderate risk with worsening trend");
    }

    // Behavioral anomalies
    if (analysis.anomalies && analysis.anomalies.length > 0) {
      decision.shouldAct = true;
      decision.actions.push("send_slack_alert");
      decision.reasoning.push(
        `Detected ${analysis.anomalies.length} behavioral anomalies`,
      );
    }

    // Log agent decision
    await this.supabase.from("agent_decisions").insert({
      agent_id: this.AGENT_IDS.DECISION,
      input: `Evaluate actions for customer ${customerId}`,
      output: decision.shouldAct
        ? `Execute ${decision.actions.length} actions`
        : "No action required",
      reasoning: JSON.stringify({
        steps: ["Applied business rules", "Evaluated churn risk", "Assessed trend direction", "Determined action priority"],
        rules_applied: Object.keys(rules).length,
      }),
      confidence: 95.0,
      severity: decision.priority as any,
    });

    // Send message to Action Executor
    if (decision.shouldAct) {
      await this.sendAgentMessage({
        from: this.AGENT_IDS.DECISION,
        to: this.AGENT_IDS.ACTION,
        type: "action_required",
        payload: { decision, analysis, forecast },
        timestamp: new Date().toISOString(),
      });
    }

    await this.updateAgentState(
      this.AGENT_IDS.DECISION,
      "active",
      decision.shouldAct
        ? `Execute ${decision.actions.length} actions for ${customerId}`
        : `No action required for ${customerId}`,
    );

    return decision;
  }

  /**
   * Action Agent: Executes approved actions
   */
  private async runActionAgent(decision: any, analysis: any) {
    console.log("⚡ Action Agent: Executing actions...");

    const context: ActionContext = {
      type: "churn_alert",
      severity: decision.priority,
      data: {
        customer_id: decision.customer_id,
        churn_probability: analysis?.churn_risk || 0,
        risk_level: analysis?.risk_level || "low",
        contributing_factors: analysis?.contributing_factors || [],
        recommended_actions: decision.actions || [],
      },
    };

    const success = await actionExecutor.execute(context);

    // Log agent decision
    await this.supabase.from("agent_decisions").insert({
      agent_id: this.AGENT_IDS.ACTION,
      input: `Execute actions for customer ${decision.customer_id}`,
      output: `Executed ${decision.actions?.length || 0} actions`,
      reasoning: JSON.stringify({
        steps: decision.actions || [],
        priority: decision.priority,
      }),
      confidence: 98.0,
      severity: decision.priority,
    });

    await this.updateAgentState(
      this.AGENT_IDS.ACTION,
      "idle",
      `Executed ${decision.actions?.length || 0} actions`,
    );
  }

  /**
   * Send message between agents (inter-agent communication)
   */
  private async sendAgentMessage(message: AgentMessage) {
    this.messageBus.push(message);

    await this.supabase.from("agent_communications").insert({
      from_agent_id: message.from,
      to_agent_id: message.to,
      message_type: message.type,
      payload: message.payload,
    });
  }

  // Helper methods
  private calculateBehavioralScore(customer: any): number {
    const factors = [
      customer.feature_usage_rate || 0.5,
      customer.engagement_score || 0.5,
      customer.last_login ? 1 - this.daysSince(customer.last_login) / 90 : 0,
    ];
    return factors.reduce((sum, val) => sum + val, 0) / factors.length;
  }

  private detectBehavioralAnomalies(customer: any): string[] {
    const anomalies = [];
    if (customer.payment_failures > 2)
      anomalies.push("Multiple payment failures");
    if (customer.support_tickets > 5)
      anomalies.push("High support ticket volume");
    if (this.daysSince(customer.last_login) > 30)
      anomalies.push("Inactive for 30+ days");
    return anomalies;
  }

  private calculateTrend(history: any[]) {
    if (history.length < 2) {
      return { direction: "stable", confidence: 0.5 };
    }

    const recent = history
      .slice(0, 3)
      .map((h) => h.prediction_data.churn_probability);
    const older = history
      .slice(3, 6)
      .map((h) => h.prediction_data.churn_probability);

    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const olderAvg =
      older.length > 0
        ? older.reduce((sum, val) => sum + val, 0) / older.length
        : recentAvg;

    const change = recentAvg - olderAvg;

    return {
      direction:
        change > 0.05 ? "worsening" : change < -0.05 ? "improving" : "stable",
      confidence: Math.min(history.length / 10, 0.95),
    };
  }

  private projectChurnRisk(currentRisk: number, trend: any): number {
    const trendModifier =
      trend.direction === "worsening"
        ? 0.1
        : trend.direction === "improving"
          ? -0.1
          : 0;
    return Math.max(0, Math.min(1, currentRisk + trendModifier));
  }

  private projectCLVChange(currentCLV: number, trend: any): number {
    const trendModifier =
      trend.direction === "worsening"
        ? -0.15
        : trend.direction === "improving"
          ? 0.15
          : 0;
    return currentCLV * (1 + trendModifier);
  }

  private generateRiskTimeline(analysis: any, forecast: any) {
    return {
      current: analysis.churn_risk,
      week_1: analysis.churn_risk * 1.02,
      week_2: analysis.churn_risk * 1.05,
      week_4: forecast.predicted_churn_in_30d,
    };
  }

  private daysSince(dateString: string): number {
    const date = new Date(dateString);
    const now = new Date();
    return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  }
}

// Singleton instance
export const agentOrchestrator = new MultiAgentOrchestrator();
