#!/usr/bin/env tsx

/**
 * Environment Validation Script
 * Checks if all required environment variables are properly configured
 */

import * as dotenv from "dotenv";
import { resolve } from "path";

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

console.log("🔍 Validating Environment Configuration...\n");

interface ValidationResult {
  name: string;
  value: string | undefined;
  valid: boolean;
  message: string;
}

const results: ValidationResult[] = [];

// Check NEXT_PUBLIC_SUPABASE_URL
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!supabaseUrl) {
  results.push({
    name: "NEXT_PUBLIC_SUPABASE_URL",
    value: undefined,
    valid: false,
    message: "❌ Missing - Add to .env.local",
  });
} else if (supabaseUrl.includes("your-project-id")) {
  results.push({
    name: "NEXT_PUBLIC_SUPABASE_URL",
    value: supabaseUrl,
    valid: false,
    message: "❌ Using placeholder - Replace with actual URL",
  });
} else if (!supabaseUrl.startsWith("https://") || !supabaseUrl.includes(".supabase.co")) {
  results.push({
    name: "NEXT_PUBLIC_SUPABASE_URL",
    value: supabaseUrl,
    valid: false,
    message: "❌ Invalid format - Should be https://xxx.supabase.co",
  });
} else {
  results.push({
    name: "NEXT_PUBLIC_SUPABASE_URL",
    value: supabaseUrl,
    valid: true,
    message: "✅ Valid",
  });
}

// Check NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseKey) {
  results.push({
    name: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    value: undefined,
    valid: false,
    message: "❌ Missing - Add to .env.local",
  });
} else if (supabaseKey.includes("your-anon-key") || supabaseKey.includes("placeholder")) {
  results.push({
    name: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    value: supabaseKey.substring(0, 20) + "...",
    valid: false,
    message: "❌ Using placeholder - Replace with actual anon key",
  });
} else if (!supabaseKey.startsWith("eyJ")) {
  results.push({
    name: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    value: supabaseKey.substring(0, 20) + "...",
    valid: false,
    message: "❌ Invalid format - Should be a JWT token starting with 'eyJ'",
  });
} else if (supabaseKey.length < 100) {
  results.push({
    name: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    value: supabaseKey.substring(0, 20) + "...",
    valid: false,
    message: "❌ Too short - Anon key should be much longer",
  });
} else {
  results.push({
    name: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    value: supabaseKey.substring(0, 20) + "...",
    valid: true,
    message: "✅ Valid format",
  });
}

// Check for old variable name (should not exist)
const oldKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (oldKey) {
  results.push({
    name: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    value: oldKey.substring(0, 20) + "...",
    valid: false,
    message: "⚠️  Old variable name found - Remove from .env.local",
  });
}

// Check ML Service URL (optional)
const mlServiceUrl = process.env.NEXT_PUBLIC_ML_SERVICE_URL;
if (mlServiceUrl) {
  results.push({
    name: "NEXT_PUBLIC_ML_SERVICE_URL",
    value: mlServiceUrl,
    valid: true,
    message: "✅ Configured",
  });
} else {
  results.push({
    name: "NEXT_PUBLIC_ML_SERVICE_URL",
    value: undefined,
    valid: true,
    message: "ℹ️  Optional - Not configured",
  });
}

// Print results
console.log("Environment Variables:");
console.log("─".repeat(80));

results.forEach((result) => {
  console.log(`\n${result.name}`);
  if (result.value) {
    console.log(`  Value: ${result.value}`);
  }
  console.log(`  ${result.message}`);
});

console.log("\n" + "─".repeat(80));

// Summary
const validCount = results.filter((r) => r.valid).length;
const invalidCount = results.filter((r) => !r.valid).length;
const requiredInvalid = results.filter(
  (r) => !r.valid && r.name.includes("SUPABASE")
).length;

console.log("\nSummary:");
console.log(`  ✅ Valid: ${validCount}`);
console.log(`  ❌ Invalid: ${invalidCount}`);

if (requiredInvalid > 0) {
  console.log("\n❌ Configuration is INCOMPLETE");
  console.log("\n📝 Next Steps:");
  console.log("  1. Go to https://supabase.com/dashboard");
  console.log("  2. Select your project");
  console.log("  3. Go to Settings → API");
  console.log("  4. Copy the anon/public key");
  console.log("  5. Update .env.local with the actual key");
  console.log("  6. Run this script again to verify");
  console.log("\nSee QUICK_FIX_INSTRUCTIONS.md for detailed steps.");
  process.exit(1);
} else {
  console.log("\n✅ Configuration looks good!");
  console.log("\n🧪 Test your connection:");
  console.log("  npx tsx scripts/test-supabase-connection.ts");
  process.exit(0);
}
