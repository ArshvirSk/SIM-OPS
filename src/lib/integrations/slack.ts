/**
 * Slack Integration
 * Send notifications and alerts to Slack channels
 */

import type {
  SlackAttachment,
  SlackBlock,
  SlackMessageResponse,
  SlackWebhookRequest,
} from "@/types/api/slack";
import {
  createContextBlock,
  createHeaderBlock,
  createSectionBlock,
} from "@/types/api/slack";
import { APIClient } from "./api-client";

export interface SlackMessage {
  channel: string;
  text: string;
  blocks?: SlackBlock[];
  attachments?: SlackAttachment[];
}

export interface SlackMessageResult {
  success: boolean;
  ts: string; // Message timestamp
  channel: string;
}

export class SlackIntegration {
  private webhookUrl?: string;
  private client?: APIClient;

  constructor(config: { webhookUrl?: string; botToken?: string }) {
    if (config.webhookUrl) {
      this.webhookUrl = config.webhookUrl;
    }
    if (config.botToken) {
      this.client = new APIClient({
        baseURL: "https://slack.com/api",
        headers: {
          Authorization: `Bearer ${config.botToken}`,
        },
      });
    }
  }

  /**
   * Send message via webhook (simpler, no auth needed)
   */
  async sendWebhookMessage(
    text: string,
    blocks?: SlackBlock[],
    channel?: string,
  ): Promise<boolean> {
    if (!this.webhookUrl) {
      throw new Error("Webhook URL not configured");
    }

    const payload: SlackWebhookRequest = { text, blocks, channel };

    const response = await fetch(this.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return response.ok;
  }

  /**
   * Send formatted alert message
   */
  async sendAlert(
    severity: "low" | "medium" | "high" | "critical",
    title: string,
    details: string,
    data?: Record<string, unknown>,
    channel?: string,
  ): Promise<boolean> {
    const severityEmojis = {
      low: "ℹ️",
      medium: "⚠️",
      high: "🔥",
      critical: "🚨",
    };

    const blocks: SlackBlock[] = [
      createHeaderBlock(
        `${severityEmojis[severity]} ${severity.toUpperCase()}: ${title}`,
      ),
      createSectionBlock(details),
    ];

    // Add data fields if provided
    if (data) {
      const fields = Object.entries(data)
        .slice(0, 10) // Max 10 fields
        .map(([key, value]) => ({
          type: "mrkdwn" as const,
          text: `*${key}:*\n${value}`,
        }));

      blocks.push({
        type: "section",
        fields,
      });
    }

    // Add timestamp
    blocks.push(
      createContextBlock(`Generated at ${new Date().toLocaleString()}`),
    );

    return this.sendWebhookMessage("", blocks);
  }

  /**
   * Send agent execution notification
   */
  async sendAgentNotification(
    agentName: string,
    action: string,
    result: "success" | "failure",
    details?: string,
  ): Promise<boolean> {
    const emoji = result === "success" ? "✅" : "❌";

    const blocks: SlackBlock[] = [
      createSectionBlock(`${emoji} *${agentName}* ${action}`),
    ];

    if (details) {
      blocks.push(createSectionBlock(`\`\`\`${details}\`\`\``));
    }

    return this.sendWebhookMessage("", blocks);
  }

  /**
   * Send workflow status update
   */
  async sendWorkflowUpdate(
    workflowName: string,
    status: "started" | "completed" | "failed",
    steps?: Array<{ name: string; status: string }>,
  ): Promise<boolean> {
    const statusEmojis = {
      started: "▶️",
      completed: "✅",
      failed: "❌",
    };

    const blocks: SlackBlock[] = [
      createHeaderBlock(`${statusEmojis[status]} Workflow: ${workflowName}`),
      createSectionBlock(`Status: *${status.toUpperCase()}*`),
    ];

    if (steps && steps.length > 0) {
      const stepsText = steps
        .map((step) => `• ${step.name}: ${step.status}`)
        .join("\n");

      blocks.push(createSectionBlock(`*Steps:*\n${stepsText}`));
    }

    return this.sendWebhookMessage("", blocks);
  }

  /**
   * Send metrics summary
   */
  async sendMetricsSummary(metrics: Record<string, number>): Promise<boolean> {
    const fields = Object.entries(metrics).map(([key, value]) => ({
      type: "mrkdwn" as const,
      text: `*${key}:*\n${typeof value === "number" ? value.toLocaleString() : value}`,
    }));

    const blocks: SlackBlock[] = [
      createHeaderBlock("📊 Daily Metrics Summary"),
      {
        type: "section",
        fields,
      },
      createContextBlock(`Updated: ${new Date().toLocaleString()}`),
    ];

    return this.sendWebhookMessage("", blocks);
  }

  /**
   * Send message using Bot API (requires bot token)
   */
  async postMessage(
    channel: string,
    text: string,
    blocks?: SlackBlock[],
  ): Promise<SlackMessageResult> {
    if (!this.client) {
      throw new Error("Bot token not configured");
    }

    const response = await this.client.post<SlackMessageResponse>(
      "/chat.postMessage",
      {
        channel,
        text,
        blocks,
      },
    );

    return {
      success: response.data.ok,
      ts: response.data.ts,
      channel: response.data.channel,
    };
  }
}

/**
 * Usage Example:
 *
 * // Option 1: Using Webhook (Simpler)
 * const slack = new SlackIntegration({
 *   webhookUrl: process.env.SLACK_WEBHOOK_URL
 * });
 *
 * // In Monitoring Agent
 * await slack.sendAlert(
 *   'high',
 *   'Churn Rate Exceeded',
 *   'Current churn rate: 5.2% (threshold: 3%)',
 *   { affected_customers: 47, trend: 'increasing' }
 * );
 *
 * // In Action Agent
 * await slack.sendAgentNotification(
 *   'Action Agent',
 *   'executed retention campaign',
 *   'success',
 *   'Sent emails to 47 at-risk customers'
 * );
 *
 * // In Reporting Agent
 * await slack.sendMetricsSummary({
 *   'Revenue': 298000,
 *   'Active Users': 12847,
 *   'Churn Rate': 4.1,
 *   'Decisions Today': 156
 * });
 *
 * // Option 2: Using Bot Token (More features)
 * const slackBot = new SlackIntegration({
 *   botToken: process.env.SLACK_BOT_TOKEN
 * });
 *
 * await slackBot.postMessage('#alerts', 'Critical alert!');
 */
