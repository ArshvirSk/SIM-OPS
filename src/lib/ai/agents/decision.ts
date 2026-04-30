/**
 * Decision Engine Agent - LangChain + AI Engine
 * Makes strategic decisions on required actions
 */

import { createClient } from "@/lib/supabase/client";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { isLLMAvailable, proModel, usageTracker } from "../gemini-config";

const AGENT_ID = "decision";

/**
 * Decision Engine Prompt Template
 */
const decisionPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a strategic decision-making AI for SaaS business operations.

Your role is to:
1. Evaluate customer risk based on analysis and forecasts
2. Apply business rules and thresholds
3. Determine severity level and required actions
4. Perform root cause analysis and recommend specific solutions
5. Suggest prevention strategies to stop recurrence

Business Rules:
- Churn risk > 90%: CRITICAL → Immediate escalation (Slack + Jira + Email)
- Churn risk 70-90%: HIGH → Account team alert (Slack + Jira)
- Churn risk 60-70%: MEDIUM → Monitoring required (Slack only)
- Churn risk < 60%: LOW → Routine tracking (log only)

Be decisive, thorough, and action-oriented.`,
  ],
  [
    "human",
    `Make a decision based on this data:

**Customer Analysis:**
{analysis_data}

**Forecast:**
{forecast_data}

Provide a complete response in **valid JSON** with these fields:
1. **severity**: "critical" | "high" | "medium" | "low"
2. **should_act**: true | false
3. **actions**: Array of ["slack", "jira", "email"]
4. **urgency**: "immediate" | "within_24h" | "within_week"
5. **reasoning**: Clear explanation of decision (string)
6. **confidence**: 0-100
7. **root_cause_analysis**: Object with:
   - "primary_cause": the main reason for churn risk (string)
   - "contributing_factors": array of 2-4 secondary factors
   - "customer_sentiment": "frustrated" | "disengaged" | "at-risk" | "satisfied"
8. **recommended_solutions**: Array of 3-5 objects, each with:
   - "action": short title (e.g. "Schedule executive call")
   - "description": 1-2 sentence detail
   - "priority": "immediate" | "short_term" | "long_term"
   - "effort": "low" | "medium" | "high"
   - "expected_impact": "high" | "medium" | "low"
9. **prevention_strategies**: Array of 2-3 strings describing proactive measures to stop this issue from recurring
10. **estimated_revenue_impact**: string like "$12,000/year at risk"

Return valid JSON only.`,
  ],
]);

/**
 * Run Decision Engine with LangChain
 */
export async function runDecisionEngineLLM(
  analysisData: any,
  forecastData: any,
) {
  console.log(
    "🧠 Decision Engine (LangChain + AI Engine): Making decision...",
  );

  // Check if LLM is available and within quota
  if (!isLLMAvailable() || !usageTracker.checkAndIncrement(3000)) {
    console.log("  → Falling back to rule-based decision");
    return await runDecisionEngineFallback(analysisData, forecastData);
  }

  try {
    const chain = decisionPrompt.pipe(proModel);

    const result = await chain.invoke({
      analysis_data: JSON.stringify(analysisData.analysis, null, 2),
      forecast_data: JSON.stringify(forecastData.forecast, null, 2),
    });

    const decisionText = result.content.toString();

    // Parse JSON response
    let decision;
    try {
      const jsonMatch = decisionText.match(/\{[\s\S]*\}/);
      decision = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (e) {
      console.warn("  ⚠️  Failed to parse LLM JSON, using fallback");
      return await runDecisionEngineFallback(analysisData, forecastData);
    }

    if (!decision || !decision.severity) {
      return await runDecisionEngineFallback(analysisData, forecastData);
    }

    // Store agent decision with enriched insights
    const supabase = createClient();
    await supabase.from("agent_decisions").insert({
      agent_id: AGENT_ID,
      input: `Decision for customer ${analysisData.customer_id}`,
      output: `Action decision: ${decision.severity.toUpperCase()} — ${decision.reasoning || "Risk assessed"}`,
      reasoning: JSON.stringify({
        method: "llm",
        model: "Core AI",
        severity: decision.severity,
        should_act: decision.should_act,
        urgency: decision.urgency,
        root_cause_analysis: decision.root_cause_analysis || null,
        recommended_solutions: decision.recommended_solutions || [],
        prevention_strategies: decision.prevention_strategies || [],
        estimated_revenue_impact: decision.estimated_revenue_impact || null,
      }),
      confidence: decision.confidence || 85.0,
      severity: decision.severity,
    });

    // Store aggregate prediction for Trends Dashboard
    await supabase.from("predictions").insert({
      type: "revenue",
      prediction: {
        value:
          decision.severity === "critical"
            ? 25
            : decision.severity === "high"
              ? 28
              : 32,
        severity: decision.severity,
        should_act: decision.should_act,
        average_revenue: 32000,
      },
      confidence: decision.confidence || 85.0,
      input_data: {
        customer_id: analysisData.customer_id,
        method: "llm",
      },
    });

    console.log(
      `  ✓ Decision: ${decision.severity.toUpperCase()} (LLM) and stored`,
    );

    return {
      customer_id: analysisData.customer_id,
      decision,
      method: "llm",
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("  ✗ LLM decision failed:", error);
    return await runDecisionEngineFallback(analysisData, forecastData);
  }
}

/**
 * Fallback: Rule-based decision engine
 */
async function runDecisionEngineFallback(analysisData: any, forecastData: any) {
  console.log("  → Using rule-based decision");

  const analysis = analysisData.analysis;
  const forecast = forecastData.forecast;

  // Get churn risk from either source
  const churnRisk =
    forecast.projected_churn_risk_30d ||
    analysis.churn_risk ||
    analysis.churn_probability ||
    0.5;

  // Apply business rules
  let severity: "critical" | "high" | "medium" | "low";
  let actions: string[];
  let shouldAct: boolean;

  if (churnRisk > 0.9) {
    severity = "critical";
    actions = ["slack", "jira", "email"];
    shouldAct = true;
  } else if (churnRisk > 0.7) {
    severity = "high";
    actions = ["slack", "jira"];
    shouldAct = true;
  } else if (churnRisk > 0.6) {
    severity = "medium";
    actions = ["slack"];
    shouldAct = true;
  } else {
    severity = "low";
    actions = [];
    shouldAct = false;
  }

  // Build root cause analysis from available data
  const riskFactors = analysis.risk_factors || [];
  const primaryCause = riskFactors.length > 0
    ? riskFactors[0].replace(/_/g, " ")
    : "declining engagement patterns";

  const decision = {
    severity,
    should_act: shouldAct,
    actions,
    urgency:
      severity === "critical"
        ? "immediate"
        : severity === "high"
          ? "within_24h"
          : "within_week",
    reasoning: `Churn risk ${(churnRisk * 100).toFixed(0)}% triggers ${severity} severity action. Risk factors: ${riskFactors.join(", ") || "general decline"}`,
    confidence: 85,
    churn_risk: churnRisk,
    root_cause_analysis: {
      primary_cause: `Customer showing ${primaryCause} with ${(churnRisk * 100).toFixed(0)}% churn probability`,
      contributing_factors: riskFactors.map((f: string) => f.replace(/_/g, " ")),
      customer_sentiment: churnRisk > 0.8 ? "frustrated" : churnRisk > 0.6 ? "disengaged" : "at-risk",
    },
    recommended_solutions: [
      ...(severity === "critical" || severity === "high" ? [
        { action: "Executive outreach call", description: "Schedule a personal call with the customer to understand their concerns and demonstrate commitment.", priority: "immediate", effort: "low", expected_impact: "high" },
        { action: "Custom retention offer", description: "Prepare a tailored discount or contract extension based on customer's usage profile.", priority: "immediate", effort: "medium", expected_impact: "high" },
      ] : []),
      { action: "Usage analysis deep-dive", description: "Review feature adoption data and identify specific drop-off points in the customer journey.", priority: "short_term", effort: "low", expected_impact: "medium" },
      { action: "Product training session", description: "Offer a dedicated training or demo session focused on underutilized features.", priority: "short_term", effort: "medium", expected_impact: "medium" },
      { action: "Feedback survey", description: "Send a brief satisfaction survey to identify unspoken concerns and feature gaps.", priority: "long_term", effort: "low", expected_impact: "medium" },
    ],
    prevention_strategies: [
      "Implement automated health score alerts at 70% threshold to catch declining engagement earlier",
      "Create proactive quarterly business reviews for all accounts with CLV above $10,000",
      "Build onboarding checkpoints to ensure feature adoption within first 30 days",
    ],
    estimated_revenue_impact: `$${((analysis.clv || 12000) * churnRisk).toFixed(0)}/year at risk`,
  };

  // Store decision
  const supabase = createClient();
  await supabase.from("agent_decisions").insert({
    agent_id: AGENT_ID,
    input: `Decision for customer ${analysisData.customer_id}`,
    output: `Action decision: ${severity.toUpperCase()} — ${decision.reasoning}`,
    reasoning: JSON.stringify({
      method: "rule-based",
      severity,
      should_act: shouldAct,
      churn_risk: churnRisk,
      urgency: decision.urgency,
      root_cause_analysis: decision.root_cause_analysis,
      recommended_solutions: decision.recommended_solutions,
      prevention_strategies: decision.prevention_strategies,
      estimated_revenue_impact: decision.estimated_revenue_impact,
    }),
    confidence: 85.0,
    severity,
  });

  console.log(`  ✓ Decision: ${severity.toUpperCase()} (rule-based)`);

  // Store aggregate prediction for Trends Dashboard
  await supabase.from("predictions").insert({
    type: "revenue",
    prediction: {
      value: severity === "critical" ? 25 : severity === "high" ? 28 : 32,
      severity,
      should_act: shouldAct,
      average_revenue: 32000,
    },
    confidence: 85.0,
    input_data: {
      customer_id: analysisData.customer_id,
      method: "rule-based",
    },
  });

  return {
    customer_id: analysisData.customer_id,
    decision,
    method: "rule-based",
    timestamp: new Date().toISOString(),
  };
}
