/**
 * Stripe Integration
 * Monitor revenue, subscriptions, and customer churn
 */

import type {
  StripeCharge,
  StripeCustomer,
  StripeListResponse,
  StripeSubscription,
} from "@/types/api/stripe";
import { APIClient } from "./api-client";

export interface StripeMetrics {
  mrr: number; // Monthly Recurring Revenue
  activeSubscriptions: number;
  churnedSubscriptions: number;
  churnRate: number;
  newCustomers: number;
  revenue: number;
}

export interface StripeCustomerSummary {
  id: string;
  email: string;
  name: string;
  subscriptionStatus: string;
  subscriptionValue: number;
  lastPaymentDate: string;
  churnRisk: number;
}

export class StripeIntegration {
  private client: APIClient;

  constructor(apiKey: string) {
    this.client = new APIClient({
      baseURL: "https://api.stripe.com/v1",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Stripe-Version": "2023-10-16",
      },
    });
  }

  /**
   * Get revenue metrics for monitoring
   */
  async getMetrics(periodDays: number = 30): Promise<StripeMetrics> {
    const now = Math.floor(Date.now() / 1000);
    const periodStart = now - periodDays * 24 * 60 * 60;

    // Get active subscriptions
    const subscriptions = await this.client.get<
      StripeListResponse<StripeSubscription>
    >("/subscriptions?status=active&limit=100");

    // Get charges for revenue
    const charges = await this.client.get<StripeListResponse<StripeCharge>>(
      `/charges?created[gte]=${periodStart}&limit=100`,
    );

    // Get canceled subscriptions for churn
    const canceled = await this.client.get<
      StripeListResponse<StripeSubscription>
    >(`/subscriptions?status=canceled&created[gte]=${periodStart}&limit=100`);

    const activeCount = subscriptions.data.data.length;
    const churnedCount = canceled.data.data.length;
    const totalRevenue = charges.data.data.reduce(
      (sum: number, charge: StripeCharge) => sum + charge.amount,
      0,
    );

    // Calculate MRR from active subscriptions
    const mrr = subscriptions.data.data.reduce(
      (sum: number, sub: StripeSubscription) => {
        const firstItem = sub.items.data[0];
        return sum + (firstItem?.price.unit_amount || 0);
      },
      0,
    );

    return {
      mrr: mrr / 100, // Convert from cents
      activeSubscriptions: activeCount,
      churnedSubscriptions: churnedCount,
      churnRate:
        activeCount > 0
          ? (churnedCount / (activeCount + churnedCount)) * 100
          : 0,
      newCustomers: activeCount,
      revenue: totalRevenue / 100,
    };
  }

  /**
   * Get at-risk customers based on payment failures
   */
  async getAtRiskCustomers(): Promise<StripeCustomerSummary[]> {
    const customers: StripeCustomerSummary[] = [];

    // Get customers with failed payments
    const failedPayments = await this.client.get<
      StripeListResponse<StripeCharge>
    >("/charges?status=failed&limit=100");

    for (const charge of failedPayments.data.data) {
      if (!charge.customer) continue;

      const customerResponse = await this.client.get<StripeCustomer>(
        `/customers/${charge.customer}`,
      );

      const customer = customerResponse.data;

      customers.push({
        id: customer.id,
        email: customer.email || "unknown@example.com",
        name: customer.name || "Unknown",
        subscriptionStatus: "payment_failed",
        subscriptionValue: charge.amount / 100,
        lastPaymentDate: new Date(charge.created * 1000).toISOString(),
        churnRisk: 0.85, // High risk due to payment failure
      });
    }

    return customers;
  }

  /**
   * Create a discount coupon for retention
   */
  async createRetentionCoupon(
    customerId: string,
    discountPercent: number,
  ): Promise<{ success: boolean; couponId: string }> {
    const couponResponse = await this.client.post<any>("/coupons", {
      percent_off: discountPercent,
      duration: "once",
      name: `Retention Offer - ${discountPercent}% off`,
    });

    // Apply to customer
    await this.client.post<StripeCustomer>(`/customers/${customerId}`, {
      coupon: couponResponse.data.id,
    });

    return {
      success: true,
      couponId: couponResponse.data.id,
    };
  }
}

/**
 * Usage Example:
 *
 * const stripe = new StripeIntegration(process.env.STRIPE_SECRET_KEY!);
 *
 * // In Monitoring Agent
 * const metrics = await stripe.getMetrics();
 * if (metrics.churnRate > 5) {
 *   // Alert!
 * }
 *
 * // In Prediction Agent
 * const atRisk = await stripe.getAtRiskCustomers();
 *
 * // In Action Agent
 * for (const customer of atRisk) {
 *   await stripe.createRetentionCoupon(customer.id, 20);
 * }
 */
