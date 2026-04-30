import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!url || !key) {
    throw new Error("Supabase URL or Key missing from environment context.");
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn(
      "[Simulator] SUPABASE_SERVICE_ROLE_KEY is missing. Using ANON_KEY.",
    );
  }

  return createClient(url, key);
}

/**
 * SimulatorEngine responsible for injecting lifelike data into the
 * Supabase tables to feed the SimOps agent pipeline.
 */
export class SimulatorEngine {
  /**
   * Drops a "nuke" on a specific random customer.
   * Modifies an existing customer to look like they are severely churning.
   * Decreases engagement, logs a billing failure.
   */
  static async injectChurnSignal() {
    const supabase = getSupabase();

    // Find an active customer
    const { data: customers } = await supabase
      .from("customers")
      .select("id")
      .eq("status", "active")
      .limit(10);

    if (!customers || customers.length === 0)
      return { success: false, message: "No active users found to churn" };

    const target = customers[Math.floor(Math.random() * customers.length)];
    if (!target) return { success: false, message: "No target found" };

    // Drastically reduce stats (engagement_score must stay 0-1 per CHECK constraint)
    await supabase
      .from("customers")
      .update({
        feature_usage_rate: 0.1,
        avg_session_duration: 30, // seconds
        support_tickets: 5,
        payment_failures: 2,
        engagement_score: 0.12, // was 12 — violates CHECK (engagement_score >= 0 AND <= 1)
        status: "at_risk",
      })
      .eq("id", target.id);

    // Insert a failed transaction to make it concrete
    await supabase.from("transactions").insert({
      customer_id: target.id,
      amount: 299.99,
      status: "failed",
      description: "Subscription Renewal - Insufficient Funds",
    });

    console.log(
      `[Simulator] Injected severe churn signal for customer: ${target.id}`,
    );

    // Write a critical agent_decision so SimOps detects it immediately
    const agentIds = [
      "monitoring", // Analyst
      "decision", // Decision
    ];
    const agentId = agentIds[Math.floor(Math.random() * agentIds.length)];
    await supabase.from("agent_decisions").insert({
      agent_id: agentId,
      input: `Customer ${target.id} — Churn Signal Injected`,
      output: `CRITICAL: Customer ${target.id.substring(0, 8)} flagged for imminent churn. Engagement dropped to 12%, payment failed ($299.99). Immediate intervention required.`,
      reasoning: `Simulation engine injected churn signal. engagement_score=0.12, payment_failures=2, avg_session_duration=30s. Rule-based threshold exceeded for churn risk.`,
      confidence: 0.92,
      severity: "critical",
      workflow_triggered: "churn-intervention",
    });

    return { success: true, customerId: target.id };
  }

  /**
   * Generates natural traffic (new signs ups, purchases)
   * This is meant to be called on a cron or loop from the UI.
   */
  static async simulateTick() {
    const supabase = getSupabase();
    const eventType = Math.random();

    // Sign up a user immediately if none exist (Cold Start)
    const { count: customerCount } = await supabase
      .from("customers")
      .select("*", { count: "exact", head: true });

    if (customerCount === 0) {
      console.log("[Simulator] Cold start: forcing user signup...");
      return await this.forceSignup(supabase);
    }

    // 40% chance of a new transaction from existing user
    if (eventType < 0.4) {
      const { data: customers } = await supabase
        .from("customers")
        .select("id")
        .limit(50);
      if (customers && customers.length > 0) {
        const target = customers[Math.floor(Math.random() * customers.length)];
        if (target) {
          await supabase.from("transactions").insert({
            customer_id: target.id,
            amount: Math.floor(Math.random() * 500) + 10, // $10 - $510
            status: "completed",
            description: "Purchase / Upgrade",
          });
          return { success: true, event: "transaction", customerId: target.id };
        }
      }
    }

    // 20% chance of new user signup
    if (eventType >= 0.4 && eventType < 0.6) {
      return await this.forceSignup(supabase);
    }

    // 40% chance of doing nothing
    return { success: true, event: "idle" };
  }

  private static async forceSignup(supabase: any) {
    const id = crypto.randomUUID();
    const { error } = await supabase.from("customers").insert({
      id,
      email: `sim_user_${id.substring(0, 8)}@example.com`,
      name: `Simulated User ${id.substring(0, 4)}`,
      status: "active",
      feature_usage_rate: parseFloat((0.5 + Math.random() * 0.45).toFixed(2)), // 0.50 – 0.95
      engagement_score: parseFloat((0.6 + Math.random() * 0.35).toFixed(2)), // 0.60 – 0.95
      avg_session_duration: Math.floor(Math.random() * 30) + 10, // 10-40 min
      total_spend: 0,
      last_activity: new Date().toISOString(),
    });

    if (error) {
      console.error("[Simulator] Signup error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, event: "signup", customerId: id };
  }
}
