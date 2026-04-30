/**
 * Stripe API Type Definitions
 * Explicit types for Stripe API responses
 */

export interface StripeSubscription {
  id: string;
  object: "subscription";
  customer: string;
  status: "active" | "canceled" | "past_due" | "unpaid" | "incomplete" | "trialing";
  items: {
    object: "list";
    data: StripeSubscriptionItem[];
    has_more: boolean;
    url: string;
  };
  created: number;
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  canceled_at: number | null;
  ended_at: number | null;
  metadata: Record<string, string>;
  [key: string]: unknown;
}

export interface StripeSubscriptionItem {
  id: string;
  object: "subscription_item";
  price: StripePrice;
  quantity: number;
  subscription: string;
}

export interface StripePrice {
  id: string;
  object: "price";
  unit_amount: number;
  currency: string;
  recurring: {
    interval: "day" | "week" | "month" | "year";
    interval_count: number;
  } | null;
  product: string;
}

export interface StripeCharge {
  id: string;
  object: "charge";
  amount: number;
  amount_captured: number;
  amount_refunded: number;
  currency: string;
  customer: string | null;
  status: "succeeded" | "pending" | "failed";
  created: number;
  paid: boolean;
  refunded: boolean;
  failure_code: string | null;
  failure_message: string | null;
  metadata: Record<string, string>;
  [key: string]: unknown;
}

export interface StripeCustomer {
  id: string;
  object: "customer";
  email: string | null;
  name: string | null;
  created: number;
  balance: number;
  currency: string | null;
  delinquent: boolean;
  metadata: Record<string, string>;
  subscriptions?: StripeListResponse<StripeSubscription>;
  [key: string]: unknown;
}

export interface StripeListResponse<T> {
  object: "list";
  data: T[];
  has_more: boolean;
  url: string;
  [key: string]: unknown;
}

export interface StripeCoupon {
  id: string;
  object: "coupon";
  percent_off: number | null;
  amount_off: number | null;
  currency: string | null;
  duration: "forever" | "once" | "repeating";
  duration_in_months: number | null;
  name: string | null;
  created: number;
  valid: boolean;
}

export interface StripeError {
  error: {
    type: "api_error" | "card_error" | "idempotency_error" | "invalid_request_error" | "rate_limit_error" | "authentication_error";
    message: string;
    code?: string;
    param?: string;
    decline_code?: string;
  };
}

// Type guard for Stripe errors
export function isStripeError(value: unknown): value is StripeError {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof (value as StripeError).error === "object" &&
    "message" in (value as StripeError).error
  );
}
