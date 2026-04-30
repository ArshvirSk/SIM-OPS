/**
 * Email Integration using Resend
 * Sends email notifications for agent alerts
 */

export interface EmailConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
}

export interface EmailAlert {
  to: string;
  subject: string;
  title: string;
  message: string;
  severity: "low" | "medium" | "high" | "critical";
  data?: Record<string, any>;
}

export class EmailIntegration {
  private apiKey: string;
  private fromEmail: string;
  private fromName: string;

  constructor(config: EmailConfig) {
    this.apiKey = config.apiKey;
    this.fromEmail = config.fromEmail;
    this.fromName = config.fromName;
  }

  /**
   * Send an alert email
   */
  async sendAlert(alert: EmailAlert): Promise<boolean> {
    try {
      const html = this.buildAlertEmail(alert);

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${this.fromName} <${this.fromEmail}>`,
          to: [alert.to],
          subject: alert.subject,
          html: html,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("Email sending failed:", error);
        return false;
      }

      const result = await response.json();
      console.log(`✓ Email sent successfully:`, result.id);
      return true;
    } catch (error) {
      console.error("Email sending error:", error);
      return false;
    }
  }

  /**
   * Send agent decision summary email
   */
  async sendAgentSummary(
    to: string,
    agentName: string,
    decision: string,
    reasoning: string,
    severity: "low" | "medium" | "high" | "critical",
    data?: Record<string, any>
  ): Promise<boolean> {
    const severityEmoji = {
      low: "ℹ️",
      medium: "⚠️",
      high: "🔴",
      critical: "🚨",
    };

    return this.sendAlert({
      to,
      subject: `${severityEmoji[severity]} ${agentName}: ${decision}`,
      title: `${agentName} Alert`,
      message: reasoning,
      severity,
      data,
    });
  }

  /**
   * Build HTML email template
   */
  private buildAlertEmail(alert: EmailAlert): string {
    const severityColors = {
      low: "#3b82f6",
      medium: "#f59e0b",
      high: "#ef4444",
      critical: "#dc2626",
    };

    const severityLabels = {
      low: "ℹ️ Low",
      medium: "⚠️ Medium",
      high: "🔴 High",
      critical: "🚨 Critical",
    };

    const color = severityColors[alert.severity];
    const label = severityLabels[alert.severity];

    let dataRows = "";
    if (alert.data) {
      dataRows = Object.entries(alert.data)
        .map(
          ([key, value]) => `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151;">
              ${key}
            </td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">
              ${value}
            </td>
          </tr>
        `
        )
        .join("");
    }

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${alert.subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: ${color}; padding: 24px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                ${alert.title}
              </h1>
            </td>
          </tr>

          <!-- Severity Badge -->
          <tr>
            <td style="padding: 20px 24px 0 24px;">
              <div style="display: inline-block; background-color: ${color}; color: #ffffff; padding: 6px 12px; border-radius: 4px; font-size: 14px; font-weight: 600;">
                ${label}
              </div>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="padding: 20px 24px;">
              <p style="margin: 0; color: #1f2937; font-size: 16px; line-height: 1.6;">
                ${alert.message}
              </p>
            </td>
          </tr>

          <!-- Data Table -->
          ${
            dataRows
              ? `
          <tr>
            <td style="padding: 0 24px 20px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 4px;">
                ${dataRows}
              </table>
            </td>
          </tr>
          `
              : ""
          }

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 24px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                This is an automated alert from your SIM-OPS Agent System.
              </p>
              <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 12px;">
                Timestamp: ${new Date().toLocaleString()}
              </p>
            </td>
          </tr>

        </table>

        <!-- Action Button -->
        <table width="600" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
          <tr>
            <td align="center">
              <a href="http://localhost:3000/agents" style="display: inline-block; background-color: ${color}; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">
                View in Dashboard →
              </a>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }
}

/**
 * Get email configuration from environment
 */
export function getEmailConfig(): EmailConfig | null {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return null;
  }

  return {
    apiKey,
    fromEmail: process.env.EMAIL_FROM || "alerts@simops.dev",
    fromName: process.env.EMAIL_FROM_NAME || "SIM-OPS Alerts",
  };
}
