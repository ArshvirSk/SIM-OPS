#!/usr/bin/env tsx

/**
 * Detailed Connection Diagnostic
 * Helps identify the exact cause of connection failures
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";
import * as https from "https";
import * as dns from "dns";
import { promisify } from "util";

const dnsResolve = promisify(dns.resolve);

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

console.log("🔍 Supabase Connection Diagnostics\n");
console.log("=".repeat(60));

async function runDiagnostics() {
  // Test 1: Environment Variables
  console.log("\n1️⃣  Environment Variables");
  console.log("─".repeat(60));
  
  if (!supabaseUrl || !supabaseKey) {
    console.log("❌ Missing credentials");
    return;
  }
  
  console.log(`✅ URL: ${supabaseUrl}`);
  console.log(`✅ Key: ${supabaseKey.substring(0, 30)}...`);
  console.log(`   Length: ${supabaseKey.length} characters`);

  // Test 2: URL Format
  console.log("\n2️⃣  URL Format Validation");
  console.log("─".repeat(60));
  
  try {
    const url = new URL(supabaseUrl);
    console.log(`✅ Protocol: ${url.protocol}`);
    console.log(`✅ Hostname: ${url.hostname}`);
    console.log(`✅ Project ID: ${url.hostname.split('.')[0]}`);
  } catch (error: any) {
    console.log(`❌ Invalid URL format: ${error.message}`);
    return;
  }

  // Test 3: DNS Resolution
  console.log("\n3️⃣  DNS Resolution");
  console.log("─".repeat(60));
  
  try {
    const hostname = new URL(supabaseUrl).hostname;
    const addresses = await dnsResolve(hostname);
    console.log(`✅ DNS resolves to: ${addresses.join(", ")}`);
  } catch (error: any) {
    console.log(`❌ DNS resolution failed: ${error.message}`);
    console.log("   This could indicate:");
    console.log("   - No internet connection");
    console.log("   - DNS server issues");
    console.log("   - Firewall blocking DNS");
    return;
  }

  // Test 4: HTTPS Connectivity
  console.log("\n4️⃣  HTTPS Connectivity");
  console.log("─".repeat(60));
  
  try {
    await new Promise((resolve, reject) => {
      const url = new URL(supabaseUrl);
      const req = https.get({
        hostname: url.hostname,
        path: "/",
        timeout: 5000,
      }, (res) => {
        console.log(`✅ HTTPS connection successful`);
        console.log(`   Status: ${res.statusCode}`);
        resolve(res);
      });
      
      req.on("error", reject);
      req.on("timeout", () => {
        req.destroy();
        reject(new Error("Connection timeout"));
      });
    });
  } catch (error: any) {
    console.log(`❌ HTTPS connection failed: ${error.message}`);
    console.log("   This could indicate:");
    console.log("   - Firewall blocking HTTPS");
    console.log("   - Proxy configuration needed");
    console.log("   - Network restrictions");
    return;
  }

  // Test 5: Supabase REST API
  console.log("\n5️⃣  Supabase REST API");
  console.log("─".repeat(60));
  
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
      },
    });
    
    console.log(`✅ REST API accessible`);
    console.log(`   Status: ${response.status}`);
    
    if (response.status === 401) {
      console.log("   ⚠️  Authentication failed - key may be invalid");
    } else if (response.status === 404) {
      console.log("   ⚠️  Endpoint not found - URL may be incorrect");
    }
  } catch (error: any) {
    console.log(`❌ REST API request failed: ${error.message}`);
    console.log(`   Error code: ${error.code || "unknown"}`);
    
    if (error.cause) {
      console.log(`   Cause: ${error.cause.message || error.cause}`);
    }
    
    return;
  }

  // Test 6: Supabase Client
  console.log("\n6️⃣  Supabase Client Connection");
  console.log("─".repeat(60));
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Try a simple query
    const { data, error } = await supabase
      .from("agents")
      .select("count")
      .limit(1);
    
    if (error) {
      if (error.message.includes("relation") || error.message.includes("does not exist")) {
        console.log("✅ Connection successful!");
        console.log("   ⚠️  Tables not found - run database setup");
      } else {
        console.log(`❌ Query failed: ${error.message}`);
        console.log(`   Code: ${error.code}`);
      }
    } else {
      console.log("✅ Connection and query successful!");
      console.log(`   Data: ${JSON.stringify(data)}`);
    }
  } catch (error: any) {
    console.log(`❌ Client connection failed: ${error.message}`);
  }

  // Test 7: Project Status
  console.log("\n7️⃣  Project Status Check");
  console.log("─".repeat(60));
  console.log("   Please verify manually:");
  console.log(`   1. Go to: https://supabase.com/dashboard/project/cqkixjoqanyjrxveycaa`);
  console.log("   2. Check if project status is 'Active' (not paused)");
  console.log("   3. Verify the API key in Settings → API");

  console.log("\n" + "=".repeat(60));
  console.log("Diagnostics Complete\n");
}

runDiagnostics().catch((error) => {
  console.error("\n💥 Diagnostic failed:", error);
  process.exit(1);
});
