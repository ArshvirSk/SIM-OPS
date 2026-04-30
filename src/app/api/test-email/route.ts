import { EmailIntegration, getEmailConfig } from "@/lib/integrations/email";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Test endpoint to verify email configuration
 * GET /api/test-email - Uses environment variables
 * POST /api/test-email - Uses provided configuration
 */
export async function GET(req: NextRequest) {
  try {
    const emailConfig = getEmailConfig();
    const emailTo = process.env.EMAIL_TO;

    if (!emailConfig) {
      return NextResponse.json(
        {
          success: false,
          error: "Email not configured",
          message: "RESEND_API_KEY not found in environment variables",
        },
        { status: 400 }
      );
    }

    if (!emailTo) {
      return NextResponse.json(
        {
          success: false,
          error: "Email recipient not configured",
          message: "EMAIL_TO not found in environment variables",
        },
        { status: 400 }
      );
    }

    // Send test email
    const email = new EmailIntegration(emailConfig);
    const sent = await email.sendAlert({
      to: emailTo,
      subject: "🎉 SIM-OPS Email Test - Configuration Successful!",
      title: "Email Integration Test",
      message: "Congratulations! Your email integration is working correctly. You will now receive alerts from your SIM-OPS agents when critical events occur.",
      severity: "low",
      data: {
        "Test Status": "✅ Success",
        "Recipient": emailTo,
        "From": `${emailConfig.fromName} <${emailConfig.fromEmail}>`,
        "Timestamp": new Date().toLocaleString(),
      },
    });

    if (sent) {
      return NextResponse.json({
        success: true,
        message: `Test email sent successfully to ${emailTo}`,
        config: {
          from: `${emailConfig.fromName} <${emailConfig.fromEmail}>`,
          to: emailTo,
        },
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to send email",
          message: "Check server logs for details",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Test email error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/test-email
 * Test email with provided configuration (for testing before saving)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { apiKey, emailTo, emailFrom, emailFromName } = body;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "API key required",
          message: "Please provide a Resend API key",
        },
        { status: 400 }
      );
    }

    if (!emailTo) {
      return NextResponse.json(
        {
          success: false,
          error: "Recipient email required",
          message: "Please provide a recipient email address",
        },
        { status: 400 }
      );
    }

    // Create email integration with provided config
    const email = new EmailIntegration({
      apiKey,
      fromEmail: emailFrom || "onboarding@resend.dev",
      fromName: emailFromName || "SIM-OPS Agent Alerts",
    });

    // Send test email
    const sent = await email.sendAlert({
      to: emailTo,
      subject: "🎉 SIM-OPS Email Test - Configuration Successful!",
      title: "Email Integration Test",
      message: "Congratulations! Your email integration is working correctly. You will now receive alerts from your SIM-OPS agents when critical events occur.",
      severity: "low",
      data: {
        "Test Status": "✅ Success",
        "Recipient": emailTo,
        "From": `${emailFromName || "SIM-OPS Agent Alerts"} <${emailFrom || "onboarding@resend.dev"}>`,
        "Timestamp": new Date().toLocaleString(),
      },
    });

    if (sent) {
      return NextResponse.json({
        success: true,
        message: `Test email sent successfully to ${emailTo}`,
        config: {
          from: `${emailFromName || "SIM-OPS Agent Alerts"} <${emailFrom || "onboarding@resend.dev"}>`,
          to: emailTo,
        },
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to send email",
          message: "Check server logs for details. Verify your API key is correct.",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Test email error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
