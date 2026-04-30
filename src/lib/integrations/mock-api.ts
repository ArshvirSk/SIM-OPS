/**
 * Mock API for testing and demonstration
 * Simulates a real business API with metrics, customers, and predictions
 */

export interface BusinessMetrics {
  revenue: number;
  customers: number;
  churnRate: number;
  activeUsers: number;
  timestamp: string;
}

export interface MockCustomer {
  id: string;
  name: string;
  email: string;
  status: "active" | "at_risk" | "churned";
  lifetime_value: number;
  last_activity: string;
  churn_probability: number;
}

export interface PredictionResult {
  metric: string;
  predicted_value: number;
  confidence: number;
  trend: "up" | "down" | "stable";
  anomaly_detected: boolean;
}

export interface ActionParams {
  targetCustomers?: string[];
  threshold?: number;
  message?: string;
  [key: string]: unknown;
}

export interface ActionResult {
  success: boolean;
  message: string;
  details: {
    action: string;
    params: ActionParams;
    executed_at: string;
    affected_count: number;
  };
}

export interface NotificationResult {
  sent: boolean;
  id: string;
}

export class MockAPI {
  private static _seed = 12345;

  private static deterministicRandom(): number {
    this._seed = (this._seed * 9301 + 49297) % 233280;
    return this._seed / 233280;
  }

  /**
   * Get current business metrics
   */
  static async getMetrics(): Promise<BusinessMetrics> {
    // Simulate API delay
    await this.delay(500);

    const baseRevenue = 298000;
    const variance = this.deterministicRandom() * 20000 - 10000;

    return {
      revenue: Math.round(baseRevenue + variance),
      customers: 12847 + Math.floor(this.deterministicRandom() * 200 - 100),
      churnRate: 4.1 + (this.deterministicRandom() * 0.5 - 0.25),
      activeUsers: 8234 + Math.floor(this.deterministicRandom() * 500 - 250),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get at-risk customers
   */
  static async getAtRiskCustomers(): Promise<MockCustomer[]> {
    await this.delay(800);

    const customers: MockCustomer[] = [];
    const count = Math.floor(this.deterministicRandom() * 20) + 30;

    for (let i = 0; i < count; i++) {
      customers.push({
        id: `cust_${this.deterministicRandom().toString(36).substr(2, 9)}`,
        name: this.generateName(),
        email: `customer${i}@example.com`,
        status: this.deterministicRandom() > 0.7 ? "at_risk" : "active",
        lifetime_value: Math.round(this.deterministicRandom() * 50000 + 5000),
        last_activity: this.randomDate(30),
        churn_probability: this.deterministicRandom() * 0.4 + 0.6, // 60-100%
      });
    }

    return customers.filter((c) => c.status === "at_risk");
  }

  /**
   * Run prediction model
   */
  static async runPrediction(
    metric: string,
    data: Record<string, unknown>,
  ): Promise<PredictionResult> {
    await this.delay(1200);

    const confidence = this.deterministicRandom() * 0.3 + 0.7; // 70-100%
    const anomaly = this.deterministicRandom() > 0.8;

    let predicted_value: number;
    let trend: "up" | "down" | "stable";

    switch (metric) {
      case "revenue":
        predicted_value = 305000 + this.deterministicRandom() * 20000 - 10000;
        trend = predicted_value > 305000 ? "up" : "down";
        break;
      case "churn":
        predicted_value = 4.5 + this.deterministicRandom() * 1.0 - 0.5;
        trend = predicted_value > 4.5 ? "up" : "down";
        break;
      case "users":
        predicted_value = 13000 + this.deterministicRandom() * 1000 - 500;
        trend = predicted_value > 13000 ? "up" : "down";
        break;
      default:
        predicted_value = this.deterministicRandom() * 1000;
        trend = "stable";
    }

    return {
      metric,
      predicted_value: Math.round(predicted_value * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
      trend,
      anomaly_detected: anomaly,
    };
  }

  /**
   * Execute an action (retention campaign, alert, etc.)
   */
  static async executeAction(
    action: string,
    params: ActionParams,
  ): Promise<ActionResult> {
    await this.delay(600);

    const success = this.deterministicRandom() > 0.1; // 90% success rate

    return {
      success,
      message: success
        ? `Action "${action}" executed successfully`
        : `Action "${action}" failed`,
      details: {
        action,
        params,
        executed_at: new Date().toISOString(),
        affected_count: Math.floor(this.deterministicRandom() * 50) + 10,
      },
    };
  }

  /**
   * Send notification
   */
  static async sendNotification(
    type: "email" | "slack" | "sms",
    recipient: string,
    message: string,
  ): Promise<NotificationResult> {
    await this.delay(400);

    return {
      sent: true,
      id: `notif_${this.deterministicRandom().toString(36).substr(2, 9)}`,
    };
  }

  // Helper methods
  private static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private static generateName(): string {
    const firstNames = [
      "John",
      "Jane",
      "Michael",
      "Sarah",
      "David",
      "Emily",
      "Robert",
      "Lisa",
    ];
    const lastNames = [
      "Smith",
      "Johnson",
      "Williams",
      "Brown",
      "Jones",
      "Garcia",
      "Miller",
      "Davis",
    ];
    return `${firstNames[Math.floor(this.deterministicRandom() * firstNames.length)]} ${lastNames[Math.floor(this.deterministicRandom() * lastNames.length)]}`;
  }

  private static randomDate(daysAgo: number): string {
    const date = new Date();
    date.setDate(
      date.getDate() - Math.floor(this.deterministicRandom() * daysAgo),
    );
    return date.toISOString();
  }
}
