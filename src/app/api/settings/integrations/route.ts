import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

interface IntegrationConfig {
  id: string;
  enabled: boolean;
  config: Record<string, string>;
}

interface SaveRequest {
  integrations: IntegrationConfig[];
}

/**
 * GET /api/settings/integrations
 * Load current integration settings from environment
 */
export async function GET() {
  try {
    // Read current environment variables
    const integrations: IntegrationConfig[] = [];

    // Resend (Email)
    integrations.push({
      id: "resend",
      enabled: !!process.env.RESEND_API_KEY,
      config: {
        apiKey: process.env.RESEND_API_KEY || "",
        emailTo: process.env.EMAIL_TO || "",
        emailFrom: process.env.EMAIL_FROM || "onboarding@resend.dev",
        emailFromName: process.env.EMAIL_FROM_NAME || "SIM-OPS Agent Alerts",
      },
    });

    // Slack
    integrations.push({
      id: "slack",
      enabled: !!process.env.SLACK_WEBHOOK_URL,
      config: {
        webhookUrl: process.env.SLACK_WEBHOOK_URL || "",
      },
    });

    // Stripe
    integrations.push({
      id: "stripe",
      enabled: !!process.env.STRIPE_API_KEY,
      config: {
        apiKey: process.env.STRIPE_API_KEY || "",
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
      },
    });

    return NextResponse.json({ integrations });
  } catch (error: any) {
    console.error("Failed to load integrations:", error);
    return NextResponse.json(
      { error: "Failed to load integrations" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings/integrations
 * Save integration settings to .env.local
 */
export async function POST(request: NextRequest) {
  try {
    const body: SaveRequest = await request.json();
    const { integrations } = body;

    // Path to .env.local
    const envPath = path.join(process.cwd(), ".env.local");

    // Read current .env.local
    let envContent = "";
    try {
      envContent = fs.readFileSync(envPath, "utf-8");
    } catch (error) {
      // File doesn't exist, create new
      envContent = "";
    }

    // Parse existing env vars
    const envVars = new Map<string, string>();
    envContent.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...valueParts] = trimmed.split("=");
        if (key) {
          envVars.set(key.trim(), valueParts.join("=").trim());
        }
      }
    });

    // Update env vars based on integrations
    integrations.forEach((integration) => {
      if (integration.id === "resend") {
        if (integration.enabled) {
          envVars.set("RESEND_API_KEY", `"${integration.config.apiKey}"`);
          envVars.set("EMAIL_TO", `"${integration.config.emailTo}"`);
          envVars.set("EMAIL_FROM", `"${integration.config.emailFrom}"`);
          envVars.set("EMAIL_FROM_NAME", `"${integration.config.emailFromName}"`);
        } else {
          // Keep the values but could optionally remove them
          // For now, we'll keep them so they can be re-enabled
        }
      } else if (integration.id === "slack") {
        if (integration.enabled) {
          envVars.set("SLACK_WEBHOOK_URL", `"${integration.config.webhookUrl}"`);
        }
      } else if (integration.id === "stripe") {
        if (integration.enabled) {
          envVars.set("STRIPE_API_KEY", `"${integration.config.apiKey}"`);
          if (integration.config.webhookSecret) {
            envVars.set("STRIPE_WEBHOOK_SECRET", `"${integration.config.webhookSecret}"`);
          }
        }
      }
    });

    // Rebuild .env.local content
    const lines: string[] = [];
    
    // Add header comment
    lines.push("# Supabase Configuration");
    lines.push("# IMPORTANT: Replace these with your actual Supabase credentials");
    lines.push("# Get them from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api");
    lines.push("");

    // Add Supabase vars (preserve existing)
    if (envVars.has("NEXT_PUBLIC_SUPABASE_URL")) {
      lines.push(`NEXT_PUBLIC_SUPABASE_URL=${envVars.get("NEXT_PUBLIC_SUPABASE_URL")}`);
    }
    if (envVars.has("NEXT_PUBLIC_SUPABASE_ANON_KEY")) {
      lines.push(`NEXT_PUBLIC_SUPABASE_ANON_KEY=${envVars.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")}`);
    }
    if (envVars.has("NEXT_PUBLIC_ML_SERVICE_URL")) {
      lines.push(`NEXT_PUBLIC_ML_SERVICE_URL=${envVars.get("NEXT_PUBLIC_ML_SERVICE_URL")}`);
    }
    lines.push("");

    // Add Database URL
    lines.push("# Database Connection (for direct access if needed)");
    if (envVars.has("DATABASE_URL")) {
      lines.push(`DATABASE_URL=${envVars.get("DATABASE_URL")}`);
    }
    lines.push("");

    // Add Google AI API Key
    if (envVars.has("GOOGLE_AI_API_KEY")) {
      lines.push(`GOOGLE_AI_API_KEY=${envVars.get("GOOGLE_AI_API_KEY")}`);
    }
    lines.push("");

    // Add Cron Secret
    if (envVars.has("CRON_SECRET")) {
      lines.push("# NEW - Add this line");
      lines.push(`CRON_SECRET=${envVars.get("CRON_SECRET")}`);
      lines.push("");
    }

    // Add Slack
    lines.push("# Slack Integration");
    if (envVars.has("SLACK_WEBHOOK_URL")) {
      lines.push(`SLACK_WEBHOOK_URL=${envVars.get("SLACK_WEBHOOK_URL")}`);
    }
    lines.push("");

    // Add Resend
    lines.push("# Resend Email Integration");
    if (envVars.has("RESEND_API_KEY")) {
      lines.push(`RESEND_API_KEY=${envVars.get("RESEND_API_KEY")}`);
    }
    lines.push("");

    // Add Email Configuration
    lines.push("# Email Configuration");
    if (envVars.has("EMAIL_TO")) {
      lines.push(`EMAIL_TO=${envVars.get("EMAIL_TO")}`);
    }
    if (envVars.has("EMAIL_FROM")) {
      lines.push(`EMAIL_FROM=${envVars.get("EMAIL_FROM")}`);
    }
    if (envVars.has("EMAIL_FROM_NAME")) {
      lines.push(`EMAIL_FROM_NAME=${envVars.get("EMAIL_FROM_NAME")}`);
    }
    lines.push("");

    // Add Stripe
    if (envVars.has("STRIPE_API_KEY")) {
      lines.push("# Stripe Integration");
      lines.push(`STRIPE_API_KEY=${envVars.get("STRIPE_API_KEY")}`);
      if (envVars.has("STRIPE_WEBHOOK_SECRET")) {
        lines.push(`STRIPE_WEBHOOK_SECRET=${envVars.get("STRIPE_WEBHOOK_SECRET")}`);
      }
      lines.push("");
    }

    // Write back to .env.local
    fs.writeFileSync(envPath, lines.join("\n"));

    // Note: Environment variables are only loaded at server start
    // The user will need to restart the dev server for changes to take effect
    return NextResponse.json({
      success: true,
      message: "Settings saved. Please restart your dev server for changes to take effect.",
      requiresRestart: true,
    });
  } catch (error: any) {
    console.error("Failed to save integrations:", error);
    return NextResponse.json(
      { error: "Failed to save integrations", details: error.message },
      { status: 500 }
    );
  }
}
