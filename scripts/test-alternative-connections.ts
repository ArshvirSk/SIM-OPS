#!/usr/bin/env tsx

/**
 * Test Alternative Connection Methods
 * Tries different approaches to connect to Supabase
 */

import * as dotenv from "dotenv";
import { resolve } from "path";
import * as https from "https";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

console.log("🔧 Testing Alternative Connection Methods\n");
console.log("=".repeat(60));

async function testMethod1_NativeFetch(): Promise<boolean> {
  console.log("\n1️⃣  Method 1: Native Fetch API");
  console.log("─".repeat(60));
  
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: "GET",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
      },
      signal: AbortSignal.timeout(10000),
    });
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`   Headers: ${JSON.stringify(Object.fromEntries(response.headers))}`);
    
    if (response.ok) {
      const text = await response.text();
      console.log(`   Response: ${text.substring(0, 100)}...`);
    }
    
    return true;
  } catch (error: any) {
    console.log(`❌ Failed: ${error.message}`);
    if (error.cause) {
      console.log(`   Cause: ${error.cause.message || error.cause.code}`);
    }
    return false;
  }
}

async function testMethod2_HTTPS(): Promise<boolean> {
  console.log("\n2️⃣  Method 2: Node.js HTTPS Module");
  console.log("─".repeat(60));
  
  return new Promise((resolve) => {
    try {
      const url = new URL(supabaseUrl);
      const options = {
        hostname: url.hostname,
        path: "/rest/v1/",
        method: "GET",
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
        },
        timeout: 10000,
      };
      
      const req = https.request(options, (res) => {
        console.log(`✅ Status: ${res.statusCode}`);
        console.log(`   Headers: ${JSON.stringify(res.headers)}`);
        
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        
        res.on("end", () => {
          console.log(`   Response: ${data.substring(0, 100)}...`);
          resolve(true);
        });
      });
      
      req.on("error", (error: any) => {
        console.log(`❌ Failed: ${error.message}`);
        console.log(`   Code: ${error.code}`);
        resolve(false);
      });
      
      req.on("timeout", () => {
        console.log("❌ Failed: Connection timeout");
        req.destroy();
        resolve(false);
      });
      
      req.end();
    } catch (error: any) {
      console.log(`❌ Failed: ${error.message}`);
      resolve(false);
    }
  });
}

async function testMethod3_WithProxy(): Promise<boolean> {
  console.log("\n3️⃣  Method 3: With Proxy Settings");
  console.log("─".repeat(60));
  
  const httpProxy = process.env.HTTP_PROXY || process.env.http_proxy;
  const httpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  
  if (!httpProxy && !httpsProxy) {
    console.log("ℹ️  No proxy configured");
    console.log("   Set HTTP_PROXY or HTTPS_PROXY environment variable if needed");
    return false;
  }
  
  console.log(`   HTTP Proxy: ${httpProxy || "not set"}`);
  console.log(`   HTTPS Proxy: ${httpsProxy || "not set"}`);
  
  try {
    // Note: fetch doesn't automatically use proxy env vars
    // You'd need a library like node-fetch with proxy support
    console.log("   ℹ️  Proxy support requires additional configuration");
    console.log("   Consider using: npm install https-proxy-agent");
    return false;
  } catch (error: any) {
    console.log(`❌ Failed: ${error.message}`);
    return false;
  }
}

async function testMethod4_DirectIP(): Promise<boolean> {
  console.log("\n4️⃣  Method 4: Direct IP Connection");
  console.log("─".repeat(60));
  
  try {
    // Try connecting directly to the IP
    const ip = "49.44.79.236"; // From DNS resolution
    const response = await fetch(`https://${ip}/rest/v1/`, {
      method: "GET",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Host": new URL(supabaseUrl).hostname,
      },
      signal: AbortSignal.timeout(10000),
    });
    
    console.log(`✅ Status: ${response.status}`);
    return true;
  } catch (error: any) {
    console.log(`❌ Failed: ${error.message}`);
    console.log("   Note: Direct IP may not work due to SSL certificate validation");
    return false;
  }
}

async function testMethod5_SupabaseClient(): Promise<boolean> {
  console.log("\n5️⃣  Method 5: Supabase Client Library");
  console.log("─".repeat(60));
  
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await supabase
      .from("agents")
      .select("count")
      .limit(1);
    
    if (error) {
      if (error.message.includes("relation") || error.message.includes("does not exist")) {
        console.log("✅ Connection successful (tables not found)");
        return true;
      }
      console.log(`❌ Failed: ${error.message}`);
      return false;
    }
    
    console.log("✅ Connection and query successful");
    console.log(`   Data: ${JSON.stringify(data)}`);
    return true;
  } catch (error: any) {
    console.log(`❌ Failed: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  const results: Record<string, boolean> = {
    nativeFetch: false,
    https: false,
    proxy: false,
    directIP: false,
    supabaseClient: false,
  };
  
  results.nativeFetch = await testMethod1_NativeFetch();
  results.https = await testMethod2_HTTPS();
  results.proxy = await testMethod3_WithProxy();
  results.directIP = await testMethod4_DirectIP();
  results.supabaseClient = await testMethod5_SupabaseClient();
  
  console.log("\n" + "=".repeat(60));
  console.log("Summary");
  console.log("=".repeat(60));
  
  const successCount = Object.values(results).filter(Boolean).length;
  const totalTests = Object.values(results).filter(v => v !== null).length;
  
  console.log(`\nTests passed: ${successCount}/${totalTests}`);
  console.log("\nResults:");
  console.log(`  Native Fetch:      ${results.nativeFetch ? "✅" : "❌"}`);
  console.log(`  HTTPS Module:      ${results.https ? "✅" : "❌"}`);
  console.log(`  Proxy:             ${results.proxy ? "✅" : "ℹ️  Not configured"}`);
  console.log(`  Direct IP:         ${results.directIP ? "✅" : "❌"}`);
  console.log(`  Supabase Client:   ${results.supabaseClient ? "✅" : "❌"}`);
  
  if (successCount === 0) {
    console.log("\n❌ All connection methods failed");
    console.log("\n💡 Recommendations:");
    console.log("   1. Check if you're behind a firewall");
    console.log("   2. Try from a different network");
    console.log("   3. Check if VPN is blocking connections");
    console.log("   4. Contact your network administrator");
    console.log("   5. Try using Supabase local development");
  } else if (successCount < totalTests) {
    console.log("\n⚠️  Some connection methods work");
    console.log("   This suggests selective blocking or configuration issues");
  } else {
    console.log("\n✅ All connection methods work!");
    console.log("   Your Supabase connection is fully functional");
  }
  
  console.log("\n");
}

runAllTests().catch(console.error);
