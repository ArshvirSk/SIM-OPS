#!/usr/bin/env tsx

/**
 * Test Supabase Connection
 *
 * This script tests your Supabase connection and verifies the database setup.
 * Run with: npx tsx scripts/test-supabase-connection.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("🔍 Testing Supabase Connection...\n");

// Check if credentials are configured
if (!supabaseUrl || !supabaseKey) {
  console.error("❌ ERROR: Supabase credentials not found in .env.local");
  console.log("\nPlease set the following in your .env.local file:");
  console.log('  NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"');
  console.log(
    '  NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"\n',
  );
  process.exit(1);
}

// Check if using placeholder values
if (
  supabaseUrl.includes("your-project-id") ||
  supabaseKey.includes("your-anon-key")
) {
  console.error("❌ ERROR: Using placeholder Supabase credentials");
  console.log(
    "\nPlease replace the placeholder values in .env.local with your actual credentials.",
  );
  console.log(
    "Get them from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api\n",
  );
  process.exit(1);
}

console.log("📋 Configuration:");
console.log(`   URL: ${supabaseUrl}`);
console.log(`   Key: ${supabaseKey.substring(0, 20)}...`);
console.log("");

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Test 1: Basic connection
    console.log("1️⃣  Testing basic connection...");
    const { data, error: healthError } = await supabase
      .from("agents")
      .select("count")
      .limit(1);

    if (healthError) {
      if (
        healthError.message.includes("relation") ||
        healthError.message.includes("does not exist")
      ) {
        console.log("   ⚠️  Connection successful, but tables not found");
        console.log("   💡 Run the database setup: npm run db:setup\n");
        return false;
      }
      throw healthError;
    }

    console.log("   ✅ Connection successful!\n");

    // Test 2: Check tables exist
    console.log("2️⃣  Checking database tables...");
  const tables = [
    "agents",
    "agent_configs",
    "agent_decisions",
    "agent_metrics",
    "agent_communications",
    "workflows",
    "predictions",
    "activity_logs",
  ];

  let allTablesExist = true;
  for (const table of tables) {
    const { error } = await supabase.from(table).select("count").limit(1);
    if (error) {
      console.log(`   ❌ Table '${table}' not found`);
      allTablesExist = false;
    } else {
      console.log(`   ✅ Table '${table}' exists`);
    }
  }

  if (!allTablesExist) {
    console.log("\n   💡 Some tables are missing. Run: npm run db:setup\n");
    return false;
  }

  console.log("");

  // Test 3: Check for data
  console.log("3️⃣  Checking for sample data...");
  const { data: agents, error: agentsError } = await supabase
    .from("agents")
    .select("id, name, status");

  if (agentsError) throw agentsError;

  if (!agents || agents.length === 0) {
    console.log("   ⚠️  No agents found in database");
    console.log(
      "   💡 You may want to seed sample data (see docs/SUPABASE_SETUP.md)\n",
    );
  } else {
    console.log(`   ✅ Found ${agents.length} agent(s):`);
    agents.forEach((agent) => {
      console.log(`      - ${agent.name} (${agent.status})`);
    });
    console.log("");
  }

  // Test 4: Test auth
  console.log("4️⃣  Testing authentication...");
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    console.log("   ⚠️  No user session (this is normal for development)");
  } else if (user) {
    console.log(`   ✅ Authenticated as: ${user.email}`);
  } else {
    console.log("   ℹ️  No active user session");
  }

  console.log("");
  console.log("🎉 All tests passed! Your Supabase setup is ready.\n");
  return true;
  } catch (error: any) {
    console.error("\n❌ Connection test failed:");
    console.error(`   ${error.message}\n`);

    if (error.message && error.message.includes("fetch")) {
      console.log("💡 Troubleshooting tips:");
      console.log("   1. Check your internet connection");
      console.log("   2. Verify your Supabase project is active");
      console.log("   3. Confirm the URL and key are correct");
      console.log("   4. Check if you're behind a firewall/proxy\n");
    }

    return false;
  }
}

testConnection()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("\n💥 Unexpected error:");
    console.error(error);
    process.exit(1);
  });
