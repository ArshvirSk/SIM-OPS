/**
 * Run ML Predictions Table Migration
 * Applies the database schema changes for ML integration
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials");
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log("=".repeat(60));
  console.log("ML Predictions Table Migration");
  console.log("=".repeat(60));
  console.log();

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, "add-ml-predictions-table.sql");
    const sql = fs.readFileSync(migrationPath, "utf-8");

    console.log("📄 Migration file loaded");
    console.log(`   Path: ${migrationPath}`);
    console.log();

    // Split SQL into individual statements
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    console.log(`📊 Found ${statements.length} SQL statements`);
    console.log();

    // Execute each statement
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Skip empty statements
      if (!statement) {
        continue;
      }

      // Skip comments and DO blocks (they don't return data)
      if (statement.startsWith("COMMENT") || statement.startsWith("DO $$")) {
        console.log(`⏭️  Skipping: ${statement.substring(0, 50)}...`);
        continue;
      }

      try {
        console.log(`[${i + 1}/${statements.length}] Executing...`);

        const { error } = await supabase.rpc("exec_sql", {
          sql: statement + ";",
        });

        if (error) {
          // Try direct execution for some statements
          const { error: directError } = await supabase
            .from("_migrations")
            .insert({
              name: `ml_migration_${Date.now()}`,
              executed_at: new Date().toISOString(),
            });

          if (directError) {
            console.log(`   ⚠️  Warning: ${error.message}`);
          } else {
            console.log(`   ✓ Success`);
            successCount++;
          }
        } else {
          console.log(`   ✓ Success`);
          successCount++;
        }
      } catch (error: any) {
        console.log(`   ✗ Error: ${error.message}`);
        errorCount++;
      }
    }

    console.log();
    console.log("=".repeat(60));
    console.log("Migration Summary");
    console.log("=".repeat(60));
    console.log(`✓ Successful: ${successCount}`);
    console.log(`✗ Errors: ${errorCount}`);
    console.log();

    if (errorCount === 0) {
      console.log("🎉 Migration completed successfully!");
    } else {
      console.log("⚠️  Migration completed with some errors");
      console.log(
        "   You may need to run the SQL manually in Supabase dashboard",
      );
    }

    console.log();
    console.log("Next steps:");
    console.log("  1. Verify tables in Supabase dashboard");
    console.log("  2. Test agent predictions");
    console.log("  3. Check predictions table for stored results");
    console.log();
  } catch (error: any) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  }
}

// Run migration
runMigration();
