/**
 * Database Type Definitions
 * Explicit types for all Supabase tables
 */

export interface Customer {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  last_login: string | null;
  last_activity: string | null;
  support_tickets: number;
  payment_failures: number;
  total_spend: number;
  total_purchases: number;
  avg_purchase_value: number;
  feature_usage_rate: number;
  avg_session_duration: number;
  discount_usage: number;
  referrals_made: number;
  engagement_score: number;
  status: "active" | "at_risk" | "churned";
}

export interface Transaction {
  id: string;
  customer_id: string;
  amount: number;
  created_at: string;
  status: "completed" | "pending" | "failed";
  description: string | null;
  metadata: Record<string, unknown> | null;
}

export interface Prediction {
  id: string;
  customer_id: string;
  prediction_type: "churn" | "clv" | "anomaly" | "revenue";
  prediction_value: number;
  confidence: number;
  risk_level: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface WorkflowRun {
  id: string;
  workflow_id: string;
  status: "running" | "completed" | "failed";
  total_steps: number;
  steps_completed: number;
  completed_at: string | null;
  error_message: string | null;
  created_at: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string | null;
  status: "active" | "inactive";
  trigger_type: string;
  last_run: string | null;
  run_count: number;
  created_at: string;
  updated_at: string;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: "active" | "inactive" | "error";
  last_action: string | null;
  actions_today: number;
  config: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface AgentDecision {
  id: string;
  agent_id: string;
  input: string;
  reasoning: string;
  output: string;
  severity: "low" | "medium" | "high" | "critical";
  confidence: number;
  workflow_triggered: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface RiskAlert {
  id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  source: string;
  status: "active" | "acknowledged" | "resolved";
  assigned_to: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  type: "info" | "success" | "warning" | "error";
  source: string;
  message: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface MLPrediction {
  id: string;
  model_type: "churn" | "clv" | "anomaly" | "revenue";
  input_data: Record<string, unknown>;
  prediction_result: Record<string, unknown>;
  confidence: number;
  created_at: string;
}

export interface IntegrationConfig {
  id: string;
  integration_id: string;
  name: string;
  config: Record<string, unknown>;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Type for database query results
export type QueryResult<T> = {
  data: T | null;
  error: {
    message: string;
    details: string;
    hint: string;
    code: string;
  } | null;
};

// Type for database list query results
export type QueryListResult<T> = {
  data: T[] | null;
  error: {
    message: string;
    details: string;
    hint: string;
    code: string;
  } | null;
};

// Type for database insert/update results
export type MutationResult<T> = {
  data: T | null;
  error: {
    message: string;
    details: string;
    hint: string;
    code: string;
  } | null;
};
