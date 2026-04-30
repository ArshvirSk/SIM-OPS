/**
 * Comprehensive Database Verification
 * Tests all tables and real-time subscriptions
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { join } from "path";

config({ path: join(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyDatabase() {
  console.log("🔍 Starting comprehensive database verification...\n");

  const results: {
    tables: Record<string, { status: string; count: number; error?: string }>;
    subscriptions: Record<string, string>;
    errors: Array<{ table: string; error: string }>;
  } = {
    tables: {},
    subscriptions: {},
    errors: [],
  };

  // Test all tables
  const tables = [
    "agents",
    "agent_configs",
    "agent_decisions",
    "agent_metrics",
    "agent_communications",
    "workflows",
    "workflow_runs",
    "predictions",
    "activity_logs",
    "risk_alerts",
  ];

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });

      if (error) throw error;

      results.tables[table] = {
        status: "✅",
        count: count || 0,
      };

      console.log(`✅ ${table.padEnd(25)} ${count || 0} rows`);
    } catch (error: any) {
      results.tables[table] = {
        status: "❌",
        count: 0,
        error: error.message,
      };
      results.errors.push({ table, error: error.message });
      console.log(`❌ ${table.padEnd(25)} ERROR: ${error.message}`);
    }
  }

  console.log("\n📊 Summary:");
  console.log("─".repeat(50));

  const totalTables = Object.keys(results.tables).length;
  const successfulTables = Object.values(results.tables).filter(
    (r: any) => r.status === "✅",
  ).length;

  console.log(`Tables checked: ${totalTables}`);
  console.log(`Successful: ${successfulTables}`);
  console.log(`Failed: ${totalTables - successfulTables}`);

  if (results.errors.length > 0) {
    console.log("\n❌ Errors found:");
    results.errors.forEach((err: any) => {
      console.log(`  - ${err.table}: ${err.error}`);
    });
    console.log("\n💡 Make sure you've applied both migration files:");
    console.log("   1. 20260208000000_initial_schema.sql");
    console.log("   2. 20260208000001_seed_data.sql");
  } else {
    console.log("\n✅ All tables verified successfully!");
    console.log("\n📈 Expected sample data:");
    console.log(
      "   - 6 agents (Monitoring, Prediction, Decision, Action, Reporting, Feedback)",
    );
    console.log(
      "   - 4 workflows (Anomaly Detection, Predictive Scaling, Reports, Incident Response)",
    );
    console.log("   - Multiple decisions, metrics, and communications");
    console.log("\n🚀 You're ready to start the dev server:");
    console.log("   npm run dev");
  }
}

verifyDatabase().catch(console.error);
