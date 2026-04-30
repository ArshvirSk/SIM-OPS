/**
 * Analyst Agent - LangChain + AI Engine
 * Uses LLM to analyze customer data and identify risk patterns
 */

import { mlClient } from "@/lib/ml/client";
import { MLDataPipeline } from "@/lib/ml/pipeline";
import { createClient } from "@/lib/supabase/client";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { flashModel, isLLMAvailable, usageTracker } from "../gemini-config";

const AGENT_ID = "monitoring";

/**
 * Analyst Agent Prompt Template
 */
const analystPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are an expert customer success analyst specializing in SaaS business intelligence.

Your role is to:
1. Analyze customer behavioral data thoroughly
2. Identify risk patterns (declining engagement, payment issues, low usage)
3. Run ML predictions to quantify churn probability
4. Provide structured analysis with clear reasoning

Focus on actionable insights. Be concise but thorough.`,
  ],
  [
    "human",
    `Analyze customer {customer_id} and provide:

1. **Current State**: Engagement level, usage patterns, financial health
2. **Risk Factors**: Specific concerns (payment failures, low activity, support issues)
3. **Churn Probability**: Use ML predictions to estimate risk (0-100%)
4. **Behavioral Score**: Overall health score (0-1 scale)
5. **Key Patterns**: Notable trends in customer behavior

Use available tools to fetch data and run predictions. Return analysis in JSON format.`,
  ],
]);

/**
 * Run Analyst Agent with LangChain
 */
export async function runAnalystAgentLLM(customerId: string) {
  console.log("🤖 Analyst Agent (LangChain + AI Engine): Analyzing customer...");

  // Check if LLM is available and within quota
  if (!isLLMAvailable() || !usageTracker.checkAndIncrement(2500)) {
    console.log("  → Falling back to rule-based analysis");
    return await runAnalystAgentFallback(customerId);
  }

  try {
    // Create agent chain
    const chain = analystPrompt.pipe(flashModel);

    // Execute agent
    const result: any = await chain.invoke({
      customer_id: customerId,
    });

    // Parse response
    const analysisText = result.content?.toString() || JSON.stringify(result);

    // Try to extract JSON from response
    let analysis;
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      analysis = jsonMatch
        ? JSON.parse(jsonMatch[0])
        : { raw_analysis: analysisText };
    } catch {
      analysis = { raw_analysis: analysisText };
    }

    // Store agent decision
    const supabase = createClient();
    await supabase.from("agent_decisions").insert({
      agent_id: AGENT_ID,
      input: `Analyze customer ${customerId}`,
      output: "Customer analysis completed (LLM)",
      reasoning: JSON.stringify({
        llm_analysis: analysisText.substring(0, 500),
        model: "Core AI",
        method: "llm",
      }),
      confidence: 85.0,
      severity: "info",
    });

    // Store granular prediction record
    await supabase.from("ml_predictions").insert({
      customer_id: customerId,
      prediction_type: "churn",
      prediction_data: {
        churn_probability:
          (analysis.churn_probability || analysis.churn_risk || 50) / 100,
        risk_level: analysis.risk_level || "medium",
        contributing_factors: analysis.risk_factors || analysis.patterns || [],
        engagement_level: analysis.engagement_level || "medium",
      },
      confidence: analysis.confidence || 85.0,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      metadata: {
        method: "llm",
        model: "Core AI",
      },
    });

    console.log("  ✓ LLM analysis complete and stored");

    return {
      customer_id: customerId,
      analysis,
      method: "llm",
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("  ✗ LLM analysis failed:", error);
    return await runAnalystAgentFallback(customerId);
  }
}

/**
 * Fallback: Rule-based analysis (no LLM)
 */
async function runAnalystAgentFallback(customerId: string) {
  console.log("  → Using rule-based analysis");

  const supabase = createClient();

  // Fetch customer data
  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("id", customerId)
    .single();

  if (!customer) {
    throw new Error("Customer not found");
  }

  // Extract features and run predictions
  const churnFeatures = MLDataPipeline.extractChurnFeatures(customer);
  const clvFeatures = MLDataPipeline.extractCLVFeatures(customer);

  const churnPrediction = await mlClient.predictChurn({
    customer_id: customerId,
    features: churnFeatures,
  });

  const clvPrediction = await mlClient.predictCLV({
    customer_id: customerId,
    features: clvFeatures,
  });

  // Calculate behavioral score
  const behavioralScore =
    (customer.feature_usage_rate +
      customer.engagement_score +
      Math.max(0, 1 - customer.payment_failures * 0.2)) /
    3;

  // Identify risk factors
  const riskFactors = [];
  if (customer.payment_failures > 1) riskFactors.push("payment_issues");
  if (customer.feature_usage_rate < 0.3) riskFactors.push("low_usage");
  if (customer.support_tickets > 5) riskFactors.push("high_support_load");
  if (customer.engagement_score < 0.4) riskFactors.push("low_engagement");

  const analysis = {
    customer_id: customerId,
    churn_risk: churnPrediction.churn_probability,
    risk_level: churnPrediction.risk_level,
    clv: clvPrediction.predicted_clv,
    behavioral_score: behavioralScore,
    risk_factors: riskFactors,
    engagement_level:
      customer.engagement_score > 0.7
        ? "high"
        : customer.engagement_score > 0.4
          ? "medium"
          : "low",
  };

  // Store decision
  await supabase.from("agent_decisions").insert({
    agent_id: AGENT_ID,
    input: `Analyze customer ${customerId}`,
    output: "Customer analysis completed (rule-based)",
    reasoning: JSON.stringify({
      method: "rule-based",
      churn_risk: analysis.churn_risk,
      risk_level: analysis.risk_level,
    }),
    confidence: 80.0,
    severity: "info",
  });

  // Store granular prediction record
  await supabase.from("ml_predictions").insert({
    customer_id: customerId,
    prediction_type: "churn",
    prediction_data: {
      churn_probability: analysis.churn_risk,
      risk_level: analysis.risk_level,
      risk_factors: analysis.risk_factors,
      engagement_level: analysis.engagement_level,
    },
    confidence: 80.0,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    metadata: {
      method: "rule-based",
    },
  });

  return {
    customer_id: customerId,
    analysis,
    method: "rule-based",
    timestamp: new Date().toISOString(),
  };
}
