#!/usr/bin/env tsx
/**
 * Apply ML Predictions Migration
 * Runs the ml_predictions table migration
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

async function applyMigration() {
    console.log("🚀 Applying ML Predictions Migration...\n");

    try {
        // Read migration file
        const migrationSQL = readFileSync(
            join(process.cwd(), "supabase/migrations/20260302000000_add_ml_predictions.sql"),
            "utf-8"
        );

        console.log("📖 Read migration file");
        console.log("\n⚠️  NOTE: This script requires service_role key for DDL operations.");
        console.log("Please run this SQL manually in Supabase SQL Editor:\n");
        console.log("1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql");
        console.log("2. Click 'New Query'");
        console.log("3. Copy and paste the migration SQL");
        console.log("4. Click 'Run'\n");
        console.log("Migration SQL location:");
        console.log("  supabase/migrations/20260302000000_add_ml_predictions.sql\n");

        // Test if table exists after manual migration
        const { data, error } = await supabase.from("ml_predictions").select("count");

        if (!error) {
            console.log("✅ ml_predictions table exists!");
            console.log("✅ Migration successfully applied\n");
        } else if (error.message.includes("does not exist")) {
            console.log("⏳ Table not found yet. Please apply the migration manually.\n");
        } else {
            console.log(`ℹ️  Table check: ${error.message}\n`);
        }

        // Check if ml_config column was added to agents
        const { data: agents, error: agentsError } = await supabase
            .from("agents")
            .select("id, ml_config")
            .limit(1);

        if (!agentsError) {
            console.log("✅ ml_config column added to agents table");
        }

    } catch (error: unknown) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
}

applyMigration();
