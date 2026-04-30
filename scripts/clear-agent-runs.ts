/**
 * Clear All Agent Runs Script
 * Clears all agent activity data while preserving agent definitions
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials");
  console.error("   Make sure .env.local has NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearAgentRuns() {
  console.log("🧹 Clearing all agent runs...\n");

  try {
    // 1. Clear agent communications
    console.log("📡 Clearing agent communications...");
    const { error: commError } = await supabase
      .from("agent_communications")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all
    if (commError) throw commError;
    console.log("   ✓ Agent communications cleared");

    // 2. Clear agent decisions
    console.log("🧠 Clearing agent decisions...");
    const { error: decError } = await supabase
      .from("agent_decisions")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all
    if (decError) throw decError;
    console.log("   ✓ Agent decisions cleared");

    // 3. Clear ML predictions
    console.log("🤖 Clearing ML predictions...");
    const { error: predError } = await supabase
      .from("ml_predictions")
      .delete()
      .gte("id", "00000000-0000-0000-0000-000000000000"); // Delete all (using gte to match all UUIDs)
    if (predError) throw predError;
    console.log("   ✓ ML predictions cleared");

    // 4. Clear activity logs
    console.log("📋 Clearing activity logs...");
    const { error: logError } = await supabase
      .from("activity_logs")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all
    if (logError) throw logError;
    console.log("   ✓ Activity logs cleared");

    // 5. Clear risk alerts
    console.log("⚠️  Clearing risk alerts...");
    const { error: alertError } = await supabase
      .from("risk_alerts")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all
    if (alertError) throw alertError;
    console.log("   ✓ Risk alerts cleared");

    // 6. Clear workflow runs
    console.log("🔄 Clearing workflow runs...");
    const { error: workflowError } = await supabase
      .from("workflow_runs")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all
    if (workflowError) throw workflowError;
    console.log("   ✓ Workflow runs cleared");

    // 7. Reset agent states
    console.log("🔄 Resetting agent states...");
    const { error: stateError } = await supabase
      .from("agents")
      .update({
        status: "idle",
        last_action: null,
        actions_today: 0,
        updated_at: new Date().toISOString(),
      })
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Update all
    if (stateError) throw stateError;
    console.log("   ✓ Agent states reset to idle");

    // 8. Reset agent metrics
    console.log("📊 Resetting agent metrics...");
    const agentIds = ["monitoring", "prediction", "decision", "action", "reporting", "feedback"];
    
    for (const agentId of agentIds) {
      // First try to update existing record
      const { error: updateError } = await supabase
        .from("agent_metrics")
        .update({
          total_decisions: 0,
          avg_confidence: 0,
          success_rate: 0,
          avg_response_time: 0,
          recorded_at: new Date().toISOString(),
        })
        .eq("agent_id", agentId);
      
      // If no record exists, insert one
      if (updateError) {
        const { error: insertError } = await supabase
          .from("agent_metrics")
          .insert({
            agent_id: agentId,
            total_decisions: 0,
            avg_confidence: 0,
            success_rate: 0,
            avg_response_time: 0,
            recorded_at: new Date().toISOString(),
          });
        if (insertError && insertError.code !== '23505') {
          throw insertError;
        }
      }
    }
    console.log("   ✓ Agent metrics reset");

    // 9. Show summary
    console.log("\n✅ All agent runs cleared successfully!\n");
    
    const { count: commCount } = await supabase
      .from("agent_communications")
      .select("*", { count: "exact", head: true });
    
    const { count: decCount } = await supabase
      .from("agent_decisions")
      .select("*", { count: "exact", head: true });
    
    const { count: predCount } = await supabase
      .from("ml_predictions")
      .select("*", { count: "exact", head: true });

    const { count: logCount } = await supabase
      .from("activity_logs")
      .select("*", { count: "exact", head: true });

    const { count: alertCount } = await supabase
      .from("risk_alerts")
      .select("*", { count: "exact", head: true });

    console.log("📊 Summary:");
    console.log(`   - Agent communications: ${commCount || 0}`);
    console.log(`   - Agent decisions: ${decCount || 0}`);
    console.log(`   - ML predictions: ${predCount || 0}`);
    console.log(`   - Activity logs: ${logCount || 0}`);
    console.log(`   - Risk alerts: ${alertCount || 0}`);
    console.log("\n🎉 Database is clean and ready for new agent runs!");

  } catch (error) {
    console.error("\n❌ Error clearing agent runs:", error);
    process.exit(1);
  }
}

// Run the script
clearAgentRuns();
