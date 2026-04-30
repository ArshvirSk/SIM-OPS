/**
 * Agent Type Definitions
 * Explicit types for agent execution and results
 */

import type { ChurnPredictionResponse } from "./api/ml-service";

// Agent roles
export type AgentRole =
  | "KPI Deviation Detection & Threshold Monitoring"
  | "ML Inference & Risk Scoring"
  | "Severity Classification & Rule Engine"
  | "Workflow Execution & Automation Triggers"
  | "Summary Generation & Audit Logging";

// Agent execution context
export interface AgentExecutionContext {
  agentId: string;
  agentName: string;
  agentRole: AgentRole;
  config: AgentConfig;
  timestamp: string;
}

// Agent configuration
export interface AgentConfig {
  enabled: boolean;
  thresholds: Record<string, number>;
  triggers: string[];
  outputTargets: string[];
  schedule?: string;
  retryPolicy?: {
    maxRetries: number;
    backoffMs: number;
  };
}

// Base agent execution result
export interface AgentExecutionResult<T extends AgentResultData = AgentResultData> {
  success: boolean;
  decision: string;
  reasoning: string;
  output: string;
  severity: "low" | "medium" | "high" | "critical";
  confidence: number;
  data?: T;
  error?: string;
  executedAt: string;
  duration?: number;
}

// Discriminated union for agent result data
export type AgentResultData =
  | MonitoringAgentData
  | PredictionAgentData
  | DecisionAgentData
  | ActionAgentData
  | ReportingAgentData;

export interface MonitoringAgentData {
  type: "monitoring";
  revenue: number;
  customers: number;
  churnRate: number;
  activeUsers: number;
  timestamp: string;
  deviations?: Array<{
    metric: string;
    current: number;
    threshold: number;
    deviation: number;
  }>;
}

export interface PredictionAgentData {
  type: "prediction";
  total_analyzed: number;
  high_risk: number;
  medium_risk: number;
  low_risk: number;
  predictions: ChurnPredictionResponse[];
  fallback?: boolean;
  modelUsed?: string;
}

export interface DecisionAgentData {
  type: "decision";
  churnRisk: number;
  action: string;
  affectedCustomers: number;
  ruleTriggered?: string;
  recommendations: string[];
}

export interface ActionAgentData {
  type: "action";
  action: string;
  affected_count: number;
  executed_at: string;
  results: Array<{
    target: string;
    success: boolean;
    message: string;
  }>;
}

export interface ReportingAgentData {
  type: "reporting";
  timestamp: string;
  agents_active: number;
  decisions_today: number;
  actions_executed: number;
  alerts_generated: number;
  summary: string;
  metrics: Record<string, number>;
}

// Type guards for agent result data
export function isMonitoringAgentData(
  data: AgentResultData
): data is MonitoringAgentData {
  return data.type === "monitoring";
}

export function isPredictionAgentData(
  data: AgentResultData
): data is PredictionAgentData {
  return data.type === "prediction";
}

export function isDecisionAgentData(
  data: AgentResultData
): data is DecisionAgentData {
  return data.type === "decision";
}

export function isActionAgentData(data: AgentResultData): data is ActionAgentData {
  return data.type === "action";
}

export function isReportingAgentData(
  data: AgentResultData
): data is ReportingAgentData {
  return data.type === "reporting";
}

// Agent execution request
export interface AgentExecutionRequest {
  agentId: string;
  input?: Record<string, unknown>;
  context?: Record<string, unknown>;
  priority?: "low" | "normal" | "high";
}

// Agent execution history
export interface AgentExecutionHistory {
  id: string;
  agentId: string;
  agentName: string;
  result: AgentExecutionResult;
  createdAt: string;
}

// Agent metrics
export interface AgentMetrics {
  agentId: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageDuration: number;
  lastExecutedAt: string | null;
  successRate: number;
}

// Agent status
export type AgentStatus = "active" | "inactive" | "error" | "paused";

// Agent definition
export interface AgentDefinition {
  id: string;
  name: string;
  role: AgentRole;
  description: string;
  status: AgentStatus;
  config: AgentConfig;
  metrics: AgentMetrics;
  createdAt: string;
  updatedAt: string;
}
