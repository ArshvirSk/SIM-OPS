import { SlackIntegration } from "@/lib/integrations/slack";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { severity, title, details, data, channel, webhookUrl: customWebhookUrl } = body;

    // Use custom webhook URL if provided (for testing), otherwise use env var
    const webhookUrl = customWebhookUrl || process.env.SLACK_WEBHOOK_URL;

    if (!webhookUrl) {
      return NextResponse.json(
        { error: "Slack integration not configured on server" },
        { status: 501 },
      );
    }

    const slack = new SlackIntegration({ webhookUrl });
    const success = await slack.sendAlert(
      severity || "medium",
      title || "Workflow Alert",
      details || "Automated workflow notification",
      data,
      channel,
    );

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: "Failed to send Slack message" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Slack API Error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 },
    );
  }
}
