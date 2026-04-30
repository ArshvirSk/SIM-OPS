/**
 * Forecast Agent - LangChain + AI Engine
 * Predicts future customer trajectory and revenue impact
 */

import { createClient } from "@/lib/supabase/client";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { flashModel, isLLMAvailable, usageTracker } from "../gemini-config";

const AGENT_ID = "prediction";

/**
 * Forecast Agent Prompt Template
 */
const forecastPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a financial forecasting expert specializing in SaaS customer lifetime value and churn prediction.

Your role is to:
1. Analyze historical trends and project future trajectories
2. Estimate revenue impact of potential churn
3. Identify accelerating or decelerating risk patterns
4. Provide 30-day forward-looking risk assessment

Be specific with percentages and dollar amounts. Focus on actionable timelines.`,
  ],
  [
    "human",
    `Based on this customer analysis:
{analysis_data}

Provide a 30-day forecast including:
1. **Projected Churn Risk**: Trend direction (increasing/stable/decreasing) and estimated probability in 30 days
2. **Revenue Impact**: Dollar amount at risk if customer churns
3. **Key Indicators**: Metrics to monitor for early warning
4. **Intervention Window**: Recommended timeframe for action (immediate/7 days/30 days)

Return forecast in JSON format with clear numerical predictions.`,
  ],
]);

/**
 * Run Forecast Agent with LangChain
 */
export async function runForecastAgentLLM(analysisData: any) {
  console.log(
    "📈 Forecast Agent (LangChain + AI Engine): Projecting trajectory...",
  );

  // Check if LLM is available and within quota
  if (!isLLMAvailable() || !usageTracker.checkAndIncrement(2000)) {
    console.log("  → Falling back to statistical forecast");
    return await runForecastAgentFallback(analysisData);
  }

  try {
    const chain = forecastPrompt.pipe(flashModel);

    const result = await chain.invoke({
      analysis_data: JSON.stringify(analysisData.analysis, null, 2),
    });

    const forecastText = result.content.toString();

    // Extract JSON from response
    let forecast;
    try {
      const jsonMatch = forecastText.match(/\{[\s\S]*\}/);
      forecast = jsonMatch
        ? JSON.parse(jsonMatch[0])
        : { raw_forecast: forecastText };
    } catch {
      forecast = { raw_forecast: forecastText };
    }

    // Store agent decision
    const supabase = createClient();
    await supabase.from("agent_decisions").insert({
      agent_id: AGENT_ID,
      input: `Forecast for customer ${analysisData.customer_id}`,
      output: "Forecast analysis completed (LLM)",
      reasoning: JSON.stringify({
        llm_forecast: forecastText.substring(0, 500),
        model: "Core AI",
        method: "llm",
      }),
      confidence: 80.0,
      severity: "info",
    });

    console.log("  ✓ LLM forecast complete");

    return {
      customer_id: analysisData.customer_id,
      forecast,
      method: "llm",
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("  ✗ LLM forecast failed:", error);
    return await runForecastAgentFallback(analysisData);
  }
}

/**
 * Fallback: Statistical trend analysis
 */
async function runForecastAgentFallback(analysisData: any) {
  console.log("  → Using statistical forecast");

  const analysis = analysisData.analysis;
  const churnRisk = analysis.churn_risk || analysis.churn_probability || 0.5;
  const clv = analysis.clv || analysis.predicted_clv || 1000;

  // Simple trend projection
  const trendMultiplier =
    churnRisk > 0.7 ? 1.15 : churnRisk > 0.5 ? 1.05 : 0.95;
  const projected30DayRisk = Math.min(churnRisk * trendMultiplier, 0.99);

  const forecast = {
    projected_churn_risk_30d: projected30DayRisk,
    trend_direction: trendMultiplier > 1 ? "increasing" : "stable",
    revenue_at_risk: clv * 0.8, // Assume 80% of CLV at risk
    confidence: 0.75,
    intervention_window:
      projected30DayRisk > 0.85
        ? "immediate"
        : projected30DayRisk > 0.7
          ? "7_days"
          : "30_days",
    key_indicators: [
      "login_frequency",
      "feature_usage_rate",
      "support_ticket_volume",
    ],
  };

  // Store decision
  const supabase = createClient();
  await supabase.from("agent_decisions").insert({
    agent_id: AGENT_ID,
    input: `Forecast for customer ${analysisData.customer_id}`,
    output: "Forecast analysis completed (statistical)",
    reasoning: JSON.stringify({
      method: "statistical",
      projected_risk: forecast.projected_churn_risk_30d,
      trend: forecast.trend_direction,
    }),
    confidence: 75.0,
    severity: "info",
  });

  return {
    customer_id: analysisData.customer_id,
    forecast,
    method: "statistical",
    timestamp: new Date().toISOString(),
  };
}
