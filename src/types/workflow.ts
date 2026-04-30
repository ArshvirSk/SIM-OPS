/**
 * Workflow Type Definitions
 * Explicit types for workflow execution and node configurations
 */

import type {
  ChurnPredictionResponse,
  AnomalyDetectionResponse,
  RevenueForecastResponse,
  CLVPredictionResponse,
} from "./api/ml-service";

// Node types from DraggableNode component
export type NodeType =
  | "trigger"
  | "data"
  | "ml"
  | "decision"
  | "action"
  | "report"
  | "condition"
  | "alert"
  | "notify";

// Base workflow node
export interface WorkflowNode {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  config?: NodeConfig;
}

// Discriminated union for node configurations
export type NodeConfig =
  | TriggerNodeConfig
  | DataNodeConfig
  | MLNodeConfig
  | DecisionNodeConfig
  | ConditionNodeConfig
  | ActionNodeConfig
  | AlertNodeConfig
  | NotifyNodeConfig
  | ReportNodeConfig;

export interface TriggerNodeConfig {
  type: "trigger";
  triggerType: "manual" | "scheduled" | "event";
  schedule?: string;
  eventType?: string;
}

export interface DataNodeConfig {
  type: "data";
  source: "stripe" | "mock" | "database" | "supabase";
  query?: string;
  filters?: Record<string, unknown>;
}

export interface MLNodeConfig {
  type: "ml";
  modelType: "churn" | "anomaly" | "revenue" | "clv";
  inputSource: "previous" | "database" | "manual";
  dataQuery?: string;
  inputData?: Record<string, unknown>;
}

export interface DecisionNodeConfig {
  type: "decision";
  rules: DecisionRule[];
  defaultAction?: string;
}

export interface DecisionRule {
  condition: string;
  threshold: number;
  operator: "gt" | "lt" | "eq" | "gte" | "lte" | "ne";
  action: string;
}

export interface ConditionNodeConfig {
  type: "condition";
  condition: string;
  field?: string;
  operator?: "gt" | "lt" | "eq" | "gte" | "lte" | "ne" | "contains";
  value?: string | number | boolean;
}

export interface ActionNodeConfig {
  type: "action";
  actionType: string;
  parameters?: Record<string, unknown>;
}

export interface AlertNodeConfig {
  type: "alert";
  severity: "low" | "medium" | "high" | "critical";
  title?: string;
  message?: string;
}

export interface NotifyNodeConfig {
  type: "notify";
  notifyType: "slack" | "email" | "sms" | "webhook";
  recipients?: string[];
  template?: string;
}

export interface ReportNodeConfig {
  type: "report";
  format: "json" | "summary" | "detailed";
  includeMetadata?: boolean;
}

// Workflow connection
export interface WorkflowConnection {
  from: string;
  to: string;
}

// Node execution context with typed outputs
export type NodeExecutionContext = {
  [nodeId: string]: NodeOutput;
};

// Discriminated union for node outputs
export type NodeOutput =
  | TriggerOutput
  | DataOutput
  | MLOutput
  | DecisionOutput
  | ConditionOutput
  | ActionOutput
  | AlertOutput
  | NotifyOutput
  | ReportOutput;

export interface TriggerOutput {
  type: "trigger";
  triggered: boolean;
  timestamp: string;
  triggerType: string;
  metadata?: Record<string, unknown>;
}

export interface DataOutput {
  type: "data";
  revenue: number;
  customers: number;
  churnRate: number;
  activeUsers: number;
  timestamp: string;
  source: string;
  rawData?: Record<string, unknown>;
}

export interface MLOutput {
  type: "ml";
  modelType: "churn" | "anomaly" | "revenue" | "clv";
  predictions?: ChurnPredictionResponse[] | CLVPredictionResponse[];
  anomalyResult?: AnomalyDetectionResponse;
  forecastResult?: RevenueForecastResponse;
  total?: number;
  processed?: number;
  error?: boolean;
  message?: string;
  fallback?: boolean;
}

export interface DecisionOutput {
  type: "decision";
  severity: "low" | "medium" | "high" | "critical";
  action: string;
  reasoning: string;
  confidence: number;
  triggeredRule?: string;
}

export interface ConditionOutput {
  type: "condition";
  conditionMet: boolean;
  branch: "true" | "false";
  evaluatedValue?: unknown;
  expectedValue?: unknown;
}

export interface ActionOutput {
  type: "action";
  success: boolean;
  message: string;
  details: Record<string, unknown>;
  actionType: string;
  executedAt: string;
}

export interface AlertOutput {
  type: "alert";
  alertCreated: boolean;
  alertId?: string;
  severity: "low" | "medium" | "high" | "critical";
  timestamp: string;
}

export interface NotifyOutput {
  type: "notify";
  notificationSent: boolean;
  notifyType: string;
  recipients: string[];
  messageId?: string;
  timestamp: string;
}

export interface ReportOutput {
  type: "report";
  reportGenerated: boolean;
  summary: string;
  context: NodeExecutionContext;
  format: string;
  timestamp: string;
}

// Node execution result
export interface NodeExecutionResult {
  nodeId: string;
  nodeType: NodeType;
  success: boolean;
  output: NodeOutput | null;
  error?: string;
  executedAt: string;
  duration: number;
}

// Workflow execution result
export interface WorkflowExecutionResult {
  workflowId: string;
  runId: string;
  status: "success" | "failed" | "partial";
  startedAt: string;
  completedAt: string;
  duration: number;
  nodeResults: NodeExecutionResult[];
  totalNodes: number;
  successfulNodes: number;
  failedNodes: number;
}

// Type guards for node outputs
export function isTriggerOutput(output: NodeOutput): output is TriggerOutput {
  return output.type === "trigger";
}

export function isDataOutput(output: NodeOutput): output is DataOutput {
  return output.type === "data";
}

export function isMLOutput(output: NodeOutput): output is MLOutput {
  return output.type === "ml";
}

export function isDecisionOutput(output: NodeOutput): output is DecisionOutput {
  return output.type === "decision";
}

export function isConditionOutput(output: NodeOutput): output is ConditionOutput {
  return output.type === "condition";
}

export function isActionOutput(output: NodeOutput): output is ActionOutput {
  return output.type === "action";
}

export function isAlertOutput(output: NodeOutput): output is AlertOutput {
  return output.type === "alert";
}

export function isNotifyOutput(output: NodeOutput): output is NotifyOutput {
  return output.type === "notify";
}

export function isReportOutput(output: NodeOutput): output is ReportOutput {
  return output.type === "report";
}
