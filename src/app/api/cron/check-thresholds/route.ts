import { actionExecutor } from "@/lib/actions/executor";
import { createClient } from "@/lib/supabase/client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🔍 Checking aggregate thresholds...");

    const supabase = createClient();

    // Get recent predictions (all predictions, not just last 24 hours)
    const { data: predictions } = await supabase
      .from("ml_predictions")
      .select("*")
      .eq("prediction_type", "churn")
      .order("created_at", { ascending: false });

    if (!predictions || predictions.length === 0) {
      return NextResponse.json({ message: "No predictions found" });
    }

    // Get unique customers (latest prediction per customer)
    const customerMap = new Map();
    for (const pred of predictions) {
      if (!customerMap.has(pred.customer_id)) {
        customerMap.set(pred.customer_id, pred);
      }
    }

    const uniquePredictions = Array.from(customerMap.values());
    const totalCustomers = uniquePredictions.length;

    // Count high-risk customers (>70% churn)
    const highRiskCustomers = uniquePredictions.filter(
      (p) => p.prediction_data.churn_probability > 0.7
    );
    const highRiskCount = highRiskCustomers.length;

    // Calculate average churn rate
    const avgChurnRate =
      uniquePredictions.reduce((sum, p) => sum + p.prediction_data.churn_probability, 0) /
      totalCustomers;

    // Calculate high-risk percentage
    const highRiskPercentage = highRiskCount / totalCustomers;

    // Thresholds
    const THRESHOLDS = {
      HIGH_RISK_COUNT: parseInt(process.env.VOICE_CALL_THRESHOLD_COUNT || "1"),
      AVG_CHURN_RATE: parseFloat(process.env.VOICE_CALL_THRESHOLD_CHURN || "0.30"),
      HIGH_RISK_PERCENTAGE: parseFloat(process.env.VOICE_CALL_THRESHOLD_PERCENTAGE || "0.01"),
    };

    console.log(`\n📊 Threshold Check:`);
    console.log(`   - High risk customers: ${highRiskCount} (threshold: ${THRESHOLDS.HIGH_RISK_COUNT})`);
    console.log(`   - Average churn rate: ${(avgChurnRate * 100).toFixed(1)}% (threshold: ${(THRESHOLDS.AVG_CHURN_RATE * 100).toFixed(1)}%)`);
    console.log(`   - High risk percentage: ${(highRiskPercentage * 100).toFixed(1)}% (threshold: ${(THRESHOLDS.HIGH_RISK_PERCENTAGE * 100).toFixed(1)}%)`);

    // Check if any threshold is exceeded
    const thresholdsExceeded = [];
    let shouldTriggerVoiceCall = false;

    if (highRiskCount >= THRESHOLDS.HIGH_RISK_COUNT) {
      thresholdsExceeded.push(
        `${highRiskCount} customers at high risk (threshold: ${THRESHOLDS.HIGH_RISK_COUNT})`
      );
      shouldTriggerVoiceCall = true;
    }

    if (avgChurnRate >= THRESHOLDS.AVG_CHURN_RATE) {
      thresholdsExceeded.push(
        `Average churn rate ${(avgChurnRate * 100).toFixed(1)}% (threshold: ${(THRESHOLDS.AVG_CHURN_RATE * 100).toFixed(1)}%)`
      );
      shouldTriggerVoiceCall = true;
    }

    if (highRiskPercentage >= THRESHOLDS.HIGH_RISK_PERCENTAGE) {
      thresholdsExceeded.push(
        `${(highRiskPercentage * 100).toFixed(1)}% of customers at high risk (threshold: ${(THRESHOLDS.HIGH_RISK_PERCENTAGE * 100).toFixed(1)}%)`
      );
      shouldTriggerVoiceCall = true;
    }

    if (shouldTriggerVoiceCall) {
      console.log(`\n🚨 CRITICAL THRESHOLD EXCEEDED!`);
      console.log(`   Reasons:`);
      thresholdsExceeded.forEach((reason) => console.log(`   - ${reason}`));

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
          high_risk_customer_ids: highRiskCustomers.slice(0, 10).map(p => p.customer_id),
          timestamp: new Date().toISOString(),
        },
      });

      return NextResponse.json({
        status: "CRITICAL",
        message: "Threshold exceeded - voice call triggered",
        high_risk_count: highRiskCount,
        thresholds_exceeded: thresholdsExceeded,
      });
    }

    return NextResponse.json({
      status: "OK",
      message: "All thresholds within acceptable range",
      high_risk_count: highRiskCount,
    });
  } catch (error) {
    console.error("Threshold check failed:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    service: "Aggregate Threshold Checker",
    status: "ready",
  });
}
