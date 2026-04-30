/**
 * Seed Customer Data for ML Predictions
 * Run this to populate the database with sample customers
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
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

// Helper functions
const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min: number, max: number) =>
  Math.random() * (max - min) + min;
const randomDate = (daysAgo: number) => {
  const date = new Date();
  date.setDate(date.getDate() - randomInt(0, daysAgo));
  return date.toISOString();
};

async function seedCustomers() {
  try {
    console.log("👥 Starting customer seeding...");
    console.log(`🔗 Connecting to: ${supabaseUrl}`);

    // Check if customers table exists and has data
    const { data: existingCustomers, error: checkError } = await supabase
      .from("customers")
      .select("id")
      .limit(1);

    if (checkError) {
      console.error("❌ Error checking customers table:", checkError.message);
      console.log("\n💡 Make sure the customers table exists in your database.");
      console.log("   Run the database migration first if needed.");
      process.exit(1);
    }

    // Generate 50 diverse customers
    const customers = [];
    const now = new Date();

    for (let i = 0; i < 50; i++) {
      const customerId = `cust_${String(i + 1).padStart(4, "0")}`;
      const signupDaysAgo = randomInt(30, 730); // 1 month to 2 years ago
      const lastActivityDaysAgo = randomInt(0, 60);

      // Create diverse customer profiles
      const profile = generateCustomerProfile(i);

      customers.push({
        id: customerId,
        email: `customer${i + 1}@example.com`,
        name: `Customer ${i + 1}`,
        signup_date: randomDate(signupDaysAgo),
        last_activity: randomDate(lastActivityDaysAgo),
        subscription_tier: profile.tier,
        mrr: profile.mrr,
        total_spend: profile.totalSpend,
        support_tickets: profile.supportTickets,
        payment_failures: profile.paymentFailures,
        feature_usage_rate: profile.featureUsage,
        engagement_score: profile.engagement,
        nps_score: profile.nps,
        contract_length_days: profile.contractLength,
        referrals_made: profile.referrals,
        last_login: randomDate(lastActivityDaysAgo),
        created_at: randomDate(signupDaysAgo),
        updated_at: now.toISOString(),
      });
    }

    // Insert customers
    const { error: insertError } = await supabase
      .from("customers")
      .insert(customers);

    if (insertError) {
      console.error("❌ Error inserting customers:", insertError.message);
      process.exit(1);
    }

    console.log(`✅ Successfully seeded ${customers.length} customers`);

    // Show summary
    const highRisk = customers.filter(
      (c) => c.engagement_score < 0.4 || c.payment_failures > 2,
    ).length;
    const mediumRisk = customers.filter(
      (c) =>
        c.engagement_score >= 0.4 &&
        c.engagement_score < 0.7 &&
        c.payment_failures <= 2,
    ).length;
    const lowRisk = customers.length - highRisk - mediumRisk;

    console.log("\n📊 Customer Distribution:");
    console.log(`   - High Risk: ${highRisk} customers`);
    console.log(`   - Medium Risk: ${mediumRisk} customers`);
    console.log(`   - Low Risk: ${lowRisk} customers`);

    console.log("\n💰 Revenue Distribution:");
    const totalMRR = customers.reduce((sum, c) => sum + c.mrr, 0);
    console.log(`   - Total MRR: $${totalMRR.toLocaleString()}`);
    console.log(
      `   - Average MRR: $${(totalMRR / customers.length).toFixed(2)}`,
    );

    console.log("\n🎉 Customer seeding complete!");
    console.log("\n📝 Next steps:");
    console.log("   1. Run prediction cron: npm run cron:predictions");
    console.log("   2. Or trigger via API: POST /api/cron/predictions");
    console.log("   3. View results in dashboard: http://localhost:3000");
  } catch (err: any) {
    console.error("💥 Error:", err.message);
    process.exit(1);
  }
}

/**
 * Generate diverse customer profiles
 */
function generateCustomerProfile(index: number) {
  // Create different customer segments
  const segment = index % 5;

  switch (segment) {
    case 0: // High-value, engaged customers (20%)
      return {
        tier: "enterprise",
        mrr: randomInt(500, 2000),
        totalSpend: randomInt(10000, 50000),
        supportTickets: randomInt(0, 2),
        paymentFailures: 0,
        featureUsage: randomFloat(0.7, 1.0),
        engagement: randomFloat(0.8, 1.0),
        nps: randomInt(8, 10),
        contractLength: randomInt(365, 730),
        referrals: randomInt(2, 10),
      };

    case 1: // Medium-value, stable customers (20%)
      return {
        tier: "professional",
        mrr: randomInt(200, 500),
        totalSpend: randomInt(5000, 15000),
        supportTickets: randomInt(1, 4),
        paymentFailures: randomInt(0, 1),
        featureUsage: randomFloat(0.5, 0.8),
        engagement: randomFloat(0.6, 0.8),
        nps: randomInt(6, 8),
        contractLength: randomInt(180, 365),
        referrals: randomInt(0, 3),
      };

    case 2: // Low-value, at-risk customers (20%)
      return {
        tier: "basic",
        mrr: randomInt(50, 200),
        totalSpend: randomInt(500, 3000),
        supportTickets: randomInt(3, 8),
        paymentFailures: randomInt(1, 3),
        featureUsage: randomFloat(0.2, 0.5),
        engagement: randomFloat(0.2, 0.5),
        nps: randomInt(3, 6),
        contractLength: randomInt(30, 180),
        referrals: 0,
      };

    case 3: // New customers, uncertain (20%)
      return {
        tier: randomInt(0, 1) === 0 ? "basic" : "professional",
        mrr: randomInt(100, 400),
        totalSpend: randomInt(100, 1000),
        supportTickets: randomInt(0, 3),
        paymentFailures: 0,
        featureUsage: randomFloat(0.4, 0.7),
        engagement: randomFloat(0.5, 0.8),
        nps: randomInt(5, 8),
        contractLength: randomInt(30, 90),
        referrals: randomInt(0, 1),
      };

    case 4: // Churning customers (20%)
      return {
        tier: "basic",
        mrr: randomInt(50, 150),
        totalSpend: randomInt(200, 2000),
        supportTickets: randomInt(5, 12),
        paymentFailures: randomInt(2, 5),
        featureUsage: randomFloat(0.1, 0.3),
        engagement: randomFloat(0.1, 0.4),
        nps: randomInt(1, 4),
        contractLength: randomInt(30, 180),
        referrals: 0,
      };

    default:
      return {
        tier: "basic",
        mrr: 100,
        totalSpend: 1000,
        supportTickets: 2,
        paymentFailures: 0,
        featureUsage: 0.5,
        engagement: 0.5,
        nps: 7,
        contractLength: 180,
        referrals: 1,
      };
  }
}

// Run the seeding
seedCustomers();
