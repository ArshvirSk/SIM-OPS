/**
 * Action Execution Layer
 * Executes autonomous actions based on predictions and agent decisions
 */

import { createClient } from "@/lib/supabase/client";

export interface ActionContext {
    type: "churn_alert" | "anomaly_alert" | "forecast_warning" | "report";
    severity: "low" | "medium" | "high" | "critical";
    data: any;
    metadata?: any;
}

export class ActionExecutor {
    private supabase = createClient();

    /**
     * Execute action based on context
     */
    async execute(context: ActionContext): Promise<boolean> {
        try {
            console.log(`🎯 Executing action: ${context.type} (${context.severity})`);

            // Log decision before execution
            await this.logAgentDecision(context);

            // Execute appropriate actions based on type and severity
            switch (context.type) {
                case "churn_alert":
                    await this.handleChurnAlert(context);
                    break;
                case "anomaly_alert":
                    await this.handleAnomalyAlert(context);
                    break;
                case "forecast_warning":
                    await this.handleForecastWarning(context);
                    break;
                case "report":
                    await this.handleReport(context);
                    break;
                default:
                    console.warn(`Unknown action type: ${context.type}`);
            }

            return true;
        } catch (error) {
            console.error("Action execution failed:", error);
            return false;
        }
    }

    /**
     * Handle churn alerts
     */
    private async handleChurnAlert(context: ActionContext) {
        const { customer_id, churn_probability, risk_level, alert_type } = context.data;

        // Check if this is an aggregate threshold alert
        if (alert_type === "aggregate_threshold") {
            // Aggregate threshold exceeded - multi-channel alert
            const { high_risk_count, total_customers, avg_churn_rate, thresholds_exceeded } = context.data;

            // Send Slack alert
            await this.sendSlackAlert({
                title: "🚨 CRITICAL: Churn Threshold Exceeded",
                message: `${high_risk_count} customers at high risk (${((high_risk_count / total_customers) * 100).toFixed(1)}% of total). Average churn rate: ${(avg_churn_rate * 100).toFixed(1)}%`,
                severity: "critical",
                data: {
                    high_risk_count,
                    total_customers,
                    avg_churn_rate: `${(avg_churn_rate * 100).toFixed(1)}%`,
                    thresholds: thresholds_exceeded.join(", "),
                },
            });

            // Create Jira ticket
            await this.createJiraTicket({
                project: "RETENTION",
                type: "Task",
                priority: "Highest",
                summary: `CRITICAL: ${high_risk_count} customers at high churn risk`,
                description: `Aggregate churn threshold exceeded.\n\nMetrics:\n- High risk customers: ${high_risk_count} out of ${total_customers}\n- Average churn rate: ${(avg_churn_rate * 100).toFixed(1)}%\n- High risk percentage: ${((high_risk_count / total_customers) * 100).toFixed(1)}%\n\nThresholds exceeded:\n${thresholds_exceeded.map((t: string) => `- ${t}`).join("\n")}\n\nImmediate action required to prevent revenue loss.`,
            });

            // Send email to retention team
            await this.sendEmail({
                to: process.env.ACCOUNT_MANAGER_EMAIL || "retention@company.com",
                subject: `CRITICAL: ${high_risk_count} Customers at High Churn Risk`,
                template: "aggregate_churn_alert",
                data: context.data,
            });

            // CRITICAL: Make voice call for aggregate threshold
            await this.makeVoiceCall({
                to: process.env.ALERT_PHONE_NUMBER || process.env.ACCOUNT_MANAGER_PHONE,
                message: `Critical alert from SIM-OPS. ${high_risk_count} customers are at high risk of churning. This represents ${((high_risk_count / total_customers) * 100).toFixed(0)} percent of your customer base. Average churn probability is ${(avg_churn_rate * 100).toFixed(0)} percent. Immediate action required. Check your email and Slack for details.`,
                alertType: "aggregate_churn_alert",
                data: context.data,
            });

            return;
        }

        // Individual customer alert (original logic)
        // High-risk customers get multi-channel alerts
        if (context.severity === "high" || context.severity === "critical") {
            // Send Slack alert
            await this.sendSlackAlert({
                title: "🚨 High Churn Risk Detected",
                message: `Customer ${customer_id} has ${(churn_probability * 100).toFixed(0)}% churn probability`,
                severity: context.severity,
                data: context.data,
            });

            // Create Jira ticket
            await this.createJiraTicket({
                project: "RETENTION",
                type: "Task",
                priority: context.severity === "critical" ? "Highest" : "High",
                summary: `High churn risk: Customer ${customer_id}`,
                description: `Customer showing ${(churn_probability * 100).toFixed(0)}% churn probability.\n\nContributing factors:\n${context.data.contributing_factors?.map((f: any) => `- ${f.factor}: ${f.importance}%`).join("\n")}\n\nRecommended actions:\n${context.data.recommended_actions?.map((a: string) => `- ${a}`).join("\n")}`,
            });

            // Send email to account manager
            await this.sendEmail({
                to: process.env.ACCOUNT_MANAGER_EMAIL || "retention@company.com",
                subject: `High Churn Risk: Customer ${customer_id}`,
                template: "churn_alert",
                data: context.data,
            });

            // CRITICAL ONLY: Make voice call for individual customer (disabled by default)
            // Uncomment if you want voice calls for individual customers
            // if (context.severity === "critical") {
            //     await this.makeVoiceCall({
            //         to: process.env.ALERT_PHONE_NUMBER || process.env.ACCOUNT_MANAGER_PHONE,
            //         message: `Critical alert from SIM-OPS. Customer ${customer_id} has ${(churn_probability * 100).toFixed(0)} percent churn probability. Immediate action required. Check your email and Slack for details.`,
            //         alertType: "churn_alert",
            //         data: context.data,
            //     });
            // }
        } else {
            // Medium/low risk: just Slack notification
            await this.sendSlackAlert({
                title: "⚠️ Churn Risk Detected",
                message: `Customer ${customer_id} has ${(churn_probability * 100).toFixed(0)}% churn probability`,
                severity: context.severity,
                data: context.data,
            });
        }
    }

    /**
     * Handle anomaly alerts
     */
    private async handleAnomalyAlert(context: ActionContext) {
        const { metric_name, actual_value, expected_range, severity } =
            context.data;

        if (severity === "high") {
            // Send Slack alert
            await this.sendSlackAlert({
                title: "🔍 Anomaly Detected",
                message: `${metric_name}: ${actual_value} (expected ${expected_range.min}-${expected_range.max})`,
                severity: context.severity,
                data: context.data,
            });

            // Create incident ticket
            await this.createJiraTicket({
                project: "OPS",
                type: "Bug",
                priority: "High",
                summary: `Anomaly detected in ${metric_name}`,
                description: `Metric: ${metric_name}\nActual: ${actual_value}\nExpected: ${expected_range.min}-${expected_range.max}\nDeviation: ${context.data.deviation}%`,
            });

            // CRITICAL ANOMALIES: Make voice call
            if (context.severity === "critical") {
                await this.makeVoiceCall({
                    to: process.env.OPS_PHONE_NUMBER || process.env.ALERT_PHONE_NUMBER,
                    message: `Critical anomaly detected in ${metric_name}. Actual value is ${actual_value}, expected range is ${expected_range.min} to ${expected_range.max}. Immediate investigation required.`,
                    alertType: "anomaly_alert",
                    data: context.data,
                });
            }
        }
    }

    /**
     * Handle forecast warnings
     */
    private async handleForecastWarning(context: ActionContext) {
        const { forecast_type, prediction, trend } = context.data;

        await this.sendSlackAlert({
            title: "📊 Forecast Alert",
            message: `${forecast_type}: ${trend} trend detected`,
            severity: context.severity,
            data: context.data,
        });
    }

    /**
     * Handle report generation and delivery
     */
    private async handleReport(context: ActionContext) {
        await this.sendEmail({
            to: process.env.EXECUTIVE_EMAIL || "executives@company.com",
            subject: context.data.title || "SIM-OPS Weekly Report",
            template: "weekly_report",
            data: context.data,
        });

        await this.sendSlackAlert({
            title: "📋 Weekly Report Generated",
            message: "State of the Startup report is ready",
            severity: "low",
            data: { report_url: context.data.url },
        });
    }

    /**
     * Send Slack alert
     */
    private async sendSlackAlert(params: {
        title: string;
        message: string;
        severity: string;
        data?: any;
    }): Promise<boolean> {
        try {
            const webhookUrl = process.env.SLACK_WEBHOOK_URL;

            if (!webhookUrl) {
                console.warn("SLACK_WEBHOOK_URL not configured, skipping Slack alert");
                return false;
            }

            const color =
                params.severity === "critical"
                    ? "#FF0000"
                    : params.severity === "high"
                        ? "#FF6B00"
                        : params.severity === "medium"
                            ? "#FFB800"
                            : "#00A86B";

            const response = await fetch(webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text: params.title,
                    attachments: [
                        {
                            color: color,
                            title: params.title,
                            text: params.message,
                            footer: "SIM-OPS Autonomous Agent",
                            ts: Math.floor(Date.now() / 1000),
                            fields: params.data
                                ? Object.entries(params.data)
                                    .slice(0, 5)
                                    .map(([key, value]) => ({
                                        title: key,
                                        value: String(value),
                                        short: true,
                                    }))
                                : [],
                        },
                    ],
                }),
            });

            if (!response.ok) {
                console.error("Slack alert failed:", await response.text());
                return false;
            }

            console.log("✅ Slack alert sent");
            return true;
        } catch (error) {
            console.error("Slack alert error:", error);
            return false;
        }
    }

    /**
     * Create Jira ticket
     */
    private async createJiraTicket(params: {
        project: string;
        type: string;
        priority: string;
        summary: string;
        description: string;
    }): Promise<boolean> {
        try {
            const jiraUrl = process.env.JIRA_URL;
            const jiraEmail = process.env.JIRA_EMAIL;
            const jiraToken = process.env.JIRA_API_TOKEN;

            if (!jiraUrl || !jiraEmail || !jiraToken) {
                console.warn("Jira not configured, skipping ticket creation");
                return false;
            }

            const auth = Buffer.from(`${jiraEmail}:${jiraToken}`).toString("base64");

            const response = await fetch(`${jiraUrl}/rest/api/3/issue`, {
                method: "POST",
                headers: {
                    Authorization: `Basic ${auth}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    fields: {
                        project: { key: params.project },
                        summary: params.summary,
                        description: {
                            type: "doc",
                            version: 1,
                            content: [
                                {
                                    type: "paragraph",
                                    content: [{ type: "text", text: params.description }],
                                },
                            ],
                        },
                        issuetype: { name: params.type },
                        priority: { name: params.priority },
                    },
                }),
            });

            if (!response.ok) {
                console.error("Jira ticket creation failed:", await response.text());
                return false;
            }

            const result = await response.json();
            console.log(`✅ Jira ticket created: ${result.key}`);
            return true;
        } catch (error) {
            console.error("Jira ticket creation error:", error);
            return false;
        }
    }

    /**
     * Send email
     */
    private async sendEmail(params: {
        to: string;
        subject: string;
        template: string;
        data: any;
    }): Promise<boolean> {
        try {
            const resendApiKey = process.env.RESEND_API_KEY;

            if (!resendApiKey) {
                console.warn("RESEND_API_KEY not configured, skipping email");
                return false;
            }

            const html = this.renderEmailTemplate(params.template, params.data);

            const response = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${resendApiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    from: process.env.EMAIL_FROM || "onboarding@resend.dev",
                    to: params.to,
                    subject: params.subject,
                    html: html,
                }),
            });

            if (!response.ok) {
                console.error("Email sending failed:", await response.text());
                return false;
            }

            console.log("✅ Email sent");
            return true;
        } catch (error) {
            console.error("Email sending error:", error);
            return false;
        }
    }

    /**
     * Render email template
     */
    private renderEmailTemplate(template: string, data: any): string {
        // Simple template rendering (use a proper template engine in production)
        switch (template) {
            case "churn_alert":
                const churnProb = data.churn_probability || 0;
                const riskLevel = data.risk_level || "unknown";
                const factors = data.contributing_factors || [];
                const actions = data.recommended_actions || [];
                
                return `
          <h2>High Churn Risk Alert</h2>
          <p>Customer ${data.customer_id} is at risk of churning.</p>
          <p><strong>Churn Probability:</strong> ${(churnProb * 100).toFixed(0)}%</p>
          <p><strong>Risk Level:</strong> ${riskLevel}</p>
          <h3>Contributing Factors:</h3>
          <ul>
            ${factors.length > 0 ? factors.map((f: any) => `<li>${f.factor}: ${(f.importance * 100).toFixed(0)}%</li>`).join("") : "<li>No factors available</li>"}
          </ul>
          <h3>Recommended Actions:</h3>
          <ul>
            ${actions.length > 0 ? actions.map((a: string) => `<li>${a}</li>`).join("") : "<li>No actions available</li>"}
          </ul>
        `;
            case "aggregate_churn_alert":
                return `
          <h2 style="color: #dc2626;">🚨 CRITICAL: Churn Threshold Exceeded</h2>
          <p style="font-size: 16px; font-weight: bold;">
            ${data.high_risk_count} customers are at high risk of churning.
          </p>
          
          <h3>Key Metrics:</h3>
          <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
            <tr style="background-color: #f3f4f6;">
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>High Risk Customers</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${data.high_risk_count} out of ${data.total_customers}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>High Risk Percentage</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${((data.high_risk_count / data.total_customers) * 100).toFixed(1)}%</td>
            </tr>
            <tr style="background-color: #f3f4f6;">
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Average Churn Rate</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${(data.avg_churn_rate * 100).toFixed(1)}%</td>
            </tr>
          </table>

          <h3>Thresholds Exceeded:</h3>
          <ul>
            ${data.thresholds_exceeded?.map((t: string) => `<li style="color: #dc2626; font-weight: bold;">${t}</li>`).join("")}
          </ul>

          <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold;">⚠️ Immediate Action Required</p>
            <p style="margin: 10px 0 0 0;">This represents a significant risk to revenue. Please review the high-risk customers and initiate retention campaigns immediately.</p>
          </div>

          <h3>Recommended Actions:</h3>
          <ol>
            <li>Review high-risk customer list in dashboard</li>
            <li>Initiate targeted retention campaigns</li>
            <li>Schedule executive calls with top accounts</li>
            <li>Analyze common churn factors</li>
            <li>Implement preventive measures</li>
          </ol>

          <p style="margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/agents" 
               style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Dashboard
            </a>
          </p>
        `;
            case "weekly_report":
                return `
          <h2>${data.title || "Weekly State of the Startup"}</h2>
          <p>${data.summary || "Here's your weekly business intelligence report."}</p>
          ${data.metrics ? `<h3>Key Metrics:</h3><pre>${JSON.stringify(data.metrics, null, 2)}</pre>` : ""}
        `;
            default:
                return `<p>${JSON.stringify(data)}</p>`;
        }
    }

    /**
     * Make voice call using Twilio
     */
    private async makeVoiceCall(params: {
        to: string | undefined;
        message: string;
        alertType: string;
        data?: any;
    }): Promise<boolean> {
        try {
            const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
            const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
            const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

            if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
                console.warn("Twilio not configured, skipping voice call");
                return false;
            }

            if (!params.to) {
                console.warn("No phone number provided for voice call");
                return false;
            }

            // Create TwiML (Twilio Markup Language) for the voice message
            const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice" language="en-US">${params.message}</Say>
    <Pause length="2"/>
    <Say voice="alice" language="en-US">Press 1 to acknowledge this alert, or press 2 to escalate.</Say>
    <Gather numDigits="1" action="${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/response" method="POST">
        <Say voice="alice" language="en-US">Waiting for your response.</Say>
    </Gather>
    <Say voice="alice" language="en-US">No response received. This alert will remain active.</Say>
</Response>`;

            // Encode credentials for Basic Auth
            const auth = Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString("base64");

            // Make API call to Twilio
            const response = await fetch(
                `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Calls.json`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Basic ${auth}`,
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: new URLSearchParams({
                        To: params.to,
                        From: twilioPhoneNumber,
                        Twiml: twiml,
                        StatusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/status`,
                        StatusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
                        StatusCallbackMethod: "POST",
                    }),
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Twilio voice call failed:", errorText);
                return false;
            }

            const result = await response.json();
            console.log(`✅ Voice call initiated: ${result.sid}`);

            // Log the call in database
            await this.supabase.from("activity_logs").insert({
                type: "voice_call",
                source: "twilio",
                message: `Voice call initiated for ${params.alertType}`,
                metadata: {
                    call_sid: result.sid,
                    to: params.to,
                    alert_type: params.alertType,
                    status: result.status,
                },
            });

            return true;
        } catch (error) {
            console.error("Twilio voice call error:", error);
            return false;
        }
    }

    /**
     * Log agent decision
     */
    private async logAgentDecision(context: ActionContext) {
        await this.supabase.from("agent_decisions").insert({
            agent_id: "action", // Action Executor agent
            decision: `Executing ${context.type} action`,
            reasoning: {
                steps: [
                    "Received action context",
                    "Determined appropriate channels",
                    "Executing multi-channel notification",
                ],
                action_type: context.type,
            },
            confidence: 95.0,
            severity: context.severity,
            context: context.data,
            outcome: "pending",
            executed_at: new Date().toISOString(),
        });
    }
}

// Singleton instance
export const actionExecutor = new ActionExecutor();
