/**
 * LangChain Multi-Agent Orchestrator
 * Coordinates LLM-powered agents with fallbacks
 */

import { createClient } from "@/lib/supabase/client";
import { runActionAgentLLM } from "./agents/action";
import { runAnalystAgentLLM } from "./agents/analyst";
import { runDecisionEngineLLM } from "./agents/decision";
import { runForecastAgentLLM } from "./agents/forecaster";
import { isLLMAvailable, usageTracker } from "./gemini-config";

export class LangChainOrchestrator {
  private supabase = createClient();

  /**
   * The four canonical agent rows. Upserted on first pipeline run.
   */
  private static readonly AGENTS = [
    { id: "monitoring", name: "Data Monitor",    role: "monitor",    description: "Analyzes customer data and detects risk patterns" },
    { id: "prediction", name: "ML Predictor",    role: "prediction", description: "Forecasts churn probability and revenue impact" },
    { id: "decision", name: "Decision Engine", role: "decision",   description: "Evaluates risk and determines required actions" },
    { id: "action", name: "Action Executor", role: "action",     description: "Executes approved interventions (Slack, Jira, Email)" },
  ];

  private agentsEnsured = false;

  /**
   * Ensure all 4 agent rows exist in the database (idempotent upsert).
   * Called once per process lifetime before the first pipeline run.
   */
  private async ensureAgentsExist() {
    if (this.agentsEnsured) return;
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("agents")
        .upsert(
          LangChainOrchestrator.AGENTS.map((a) => ({
            ...a,
            status: "idle" as const,
            actions_today: 0,
          })),
          { onConflict: "id" },
        );
      if (error) {
        console.error("  ✗ Failed to ensure agents exist:", error);
      } else {
        console.log("  ✓ Agent rows verified/created in database");
        this.agentsEnsured = true;
      }
    } catch (e) {
      console.error("  ✗ ensureAgentsExist exception:", e);
    }
  }


  /**
   * Execute full LangChain agent chain for a customer
   */
  async executeAgentChain(customerId: string): Promise<boolean> {
    try {
      console.log(`🚀 Starting LangChain agent chain for ${customerId}`);
      
      // Ensure agent rows exist in DB before any FK-dependent operations
      await this.ensureAgentsExist();

      // Step 1: Analyst Agent
      await this.updateAgentState("analyst", "processing", `Analyzing customer ${customerId}`);
      const analysisResult = await runAnalystAgentLLM(customerId);
      await this.logAgentMessage("analyst", "prediction", analysisResult);
      await this.updateAgentState("analyst", "active", "Analysis complete");

      // Step 2: Forecast Agent
      await this.updateAgentState("forecaster", "processing", `Projecting trends for ${customerId}`);
      const forecastResult = await runForecastAgentLLM(analysisResult);
      await this.logAgentMessage("forecaster", "decision", forecastResult);
      await this.updateAgentState("forecaster", "active", "Forecast complete");

      // Step 3: Decision Engine
      await this.updateAgentState("decision", "processing", `Evaluating actions for ${customerId}`);
      const decisionResult = await runDecisionEngineLLM(
        analysisResult,
        forecastResult,
      );
      await this.logAgentMessage("decision", "action", decisionResult);
      await this.updateAgentState("decision", "active", "Decision finalized");

      // Step 4: Action Agent
      if (decisionResult.decision.should_act) {
        await this.updateAgentState("action", "processing", "Executing actions...");
        // Fetch customer data for action execution using fresh client
        const supabase = createClient();
        const { data: customer } = await supabase
          .from("customers")
          .select("*")
          .eq("id", customerId)
          .single();

        if (customer) {
          const actionResult = await runActionAgentLLM(
            decisionResult,
            customer,
          );
          await this.logAgentMessage("action", "monitor", actionResult);
        }
        await this.updateAgentState("action", "active", "Actions executed");
      } else {
        console.log("  → No action required (low risk)");
        await this.updateAgentState("action", "active", "No action required");
      }

      console.log("✅ LangChain agent chain completed successfully");
      return true;
    } catch (error) {
      console.error("❌ LangChain agent chain failed:", error);
      // Reset all to idle on failure
      await this.updateAgentState("analyst", "idle", "Error");
      await this.updateAgentState("forecaster", "idle", "Error");
      await this.updateAgentState("decision", "idle", "Error");
      await this.updateAgentState("action", "idle", "Error");
      return false;
    }
  }

  /**
   * Resets all agents to a specific state
   */
  public async resetAllAgents(status: "idle" | "active" = "active") {
    const agents = ["analyst", "forecaster", "decision", "action"];
    for (const agent of agents) {
      await this.updateAgentState(agent as any, status, "Ready for next run");
    }
  }

  /**
   * Updates an agent's status in the database
   */
  private async updateAgentState(
    agentId: "analyst" | "forecaster" | "decision" | "action",
    status: "idle" | "processing" | "active",
    lastAction: string,
  ) {
    try {
      // Use a fresh client to ensure we bypass any cached state or session issues on server
      const supabase = createClient();

      // Map semantic IDs to DB IDs
      const dbIdMap: Record<string, string> = {
        analyst: "monitoring",
        forecaster: "prediction",
        decision: "decision",
        action: "action",
      };

      const id = dbIdMap[agentId] || agentId;

      const { error } = await supabase
        .from("agents")
        .update({
          status,
          last_action: lastAction,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        console.error(`  ✗ Database error updating agent ${agentId}:`, error);
      } else {
        // Log to console for verification
        console.log(`  → Agent ${agentId} status set to ${status}`);
      }
    } catch (error) {
      console.error(`  ✗ Failed to update agent state for ${agentId}:`, error);
    }
  }

  /**
   * Log inter-agent communication
   */
  private async logAgentMessage(
    fromId: "analyst" | "forecaster" | "decision" | "action",
    toType: "monitor" | "prediction" | "decision" | "action",
    payload: any,
  ) {
    try {
      const supabase = createClient();
      const dbIdMap: Record<string, string> = {
        analyst: "monitoring",
        forecaster: "prediction",
        decision: "decision",
        action: "action",
      };

      const fromAgentId = dbIdMap[fromId];
      // Map toType to a specific agent ID for "to"
      const toAgentIdMap: Record<string, string> = {
        monitor: "monitoring",
        prediction: "prediction",
        decision: "decision",
        action: "action",
      };
      const toAgentId = toAgentIdMap[toType];

      const { error } = await supabase.from("agent_communications").insert({
        from_agent_id: fromAgentId,
        to_agent_id: toAgentId,
        message_type: "agent_update",
        payload: {
          method: "llm",
          ...payload,
        },
      });

      if (error) {
        console.error("  ✗ Error logging agent message:", error);
      }
    } catch (error) {
      console.error("  ✗ Failed to log agent message:", error);
    }
  }

  /**
   * Get current LLM usage statistics
   */
  getUsageStats() {
    return {
      llm_available: isLLMAvailable(),
      ...usageTracker.getUsage(),
    };
  }
}

// Export singleton instance
export const langChainOrchestrator = new LangChainOrchestrator();
