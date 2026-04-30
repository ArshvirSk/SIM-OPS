/**
 * Integration Configuration Manager
 * Loads integration settings from localStorage and environment
 */

export interface IntegrationConfig {
  id: string;
  name: string;
  enabled: boolean;
  config: Record<string, string>;
}

export class IntegrationConfigManager {
  private static STORAGE_KEY = "integrations";

  /**
   * Get all integration configurations
   */
  static getAll(): IntegrationConfig[] {
    if (typeof window === "undefined") return [];

    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return [];

    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  /**
   * Get specific integration config
   */
  static get(integrationId: string): IntegrationConfig | null {
    const all = this.getAll();
    return all.find((int) => int.id === integrationId) || null;
  }

  /**
   * Check if integration is enabled
   */
  static isEnabled(integrationId: string): boolean {
    const config = this.get(integrationId);
    return config?.enabled || false;
  }

  /**
   * Get integration API key/credentials
   */
  static getCredentials(integrationId: string): Record<string, string> {
    const config = this.get(integrationId);
    return config?.config || {};
  }

  /**
   * Get Stripe configuration
   */
  static getStripeConfig(): { apiKey: string; webhookSecret: string } | null {
    if (!this.isEnabled("stripe")) return null;

    const creds = this.getCredentials("stripe");
    if (!creds.apiKey) return null;

    return {
      apiKey: creds.apiKey,
      webhookSecret: creds.webhookSecret || "",
    };
  }

  /**
   * Get SendGrid configuration
   */
  static getSendGridConfig(): { apiKey: string; fromEmail: string } | null {
    if (!this.isEnabled("sendgrid")) return null;

    const creds = this.getCredentials("sendgrid");
    if (!creds.apiKey) return null;

    return {
      apiKey: creds.apiKey,
      fromEmail: creds.fromEmail || "noreply@yourdomain.com",
    };
  }

  /**
   * Get Slack configuration
   */
  static getSlackConfig(): {
    webhookUrl?: string;
    botToken?: string;
  } | null {
    if (!this.isEnabled("slack")) return null;

    const creds = this.getCredentials("slack");
    if (!creds.webhookUrl && !creds.botToken) return null;

    return {
      webhookUrl: creds.webhookUrl || undefined,
      botToken: creds.botToken || undefined,
    };
  }

  /**
   * Get Custom API configuration
   */
  static getCustomAPIConfig(): { baseUrl: string; apiKey: string } | null {
    if (!this.isEnabled("custom-api")) return null;

    const creds = this.getCredentials("custom-api");
    if (!creds.baseUrl) return null;

    return {
      baseUrl: creds.baseUrl,
      apiKey: creds.apiKey || "",
    };
  }

  /**
   * Save integration configurations
   */
  static saveAll(integrations: IntegrationConfig[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(integrations));
  }

  /**
   * Clear all configurations
   */
  static clear(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
