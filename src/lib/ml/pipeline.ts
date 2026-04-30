/**
 * ML Data Pipeline
 * Transforms Supabase data into ML model input format
 */

import type { Customer } from "@/types/database";
import type {
  ChurnFeatures,
  CLVFeatures,
  AnomalyDetectionRequest,
  RevenueForecastRequest,
} from "@/types/api/ml-service";

export class MLDataPipeline {
  /**
   * Extract churn prediction features from customer data
   */
  static extractChurnFeatures(customer: Customer): ChurnFeatures {
    return {
      usage_frequency: this.calculateUsageFrequency(customer),
      days_since_last_login: this.daysSince(customer.last_login),
      support_tickets_count: customer.support_tickets || 0,
      payment_failures: customer.payment_failures || 0,
      contract_length_days: this.daysSince(customer.created_at),
      feature_usage_rate: customer.feature_usage_rate || 0.5,
      avg_session_duration: customer.avg_session_duration || 10,
      total_spend: customer.total_spend || 0,
      discount_usage: customer.discount_usage || 0,
      referrals_made: customer.referrals_made || 0,
    };
  }

  /**
   * Extract CLV prediction features from customer data
   */
  static extractCLVFeatures(customer: Customer): CLVFeatures {
    return {
      total_purchases: customer.total_purchases || 0,
      avg_purchase_value: customer.avg_purchase_value || 0,
      purchase_frequency: this.calculatePurchaseFrequency(customer),
      customer_age_days: this.daysSince(customer.created_at),
      engagement_score: customer.engagement_score || 0.5,
      referrals_made: customer.referrals_made || 0,
      support_interactions: customer.support_tickets || 0,
      feature_adoption_rate: customer.feature_usage_rate || 0.5,
    };
  }

  /**
   * Prepare anomaly detection data from metrics
   */
  static prepareAnomalyData(
    metricName: string,
    metrics: Array<{ value: number; timestamp: string }>
  ): AnomalyDetectionRequest {
    return {
      metric_name: metricName,
      values: metrics.map((m) => m.value),
      timestamps: metrics.map((m) => m.timestamp),
    };
  }

  /**
   * Prepare revenue forecast data from historical data
   */
  static prepareRevenueData(
    historicalData: Array<{ date: string; revenue: number }>,
    forecastPeriods: number = 30
  ): RevenueForecastRequest {
    return {
      historical_data: historicalData,
      forecast_periods: forecastPeriods,
    };
  }

  /**
   * Calculate usage frequency (0-1 scale)
   */
  private static calculateUsageFrequency(customer: Customer): number {
    if (!customer.last_login || !customer.created_at) return 0.5;

    const daysSinceSignup = this.daysSince(customer.created_at);
    const daysSinceLastLogin = this.daysSince(customer.last_login);

    if (daysSinceSignup === 0) return 1.0;

    // High frequency if logged in recently relative to account age
    const frequency = 1 - daysSinceLastLogin / Math.max(daysSinceSignup, 1);
    return Math.max(0, Math.min(1, frequency));
  }

  /**
   * Calculate purchase frequency (purchases per month)
   */
  private static calculatePurchaseFrequency(customer: Customer): number {
    if (!customer.total_purchases || !customer.created_at) return 0;

    const daysSinceSignup = this.daysSince(customer.created_at);
    const monthsSinceSignup = Math.max(daysSinceSignup / 30, 1);

    return customer.total_purchases / monthsSinceSignup;
  }

  /**
   * Calculate days since a date
   */
  private static daysSince(dateString: string | null | undefined): number {
    if (!dateString) return 0;

    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch {
      return 0;
    }
  }

  /**
   * Validate churn features
   */
  static validateChurnFeatures(features: ChurnFeatures): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (features.usage_frequency < 0 || features.usage_frequency > 1) {
      errors.push("usage_frequency must be between 0 and 1");
    }

    if (features.days_since_last_login < 0) {
      errors.push("days_since_last_login cannot be negative");
    }

    if (features.support_tickets_count < 0) {
      errors.push("support_tickets_count cannot be negative");
    }

    if (features.payment_failures < 0) {
      errors.push("payment_failures cannot be negative");
    }

    if (features.contract_length_days < 0) {
      errors.push("contract_length_days cannot be negative");
    }

    if (features.feature_usage_rate < 0 || features.feature_usage_rate > 1) {
      errors.push("feature_usage_rate must be between 0 and 1");
    }

    if (features.avg_session_duration < 0) {
      errors.push("avg_session_duration cannot be negative");
    }

    if (features.total_spend < 0) {
      errors.push("total_spend cannot be negative");
    }

    if (features.discount_usage < 0 || features.discount_usage > 1) {
      errors.push("discount_usage must be between 0 and 1");
    }

    if (features.referrals_made < 0) {
      errors.push("referrals_made cannot be negative");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate CLV features
   */
  static validateCLVFeatures(features: CLVFeatures): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (features.total_purchases < 0) {
      errors.push("total_purchases cannot be negative");
    }

    if (features.avg_purchase_value < 0) {
      errors.push("avg_purchase_value cannot be negative");
    }

    if (features.purchase_frequency < 0) {
      errors.push("purchase_frequency cannot be negative");
    }

    if (features.customer_age_days < 0) {
      errors.push("customer_age_days cannot be negative");
    }

    if (features.engagement_score < 0 || features.engagement_score > 1) {
      errors.push("engagement_score must be between 0 and 1");
    }

    if (features.referrals_made < 0) {
      errors.push("referrals_made cannot be negative");
    }

    if (features.support_interactions < 0) {
      errors.push("support_interactions cannot be negative");
    }

    if (
      features.feature_adoption_rate < 0 ||
      features.feature_adoption_rate > 1
    ) {
      errors.push("feature_adoption_rate must be between 0 and 1");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Normalize features to 0-1 range (if needed)
   */
  static normalizeFeatures(
    features: Record<string, number>,
    ranges: Record<string, { min: number; max: number }>
  ): Record<string, number> {
    const normalized: Record<string, number> = {};

    for (const [key, value] of Object.entries(features)) {
      if (ranges[key]) {
        const { min, max } = ranges[key];
        normalized[key] = (value - min) / (max - min);
      } else {
        normalized[key] = value;
      }
    }

    return normalized;
  }

  /**
   * Handle missing values with defaults
   */
  static fillMissingValues(
    features: Partial<ChurnFeatures>
  ): ChurnFeatures {
    return {
      usage_frequency: features.usage_frequency ?? 0.5,
      days_since_last_login: features.days_since_last_login ?? 0,
      support_tickets_count: features.support_tickets_count ?? 0,
      payment_failures: features.payment_failures ?? 0,
      contract_length_days: features.contract_length_days ?? 0,
      feature_usage_rate: features.feature_usage_rate ?? 0.5,
      avg_session_duration: features.avg_session_duration ?? 10,
      total_spend: features.total_spend ?? 0,
      discount_usage: features.discount_usage ?? 0,
      referrals_made: features.referrals_made ?? 0,
    };
  }
}
