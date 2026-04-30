import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearFakeData() {
  console.log("🗑️  Connecting to Supabase to clear ALL data...");

  try {
    // Delete all dependent tables first to avoid FK constraints
    console.log("Clearing agent decisions...");
    await supabase.from("agent_decisions").delete().not("id", "is", null);

    console.log("Clearing risk alerts...");
    await supabase.from("risk_alerts").delete().not("id", "is", null);

    console.log("Clearing activity logs...");
    await supabase.from("activity_logs").delete().not("id", "is", null);

    console.log("Clearing ML predictions...");
    await supabase.from("ml_predictions").delete().not("id", "is", null);

    console.log("Clearing transactions...");
    await supabase.from("transactions").delete().not("id", "is", null);

    console.log("Clearing incidents...");
    await supabase.from("incidents").delete().not("id", "is", null);

    console.log("Clearing ALL customers...");
    const { error: customerError } = await supabase
      .from("customers")
      .delete()
      .not("id", "is", null);
    if (customerError) {
      console.error("Error clearing customers:", customerError);
    } else {
      console.log("Deleted all customers.");
    }

    console.log("✅ All data successfully cleared.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to clear data:", error);
    process.exit(1);
  }
}

clearFakeData();
