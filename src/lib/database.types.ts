export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AgentStatus =
  | "active"
  | "idle"
  | "processing"
  | "error"
  | "stopped";
export type WorkflowStatus =
  | "draft"
  | "active"
  | "paused"
  | "completed"
  | "error";
export type DecisionSeverity = "info" | "low" | "medium" | "high" | "critical";
export type LogType = "success" | "warning" | "info" | "error";
export type LogSource = "workflow" | "ml" | "agent" | "system";
export type IncidentSeverity = "P1" | "P2" | "P3" | "P4";
export type IncidentStatus = "open" | "investigating" | "resolved" | "closed";
export type IncidentSource = "agent" | "ml" | "manual" | "alert";

export interface Database {
  public: {
    Tables: {
      agents: {
        Row: {
          id: string;
          name: string;
          role: string;
          description: string | null;
          status: AgentStatus;
          last_action: string | null;
          last_run_at: string | null;
          actions_today: number;
          success_rate: number;
          avg_confidence: number;
          created_at: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          role: string;
          description?: string | null;
          status?: AgentStatus;
          last_action?: string | null;
          last_run_at?: string | null;
          actions_today?: number;
          success_rate?: number;
          avg_confidence?: number;
          created_at?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          role?: string;
          description?: string | null;
          status?: AgentStatus;
          last_action?: string | null;
          last_run_at?: string | null;
          actions_today?: number;
          success_rate?: number;
          avg_confidence?: number;
          created_at?: string;
          updated_at?: string;
          user_id?: string | null;
        };
      };
      agent_configs: {
        Row: {
          id: string;
          agent_id: string;
          config_key: string;
          config_value: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          agent_id: string;
          config_key: string;
          config_value: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          agent_id?: string;
          config_key?: string;
          config_value?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      agent_decisions: {
        Row: {
          id: string;
          agent_id: string;
          decision: string;
          reasoning: Json | null;
          confidence: number;
          severity: DecisionSeverity;
          context: Json | null;
          outcome: string | null;
          executed_at: string | null;
          created_at: string;
          user_id: string | null;
        };
        Insert: {
          id?: string;
          agent_id: string;
          decision: string;
          reasoning?: Json | null;
          confidence?: number;
          severity?: DecisionSeverity;
          context?: Json | null;
          outcome?: string | null;
          executed_at?: string | null;
          created_at?: string;
          user_id?: string | null;
        };
        Update: {
          id?: string;
          agent_id?: string;
          decision?: string;
          reasoning?: Json | null;
          confidence?: number;
          severity?: DecisionSeverity;
          context?: Json | null;
          outcome?: string | null;
          executed_at?: string | null;
          created_at?: string;
          user_id?: string | null;
        };
      };
      agent_metrics: {
        Row: {
          id: string;
          agent_id: string;
          metric_name: string;
          metric_value: number;
          timestamp: string;
          metadata: Json | null;
          user_id: string | null;
        };
        Insert: {
          id?: string;
          agent_id: string;
          metric_name: string;
          metric_value: number;
          timestamp?: string;
          metadata?: Json | null;
          user_id?: string | null;
        };
        Update: {
          id?: string;
          agent_id?: string;
          metric_name?: string;
          metric_value?: number;
          timestamp?: string;
          metadata?: Json | null;
          user_id?: string | null;
        };
      };
      agent_communications: {
        Row: {
          id: string;
          from_agent_id: string;
          to_agent_id: string;
          message_type: string;
          payload: Json;
          status: string;
          created_at: string;
          read_at: string | null;
        };
        Insert: {
          id?: string;
          from_agent_id: string;
          to_agent_id: string;
          message_type: string;
          payload: Json;
          status?: string;
          created_at?: string;
          read_at?: string | null;
        };
        Update: {
          id?: string;
          from_agent_id?: string;
          to_agent_id?: string;
          message_type?: string;
          payload?: Json;
          status?: string;
          created_at?: string;
          read_at?: string | null;
        };
      };
      workflows: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          status: WorkflowStatus;
          nodes: Json;
          connections: Json;
          trigger_config: Json | null;
          last_run_at: string | null;
          next_run_at: string | null;
          run_count: number;
          success_count: number;
          error_count: number;
          created_at: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          status?: WorkflowStatus;
          nodes?: Json;
          connections?: Json;
          trigger_config?: Json | null;
          last_run_at?: string | null;
          next_run_at?: string | null;
          run_count?: number;
          success_count?: number;
          error_count?: number;
          created_at?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          status?: WorkflowStatus;
          nodes?: Json;
          connections?: Json;
          trigger_config?: Json | null;
          last_run_at?: string | null;
          next_run_at?: string | null;
          run_count?: number;
          success_count?: number;
          error_count?: number;
          created_at?: string;
          updated_at?: string;
          user_id?: string | null;
        };
      };
      workflow_runs: {
        Row: {
          id: string;
          workflow_id: string;
          status: string;
          started_at: string;
          completed_at: string | null;
          duration_ms: number | null;
          node_results: Json | null;
          error_message: string | null;
          user_id: string | null;
        };
        Insert: {
          id?: string;
          workflow_id: string;
          status?: string;
          started_at?: string;
          completed_at?: string | null;
          duration_ms?: number | null;
          node_results?: Json | null;
          error_message?: string | null;
          user_id?: string | null;
        };
        Update: {
          id?: string;
          workflow_id?: string;
          status?: string;
          started_at?: string;
          completed_at?: string | null;
          duration_ms?: number | null;
          node_results?: Json | null;
          error_message?: string | null;
          user_id?: string | null;
        };
      };
      predictions: {
        Row: {
          id: string;
          type: string;
          prediction: Json;
          confidence: number;
          input_data: Json | null;
          created_at: string;
          user_id: string | null;
        };
        Insert: {
          id?: string;
          type: string;
          prediction: Json;
          confidence?: number;
          input_data?: Json | null;
          created_at?: string;
          user_id?: string | null;
        };
        Update: {
          id?: string;
          type?: string;
          prediction?: Json;
          confidence?: number;
          input_data?: Json | null;
          created_at?: string;
          user_id?: string | null;
        };
      };
      ml_predictions: {
        Row: {
          id: string;
          customer_id: string;
          prediction_type: string;
          prediction_data: Json;
          confidence: number | null;
          created_at: string;
          expires_at: string;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          customer_id: string;
          prediction_type: string;
          prediction_data: Json;
          confidence?: number | null;
          created_at?: string;
          expires_at?: string;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          customer_id?: string;
          prediction_type?: string;
          prediction_data?: Json;
          confidence?: number | null;
          created_at?: string;
          expires_at?: string;
          metadata?: Json | null;
        };
      };
      activity_logs: {
        Row: {
          id: string;
          type: LogType;
          source: LogSource;
          message: string;
          details: Json | null;
          entity_type: string | null;
          entity_id: string | null;
          timestamp: string;
          user_id: string | null;
        };
        Insert: {
          id?: string;
          type: LogType;
          source: LogSource;
          message: string;
          details?: Json | null;
          entity_type?: string | null;
          entity_id?: string | null;
          timestamp?: string;
          user_id?: string | null;
        };
        Update: {
          id?: string;
          type?: LogType;
          source?: LogSource;
          message?: string;
          details?: Json | null;
          entity_type?: string | null;
          entity_id?: string | null;
          timestamp?: string;
          user_id?: string | null;
        };
      };
      risk_alerts: {
        Row: {
          id: string;
          title: string;
          description: string;
          severity: DecisionSeverity;
          source: string;
          status: string;
          acknowledged_at: string | null;
          resolved_at: string | null;
          created_at: string;
          user_id: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          severity: DecisionSeverity;
          source: string;
          status?: string;
          acknowledged_at?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          user_id?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          severity?: DecisionSeverity;
          source?: string;
          status?: string;
          acknowledged_at?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          user_id?: string | null;
        };
      };
      incidents: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          severity: IncidentSeverity;
          status: IncidentStatus;
          source: IncidentSource;
          source_id: string | null;
          customer_id: string | null;
          assigned_to: string | null;
          acknowledged_at: string | null;
          resolved_at: string | null;
          runbook: string | null;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          severity?: IncidentSeverity;
          status?: IncidentStatus;
          source?: IncidentSource;
          source_id?: string | null;
          customer_id?: string | null;
          assigned_to?: string | null;
          acknowledged_at?: string | null;
          resolved_at?: string | null;
          runbook?: string | null;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          severity?: IncidentSeverity;
          status?: IncidentStatus;
          source?: IncidentSource;
          source_id?: string | null;
          customer_id?: string | null;
          assigned_to?: string | null;
          acknowledged_at?: string | null;
          resolved_at?: string | null;
          runbook?: string | null;
          tags?: string[];
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      agent_status: AgentStatus;
      workflow_status: WorkflowStatus;
      decision_severity: DecisionSeverity;
      log_type: LogType;
      log_source: LogSource;
      incident_severity: IncidentSeverity;
      incident_status: IncidentStatus;
      incident_source: IncidentSource;
    };
    CompositeTypes: Record<string, never>;
  };
}
