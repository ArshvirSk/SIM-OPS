import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "..", ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log("🔍 Checking database data...\n");

  // Try to query agents
  const { data, error } = await supabase
    .from("agents")
    .select("id, name, role, status")
    .limit(10);

  if (error) {
    console.error("❌ Error querying agents:", error.message);
    console.error("Details:", error);
  } else {
    console.log(`✅ Found ${data?.length || 0} agents:`);
    data?.forEach((agent) => {
      console.log(`   - ${agent.name} (${agent.role}) - ${agent.status}`);
    });
  }
}

checkData();
