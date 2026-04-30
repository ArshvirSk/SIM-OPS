/**
 * Database Setup Script
 * Applies migrations and seeds data to Supabase
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { readFileSync } from "fs";
import { join } from "path";

// Load environment variables
config({ path: join(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  console.log("🚀 Starting database setup...\n");

  try {
    // Read migration files
    const schemaSQL = readFileSync(
      join(
        process.cwd(),
        "supabase/migrations/20260208000000_initial_schema.sql",
      ),
      "utf-8",
    );

    const seedSQL = readFileSync(
      join(process.cwd(), "supabase/migrations/20260208000001_seed_data.sql"),
      "utf-8",
    );

    console.log("📖 Read migration files");

    // Note: Direct SQL execution requires service_role key
    // For now, let's verify connection and provide instructions
    const { data, error } = await supabase.from("agents").select("count");

    if (error && error.message.includes("does not exist")) {
      console.log("\n⚠️  Database tables don't exist yet.\n");
      console.log("📝 To set up the database, follow these steps:\n");
      console.log(
        "1. Go to https://supabase.com/dashboard/project/xiyygwentloatlmpiszj/editor",
      );
      console.log("2. Click on 'SQL Editor' in the left sidebar");
      console.log("3. Click 'New Query'");
      console.log("4. Copy and paste the contents of:");
      console.log("   - supabase/migrations/20260208000000_initial_schema.sql");
      console.log("5. Click 'Run' to create the schema");
      console.log("6. Repeat for seed_data.sql to populate sample data\n");
      console.log("Or use Supabase CLI:");
      console.log("  npx supabase link --project-ref xiyygwentloatlmpiszj");
      console.log("  npx supabase db push\n");
    } else if (error) {
      console.error("❌ Error checking database:", error.message);
    } else {
      console.log("✅ Database connection successful!");
      console.log(`📊 Found ${data?.[0]?.count || 0} agents in database`);
    }
  } catch (error) {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  }
}

setupDatabase();
