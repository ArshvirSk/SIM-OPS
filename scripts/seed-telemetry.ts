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

// Helper to generate realistic random waves
const generateWave = (
  i: number,
  base: number,
  variance: number,
  frequency: number,
) => {
  return Math.round(
    base + Math.sin(i * frequency) * variance + Math.random() * variance * 0.5,
  );
};

async function seedContinuousTelemetry() {
  try {
    console.log("🌊 Starting continuous telemetry seeding into Supabase...");
    console.log(`🔗 Connecting to: ${supabaseUrl}`);

    // First ensure we have some agents to bind metrics to
    const result = await supabase.from("agents").select("id").limit(10);
    console.log("📡 Raw Agents Response:", JSON.stringify(result, null, 2));
    const { data: agents, error: agentsError } = result;

    if (agentsError) {
      console.error("❌ Error fetching agents:", agentsError.message);
      process.exit(1);
    }

    if (!agents || agents.length === 0) {
      console.error(
        "❌ No agents found. Please ensure agents were inserted into the 'agents' table.",
      );
      process.exit(1);
    }

    // Generate 7 days of predictions history
    console.log("📊 Seeding predictions history...");
    const predictions = [];
    const now = new Date();

    for (let i = 0; i < 24 * 7; i++) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);

      // Revenue Wave
      predictions.push({
        type: "revenue",
        input_data: { period: "hourly_forecast" },
        prediction: {
          forecast: generateWave(i, 292000, 16000, 0.1),
          actual: generateWave(i, 290000, 15000, 0.1),
        },
        confidence: 0.85 + Math.random() * 0.1,
        created_at: timestamp.toISOString(),
      });

      // CPU Usage
      predictions.push({
        type: "cost_anomaly",
        input_data: {
          resource: "compute",
          current: generateWave(i, 45, 20, 0.5),
        },
        prediction: {
          expected: generateWave(i, 48, 18, 0.5),
          anomaly_score: 0.85,
        },
        confidence: 0.75 + Math.random() * 0.2,
        created_at: timestamp.toISOString(),
      });
    }

    const { error: predError } = await supabase
      .from("predictions")
      .insert(predictions);
    if (predError)
      console.error("Failed to insert predictions:", predError.message);
    else console.log("✅ Inserted", predictions.length, "predictions");

    // Generate Agent Metrics History
    console.log("📈 Seeding Agent Metrics...");
    const metrics = [];

    for (const agent of agents) {
      for (let i = 0; i < 24; i++) {
        const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
        metrics.push({
          agent_id: agent.id,
          metric_name: "success_rate",
          metric_value: generateWave(i, 90, 5, 0.2),
          recorded_at: timestamp.toISOString(),
        });
        metrics.push({
          agent_id: agent.id,
          metric_name: "decisions_per_hour",
          metric_value: generateWave(i, 50, 40, 0.3),
          recorded_at: timestamp.toISOString(),
        });
      }
    }

    const { error: metricsError } = await supabase
      .from("agent_metrics")
      .insert(metrics);
    if (metricsError)
      console.error("Failed to insert metrics:", metricsError.message);
    else console.log("✅ Inserted", metrics.length, "agent metrics");

    console.log(
      "🎉 Seeding complete! The machine learning models now have realistic wave patterns to train against.",
    );
  } catch (err: any) {
    console.error("💥 GLOBAL ERROR:", err);
    process.exit(1);
  }
}

seedContinuousTelemetry();
