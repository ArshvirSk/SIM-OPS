/**
 * Dashboard Sync Utilities
 * Manually triggers aggregate predictions & historical data generation
 * so the dashboard graphs fill up after simulation runs.
 */

import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

/**
 * Reads all customers + ml_predictions and writes an aggregate record
 * to the `predictions` table (what RevenueForecast reads from).
 */
export async function syncDashboardPredictions(): Promise<{
  success: boolean;
  message: string;
  count?: number;
}> {
  const supabase = getSupabase();

  // Fetch recent individual ML predictions (last 24h)
  const { data: mlPredictions, error: mlError } = await supabase
    .from("ml_predictions")
    .select("*")
    .eq("prediction_type", "churn")
    .gte(
      "created_at",
      new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    );

  if (mlError) {
    return { success: false, message: `Failed to fetch predictions: ${mlError.message}` };
  }

  // Fetch customer stats
  const { data: customers } = await supabase
    .from("customers")
    .select("status, engagement_score, total_spend");

  const activeCount = customers?.filter((c) => c.status === "active").length || 0;
  const atRiskCount = customers?.filter((c) => c.status === "at_risk").length || 0;
  const totalCount = customers?.length || 0;

  // Calculate averages from ml_predictions
  const predictions = mlPredictions || [];
  const avgChurn =
    predictions.length > 0
      ? predictions.reduce((sum, p) => {
          const prob = (p.prediction_data as any)?.churn_probability || 0;
          return sum + prob;
        }, 0) / predictions.length
      : atRiskCount / Math.max(totalCount, 1);

  // Estimate revenue from customers
  const avgSpend =
    customers && customers.length > 0
      ? customers.reduce((sum, c) => sum + (c.total_spend || 0), 0) /
        customers.length
      : 0;
  const estimatedRevenue = Math.round(activeCount * Math.max(avgSpend, 150));

  // Insert aggregate record into `predictions` table (used by RevenueForecast)
  const { error: insertError } = await supabase.from("predictions").insert({
    type: "revenue",
    prediction: {
      value: Math.max(estimatedRevenue / 1000, 1), // in thousands
      average_revenue: estimatedRevenue,
      predicted_revenue: estimatedRevenue * 1.05,
      churn_probability: avgChurn,
      high_risk_customers: atRiskCount,
      total_customers: totalCount,
      active_customers: activeCount,
    },
    confidence: predictions.length > 5 ? 0.87 : 0.65,
    input_data: {
      source: "manual_sync",
      ml_predictions_used: predictions.length,
      timestamp: new Date().toISOString(),
    },
  });

  if (insertError) {
    return { success: false, message: `Failed to insert aggregate: ${insertError.message}` };
  }

  return {
    success: true,
    message: `Synced ${predictions.length} ML predictions → aggregate record written`,
    count: predictions.length,
  };
}

/**
 * Generates realistic historical data for the last N months so the
 * 6-month bar charts show data immediately (not just "today's" sim ticks).
 */
export async function generateHistoricalData(months: number = 6): Promise<{
  success: boolean;
  message: string;
  stats?: { customers: number; transactions: number; predictions: number };
}> {
  const supabase = getSupabase();

  const now = new Date();
  const customerIds: string[] = [];
  const transactionRecords: any[] = [];
  const predictionRecords: any[] = [];

  // ── 1. Seed customers spread over the last N months ──────────────────────
  const numCustomers = 60;
  for (let i = 0; i < numCustomers; i++) {
    const id = crypto.randomUUID();
    customerIds.push(id);

    // Spread sign-up dates across past months
    const mthOffset = Math.floor(Math.random() * months);
    const signupDate = new Date(
      now.getFullYear(),
      now.getMonth() - mthOffset,
      Math.ceil(Math.random() * 28),
    );

    const isChurned = Math.random() < 0.12; // 12% churn rate
    const isAtRisk = !isChurned && Math.random() < 0.1;

    await supabase.from("customers").upsert(
      {
        id,
        email: `hist_${id.substring(0, 8)}@example.com`,
        name: `Historical User ${i + 1}`,
        status: isChurned ? "churned" : isAtRisk ? "at_risk" : "active",
        feature_usage_rate: parseFloat(
          (isChurned ? 0.05 + Math.random() * 0.2 : 0.5 + Math.random() * 0.45).toFixed(2),
        ),
        engagement_score: parseFloat(
          (isChurned ? 0.05 + Math.random() * 0.2 : 0.55 + Math.random() * 0.4).toFixed(2),
        ),
        payment_failures: isChurned ? Math.floor(Math.random() * 3) + 1 : 0,
        support_tickets: Math.floor(Math.random() * 5),
        avg_session_duration: isChurned
          ? Math.floor(Math.random() * 5) + 1
          : Math.floor(Math.random() * 30) + 10,
        total_spend: Math.floor(Math.random() * 2000) + 100,
        last_activity: signupDate.toISOString(),
        created_at: signupDate.toISOString(),
        updated_at: isChurned
          ? new Date(signupDate.getTime() + Math.random() * 30 * 24 * 3600 * 1000).toISOString()
          : new Date().toISOString(),
      },
      { onConflict: "id" },
    );
  }

  // ── 2. Seed transactions spread over the last N months ────────────────────
  const txPerMonth = 20;
  for (let m = 0; m < months; m++) {
    for (let t = 0; t < txPerMonth; t++) {
      if (customerIds.length === 0) break;
      const custId = customerIds[Math.floor(Math.random() * customerIds.length)];
      const txDate = new Date(
        now.getFullYear(),
        now.getMonth() - (months - 1 - m),
        Math.ceil(Math.random() * 28),
      );

      transactionRecords.push({
        customer_id: custId,
        amount: Math.floor(Math.random() * 500) + 50,
        status: Math.random() < 0.92 ? "completed" : "failed",
        description: "Historical Subscription",
        created_at: txDate.toISOString(),
      });
    }
  }

  if (transactionRecords.length > 0) {
    await supabase.from("transactions").insert(transactionRecords);
  }

  // ── 3. Seed aggregate prediction records (one per month) ─────────────────
  for (let m = 0; m < months; m++) {
    const predDate = new Date(
      now.getFullYear(),
      now.getMonth() - (months - 1 - m),
      15, // mid-month
    );

    // Revenue grows slightly each month (realistic trend)
    const baseRevenue = 28000 + m * 800 + Math.floor(Math.random() * 2000);

    predictionRecords.push({
      type: "revenue",
      prediction: {
        value: Math.round(baseRevenue / 1000),
        average_revenue: baseRevenue,
        predicted_revenue: Math.round(baseRevenue * 1.05),
        churn_probability: 0.08 + Math.random() * 0.05,
        high_risk_customers: Math.floor(Math.random() * 8) + 2,
        total_customers: Math.floor(numCustomers * ((m + 1) / months)),
      },
      confidence: 0.85,
      input_data: { source: "historical_seed", month: m },
      created_at: predDate.toISOString(),
    });
  }

  if (predictionRecords.length > 0) {
    await supabase.from("predictions").insert(predictionRecords);
  }

  return {
    success: true,
    message: `Generated ${months} months of historical data`,
    stats: {
      customers: numCustomers,
      transactions: transactionRecords.length,
      predictions: predictionRecords.length,
    },
  };
}
