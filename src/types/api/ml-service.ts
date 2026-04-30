/**
 * ML Service API Type Definitions
 * Explicit types for ML service requests and responses
 */

// Churn Prediction Types
export interface ChurnPredictionRequest {
  customer_id: string;
  features: ChurnFeatures;
}

export interface ChurnFeatures {
  usage_frequency: number;
  days_since_last_login: number;
  support_tickets_count: number;
  payment_failures: number;
  contract_length_days: number;
  feature_usage_rate: number;
  avg_session_duration: number;
  total_spend: number;
  discount_usage: number;
  referrals_made: number;
}

export interface ChurnPredictionResponse {
  customer_id: string;
  churn_probability: number;
  risk_segment: "low" | "medium" | "high" | "critical";
  factors: ChurnFactor[];
  confidence: number;
}

export interface ChurnFactor {
  factor: string;
  importance: number;
  impact: string;
}

export interface ChurnBatchRequest {
  customers: ChurnPredictionRequest[];
}

export interface ChurnBatchResponse {
  predictions: ChurnPredictionResponse[];
}

// CLV Prediction Types
export interface CLVPredictionRequest {
  customer_id: string;
  features: CLVFeatures;
}

export interface CLVFeatures {
  total_purchases: number;
  avg_purchase_value: number;
  purchase_frequency: number;
  customer_age_days: number;
  engagement_score: number;
  referrals_made: number;
  support_interactions: number;
  feature_adoption_rate: number;
}

export interface CLVPredictionResponse {
  customer_id: string;
  predicted_clv: number;
  clv_segment: "low" | "medium" | "high" | "premium";
  confidence: number;
  factors: CLVFactor[];
}

export interface CLVFactor {
  factor: string;
  importance: number;
  value: number;
  impact: string;
}

// Anomaly Detection Types
export interface AnomalyDetectionRequest {
  metric_name: string;
  values: number[];
  timestamps: string[];
}

export interface AnomalyDetectionResponse {
  anomalies_detected: boolean;
  anomaly_indices: number[];
  anomaly_scores: number[];
  severity: "low" | "medium" | "high" | "critical";
  explanation: string;
}

// Revenue Forecast Types
export interface RevenueForecastRequest {
  historical_data: HistoricalRevenueData[];
  forecast_periods: number;
}

export interface HistoricalRevenueData {
  date: string;
  revenue: number;
}

export interface RevenueForecastResponse {
  predictions: RevenuePrediction[];
  confidence_intervals: ConfidenceInterval[];
  trend: "increasing" | "decreasing" | "stable";
  accuracy_metrics: AccuracyMetrics;
}

export interface RevenuePrediction {
  period: number;
  predicted_value: number;
  date: string;
}

export interface ConfidenceInterval {
  period: number;
  lower_bound: number;
  upper_bound: number;
}

export interface AccuracyMetrics {
  mae: number;
  rmse: number;
  mape: number;
}

// Model Training Types
export interface ModelTrainingRequest {
  model_name: string;
  training_data: TrainingData;
  hyperparameters?: Record<string, number | string | boolean>;
}

export interface TrainingData {
  features: Record<string, unknown>[];
  labels: number[] | string[];
}

export interface ModelTrainingResponse {
  status: "success" | "failed";
  model: string;
  trained_at: string;
  data_points?: number;
  message?: string;
  metrics?: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1_score?: number;
  };
  error?: string;
}

// Model Info Types
export interface ModelInfoResponse {
  model_name: string;
  model_type: "churn" | "clv" | "anomaly" | "revenue";
  version: string;
  trained_at: string;
  features: string[];
  metrics: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1_score?: number;
    mae?: number;
    rmse?: number;
    mape?: number;
  };
}

// Health Check Types
export interface HealthCheckResponse {
  status: "healthy";
  timestamp: string;
}

// ML Service Error Types
export interface MLServiceErrorResponse {
  detail: string;
  error_code?: string;
  validation_errors?: Array<{
    field: string;
    message: string;
  }>;
}

// Type guard for ML service errors
export function isMLServiceError(value: unknown): value is MLServiceErrorResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "detail" in value &&
    typeof (value as MLServiceErrorResponse).detail === "string"
  );
}
