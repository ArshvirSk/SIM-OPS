import type { Database } from "./database.types";

export type Agent = Database["public"]["Tables"]["agents"]["Row"];
export type AgentInsert = Database["public"]["Tables"]["agents"]["Insert"];
export type AgentUpdate = Database["public"]["Tables"]["agents"]["Update"];
export type AgentStatus = "active" | "idle" | "processing" | "error";

export type Workflow = Database["public"]["Tables"]["workflows"]["Row"];
export type WorkflowInsert = Database["public"]["Tables"]["workflows"]["Insert"];
export type WorkflowUpdate = Database["public"]["Tables"]["workflows"]["Update"];
export type WorkflowStatus = "active" | "paused" | "completed" | "error";

export type Prediction = Database["public"]["Tables"]["predictions"]["Row"];
export type PredictionInsert = Database["public"]["Tables"]["predictions"]["Insert"];
export type PredictionUpdate = Database["public"]["Tables"]["predictions"]["Update"];

export type Activity = Database["public"]["Tables"]["activity_logs"]["Row"];
export type ActivityInsert = Database["public"]["Tables"]["activity_logs"]["Insert"];
export type ActivityUpdate = Database["public"]["Tables"]["activity_logs"]["Update"];
export type ActivityType = "success" | "warning" | "info" | "error";
export type ActivitySource = "workflow" | "ml" | "agent" | "system";
