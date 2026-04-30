/**
 * Cron API Route: Autonomous Predictions
 * This endpoint is called automatically by scheduled tasks (Vercel Cron or external scheduler)
 * to run ML predictions without human intervention
 */

import { agentOrchestrator } from "@/lib/agents/orchestrator";
import { langChainOrchestrator } from "@/lib/ai/orchestrator";
import { mlClient } from "@/lib/ml/client";
import { MLDataPipeline } from "@/lib/ml/pipeline";
import { createClient } from "@/lib/supabase/client";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes timeout

/**
 * POST /api/cron/predictions
 * Runs batch predictions for all active customers
 * Protected by CRON_SECRET environment variable
 */
export async function POST(req: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("CRON_SECRET not configured");
      return NextResponse.json(
        { error: "Cron secret not configured" },
        { status: 500 },
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn("Unauthorized cron attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const startTime = Date.now();
    console.log("🤖 Starting autonomous prediction run...");

    const supabase = createClient();

    // Fetch active customers (simulating real customer base)
    let { data: customers, error: fetchError } = await supabase
      .from("customers")
      .select("*")
      .order("last_activity", { ascending: false })
      .limit(50); // Process top 50 most active customers

    if (fetchError) {
      console.error("Failed to fetch customers:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch customers" },
        { status: 500 },
      );
    }

    // AUTO-SEED: If no customers exist, create demo data automatically
    if (!customers || customers.length === 0) {
      console.log("📦 No customers found - auto-seeding demo data...");
      
      const seededCustomers = await autoSeedCustomers(supabase);
      
      if (seededCustomers.length > 0) {
        console.log(`✅ Auto-seeded ${seededCustomers.length} customers`);
        customers = seededCustomers;
      } else {
        console.log("⚠️ Auto-seeding failed, no customers to process");
        return NextResponse.json({
          success: true,
          message: "No customers to process",
          count: 0,
        });
      }
    }

    console.log(`📊 Processing ${customers.length} customers...`);

    const results = {
      churn: 0,
      clv: 0,
      failed: 0,
      highRisk: [] as string[],
      agentChains: 0,
      churnProbabilities: [] as number[],
      clvValues: [] as number[],
    };

    // Run predictions in parallel batches
    const batchSize = 10;
    for (let i = 0; i < customers.length; i += batchSize) {
      const batch = customers.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (customer) => {
          try {
            // DISABLED: Execute full multi-agent chain for high-priority customers
            // Only use standard ML prediction flow to avoid inconsistent data
            const random = Math.random();

            if (false && random > 0.8) {
              // DISABLED - LangChain LLM-powered agents
              await langChainOrchestrator.executeAgentChain(customer.id);
              results.agentChains++;
              results.churn++;
              results.clv++;
              return;
            } else if (false && random > 0.6) {
              // DISABLED - Original rule-based agents
              await agentOrchestrator.executeAgentChain(customer.id);
              results.agentChains++;
              results.churn++;
              results.clv++;
              return;
            }

            // Standard prediction flow for remaining 60% of customers
            // Churn Prediction
            const churnFeatures = MLDataPipeline.extractChurnFeatures(customer);
            const churnPrediction = await mlClient.predictChurn({
              customer_id: customer.id,
              features: churnFeatures,
            });

            // Store churn prediction
            await supabase.from("ml_predictions").insert({
              customer_id: customer.id,
              prediction_type: "churn",
              prediction_data: {
                churn_probability: churnPrediction.churn_probability,
                risk_level: churnPrediction.risk_level,
                contributing_factors: churnPrediction.contributing_factors,
                recommended_actions: churnPrediction.recommended_actions,
              },
              confidence: churnPrediction.confidence,
              expires_at: new Date(
                Date.now() + 24 * 60 * 60 * 1000,
              ).toISOString(),
              metadata: {
                model_version: "v1.0",
                timestamp: new Date().toISOString(),
                source: "autonomous_cron",
              },
            });

            results.churn++;
            results.churnProbabilities.push(churnPrediction.churn_probability);

            // Track high-risk customers for alerting
            if (churnPrediction.churn_probability > 0.75) {
              results.highRisk.push(customer.id);
            }

            // CLV Prediction
            const clvFeatures = MLDataPipeline.extractCLVFeatures(customer);
            const clvPrediction = await mlClient.predictCLV({
              customer_id: customer.id,
              features: clvFeatures,
            });

            // Store CLV prediction
            await supabase.from("ml_predictions").insert({
              customer_id: customer.id,
              prediction_type: "clv",
              prediction_data: {
                predicted_clv: clvPrediction.predicted_clv,
                clv_segment: clvPrediction.clv_segment,
                factors: clvPrediction.factors,
              },
              confidence: clvPrediction.confidence,
              expires_at: new Date(
                Date.now() + 7 * 24 * 60 * 60 * 1000,
              ).toISOString(), // 7 days for CLV
              metadata: {
                model_version: "v1.0",
                timestamp: new Date().toISOString(),
                source: "autonomous_cron",
              },
            });

            results.clv++;
            results.clvValues.push(clvPrediction.predicted_clv);
          } catch (error) {
            console.error(`Prediction failed for ${customer.id}:`, error);
            results.failed++;
          }
        }),
      );

      // Small delay between batches to avoid overwhelming ML service
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const executionTime = Date.now() - startTime;

    // Store Aggregate Results for Dashboard Trends
    const aggregates = [];

    if (results.churnProbabilities.length > 0) {
      const avgChurn =
        results.churnProbabilities.reduce((a, b) => a + b, 0) /
        results.churnProbabilities.length;
      aggregates.push({
        type: "churn",
        prediction: {
          value: Number(avgChurn.toFixed(4)),
          avg_probability: avgChurn,
          count: results.churnProbabilities.length,
        },
        confidence: 0.85, // Default for batch
        input_data: {},
        created_at: new Date().toISOString(),
      });
    }

    if (results.clvValues.length > 0) {
      const avgCLV =
        results.clvValues.reduce((a, b) => a + b, 0) / results.clvValues.length;
      aggregates.push({
        type: "revenue", // Mapping CLV to revenue trend for now
        prediction: {
          value: Number(avgCLV.toFixed(2)),
          avg_clv: avgCLV,
          count: results.clvValues.length,
        },
        confidence: 0.9,
        input_data: {},
        created_at: new Date().toISOString(),
      });
    }

    if (aggregates.length > 0) {
      const { error: aggError } = await supabase
        .from("predictions")
        .insert(aggregates);
      if (aggError)
        console.error("Failed to store aggregate predictions:", aggError);
    }

    console.log(`✅ Autonomous predictions completed:`);
    console.log(`   - Churn predictions: ${results.churn}`);
    console.log(`   - CLV predictions: ${results.clv}`);
    console.log(`   - Agent chains executed: ${results.agentChains}`);
    console.log(`   - Failed: ${results.failed}`);
    console.log(`   - High risk customers: ${results.highRisk.length}`);
    console.log(`   - Execution time: ${executionTime}ms`);

    // Check thresholds and trigger voice call if needed
    await checkThresholdsAndAlert(results, supabase);

    // Log agent decision
    await supabase.from("agent_decisions").insert({
      agent_id: "prediction", // ML Predictor agent
      decision: `Completed autonomous prediction run`,
      reasoning: {
        steps: [
          "Fetched active customers",
          "Extracted ML features",
          "Ran churn and CLV predictions",
          "Stored results in database",
        ],
        data_points: customers.length,
      },
      confidence: 95.0,
      severity: "info",
      context: {
        churn_predictions: results.churn,
        clv_predictions: results.clv,
        high_risk_count: results.highRisk.length,
        execution_time_ms: executionTime,
      },
      outcome: "success",
      executed_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Autonomous predictions completed",
      results: {
        customers_processed: customers.length,
        churn_predictions: results.churn,
        clv_predictions: results.clv,
        failed_predictions: results.failed,
        high_risk_customers: results.highRisk.length,
        execution_time_ms: executionTime,
      },
    });
  } catch (error) {
    console.error("Cron prediction error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/cron/predictions
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    service: "Autonomous Prediction Service",
    status: "ready",
    endpoints: {
      POST: "Run batch predictions for all customers",
    },
  });
}

/**
 * Check aggregate thresholds and trigger voice call if exceeded
 */
async function checkThresholdsAndAlert(
  results: {
    churn: number;
    clv: number;
    failed: number;
    highRisk: string[];
    agentChains: number;
    churnProbabilities: number[];
    clvValues: number[];
  },
  supabase: any,
) {
  try {
    // Configurable thresholds (can be moved to database or env vars)
    const THRESHOLDS = {
      HIGH_RISK_COUNT: parseInt(process.env.VOICE_CALL_THRESHOLD_COUNT || "5"), // Trigger if 5+ customers at high risk
      AVG_CHURN_RATE: parseFloat(process.env.VOICE_CALL_THRESHOLD_CHURN || "0.65"), // Trigger if avg churn >65%
      HIGH_RISK_PERCENTAGE: parseFloat(process.env.VOICE_CALL_THRESHOLD_PERCENTAGE || "0.15"), // Trigger if >15% are high risk
    };

    const totalCustomers = results.churn;
    const highRiskCount = results.highRisk.length;
    const avgChurnRate =
      results.churnProbabilities.length > 0
        ? results.churnProbabilities.reduce((a, b) => a + b, 0) /
          results.churnProbabilities.length
        : 0;
    const highRiskPercentage =
      totalCustomers > 0 ? highRiskCount / totalCustomers : 0;

    console.log(`\n📊 Threshold Check:`);
    console.log(`   - High risk customers: ${highRiskCount} (threshold: ${THRESHOLDS.HIGH_RISK_COUNT})`);
    console.log(`   - Average churn rate: ${(avgChurnRate * 100).toFixed(1)}% (threshold: ${(THRESHOLDS.AVG_CHURN_RATE * 100).toFixed(1)}%)`);
    console.log(`   - High risk percentage: ${(highRiskPercentage * 100).toFixed(1)}% (threshold: ${(THRESHOLDS.HIGH_RISK_PERCENTAGE * 100).toFixed(1)}%)`);

    // Check if any threshold is exceeded
    const thresholdsExceeded = [];
    let shouldTriggerVoiceCall = false;

    if (highRiskCount >= THRESHOLDS.HIGH_RISK_COUNT) {
      thresholdsExceeded.push(
        `${highRiskCount} customers at high risk (threshold: ${THRESHOLDS.HIGH_RISK_COUNT})`,
      );
      shouldTriggerVoiceCall = true;
    }

    if (avgChurnRate >= THRESHOLDS.AVG_CHURN_RATE) {
      thresholdsExceeded.push(
        `Average churn rate ${(avgChurnRate * 100).toFixed(1)}% (threshold: ${(THRESHOLDS.AVG_CHURN_RATE * 100).toFixed(1)}%)`,
      );
      shouldTriggerVoiceCall = true;
    }

    if (highRiskPercentage >= THRESHOLDS.HIGH_RISK_PERCENTAGE) {
      thresholdsExceeded.push(
        `${(highRiskPercentage * 100).toFixed(1)}% of customers at high risk (threshold: ${(THRESHOLDS.HIGH_RISK_PERCENTAGE * 100).toFixed(1)}%)`,
      );
      shouldTriggerVoiceCall = true;
    }

    if (shouldTriggerVoiceCall) {
      console.log(`\n🚨 CRITICAL THRESHOLD EXCEEDED!`);
      console.log(`   Reasons:`);
      thresholdsExceeded.forEach((reason) => console.log(`   - ${reason}`));

      // Import action executor dynamically to avoid circular dependencies
      const { actionExecutor } = await import("@/lib/actions/executor");

      // Trigger voice call with aggregate data
      await actionExecutor.execute({
        type: "churn_alert",
        severity: "critical",
        data: {
          alert_type: "aggregate_threshold",
          high_risk_count: highRiskCount,
          total_customers: totalCustomers,
          avg_churn_rate: avgChurnRate,
          high_risk_percentage: highRiskPercentage,
          thresholds_exceeded: thresholdsExceeded,
          high_risk_customer_ids: results.highRisk.slice(0, 10), // Include top 10 for reference
          timestamp: new Date().toISOString(),
        },
      });

      // Create risk alert in database
      await supabase.from("risk_alerts").insert({
        title: "Critical: High Churn Risk Threshold Exceeded",
        description: `${highRiskCount} customers at high risk. ${thresholdsExceeded.join(". ")}`,
        severity: "critical",
        source: "Autonomous Prediction System",
        status: "active",
        metadata: {
          high_risk_count: highRiskCount,
          total_customers: totalCustomers,
          avg_churn_rate: avgChurnRate,
          high_risk_percentage: highRiskPercentage,
          thresholds_exceeded: thresholdsExceeded,
        },
      });

      console.log(`   ✅ Voice call triggered and alert created`);
    } else {
      console.log(`   ✅ All thresholds within acceptable range`);
    }
  } catch (error) {
    console.error("Error checking thresholds:", error);
    // Don't fail the entire cron job if alerting fails
  }
}

/**
 * Auto-seed customers for demo purposes
 * Creates 50 diverse customer profiles automatically
 */
async function autoSeedCustomers(supabase: any) {
  try {
    const customers = [];
    const now = new Date();

    // Helper functions
    const randomInt = (min: number, max: number) =>
      Math.floor(Math.random() * (max - min + 1)) + min;
    const randomFloat = (min: number, max: number) =>
      Math.random() * (max - min) + min;
    const randomDate = (daysAgo: number) => {
      const date = new Date();
      date.setDate(date.getDate() - randomInt(0, daysAgo));
      return date.toISOString();
    };

    // Generate 50 diverse customers
    for (let i = 0; i < 50; i++) {
      const customerId = `cust_${String(i + 1).padStart(4, "0")}`;
      const segment = i % 5; // 5 different customer segments

      // Create profile based on segment
      let profile;
      switch (segment) {
        case 0: // High-value, engaged (20%)
          profile = {
            tier: "enterprise",
            mrr: randomInt(500, 2000),
            totalSpend: randomInt(10000, 50000),
            supportTickets: randomInt(0, 2),
            paymentFailures: 0,
            featureUsage: randomFloat(0.7, 1.0),
            engagement: randomFloat(0.8, 1.0),
            nps: randomInt(8, 10),
            contractLength: randomInt(365, 730),
            referrals: randomInt(2, 10),
          };
          break;
        case 1: // Medium-value, stable (20%)
          profile = {
            tier: "professional",
            mrr: randomInt(200, 500),
            totalSpend: randomInt(5000, 15000),
            supportTickets: randomInt(1, 4),
            paymentFailures: randomInt(0, 1),
            featureUsage: randomFloat(0.5, 0.8),
            engagement: randomFloat(0.6, 0.8),
            nps: randomInt(6, 8),
            contractLength: randomInt(180, 365),
            referrals: randomInt(0, 3),
          };
          break;
        case 2: // Low-value, at-risk (20%)
          profile = {
            tier: "basic",
            mrr: randomInt(50, 200),
            totalSpend: randomInt(500, 3000),
            supportTickets: randomInt(3, 8),
            paymentFailures: randomInt(1, 3),
            featureUsage: randomFloat(0.2, 0.5),
            engagement: randomFloat(0.2, 0.5),
            nps: randomInt(3, 6),
            contractLength: randomInt(30, 180),
            referrals: 0,
          };
          break;
        case 3: // New customers (20%)
          profile = {
            tier: randomInt(0, 1) === 0 ? "basic" : "professional",
            mrr: randomInt(100, 400),
            totalSpend: randomInt(100, 1000),
            supportTickets: randomInt(0, 3),
            paymentFailures: 0,
            featureUsage: randomFloat(0.4, 0.7),
            engagement: randomFloat(0.5, 0.8),
            nps: randomInt(5, 8),
            contractLength: randomInt(30, 90),
            referrals: randomInt(0, 1),
          };
          break;
        case 4: // Churning customers (20%)
          profile = {
            tier: "basic",
            mrr: randomInt(50, 150),
            totalSpend: randomInt(200, 2000),
            supportTickets: randomInt(5, 12),
            paymentFailures: randomInt(2, 5),
            featureUsage: randomFloat(0.1, 0.3),
            engagement: randomFloat(0.1, 0.4),
            nps: randomInt(1, 4),
            contractLength: randomInt(30, 180),
            referrals: 0,
          };
          break;
        default:
          profile = {
            tier: "basic",
            mrr: 100,
            totalSpend: 1000,
            supportTickets: 2,
            paymentFailures: 0,
            featureUsage: 0.5,
            engagement: 0.5,
            nps: 7,
            contractLength: 180,
            referrals: 1,
          };
      }

      const signupDaysAgo = randomInt(30, 730);
      const lastActivityDaysAgo = randomInt(0, 60);

      customers.push({
        id: customerId,
        email: `customer${i + 1}@example.com`,
        name: `Customer ${i + 1}`,
        signup_date: randomDate(signupDaysAgo),
        last_activity: randomDate(lastActivityDaysAgo),
        subscription_tier: profile.tier,
        mrr: profile.mrr,
        total_spend: profile.totalSpend,
        support_tickets: profile.supportTickets,
        payment_failures: profile.paymentFailures,
        feature_usage_rate: profile.featureUsage,
        engagement_score: profile.engagement,
        nps_score: profile.nps,
        contract_length_days: profile.contractLength,
        referrals_made: profile.referrals,
        last_login: randomDate(lastActivityDaysAgo),
        created_at: randomDate(signupDaysAgo),
        updated_at: now.toISOString(),
      });
    }

    // Insert customers
    const { error: insertError } = await supabase
      .from("customers")
      .insert(customers);

    if (insertError) {
      console.error("❌ Auto-seed failed:", insertError.message);
      return [];
    }

    // Show summary
    const highRisk = customers.filter(
      (c) => c.engagement_score < 0.4 || c.payment_failures > 2,
    ).length;
    
    console.log(`   ✅ Created ${customers.length} customers`);
    console.log(`   📊 Distribution: ${highRisk} high-risk, ${customers.length - highRisk} low/medium-risk`);

    return customers;
  } catch (error) {
    console.error("Auto-seed error:", error);
    return [];
  }
}
