export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export type Database = {
    public: {
        Tables: {
            agent_communications: {
                Row: {
                    created_at: string;
                    from_agent_id: string;
                    id: string;
                    latency_ms: number | null;
                    message_type: string;
                    payload: Json;
                    to_agent_id: string;
                };
                Insert: {
                    created_at?: string;
                    from_agent_id: string;
                    id?: string;
                    latency_ms?: number | null;
                    message_type: string;
                    payload?: Json;
                    to_agent_id: string;
                };
                Update: {
                    created_at?: string;
                    from_agent_id?: string;
                    id?: string;
                    latency_ms?: number | null;
                    message_type?: string;
                    payload?: Json;
                    to_agent_id?: string;
                };
            };
            agent_configs: {
                Row: {
                    agent_id: string;
                    created_at: string;
                    enabled: boolean;
                    id: string;
                    output_targets: string[];
                    thresholds: Json;
                    triggers: string[];
                    updated_at: string;
                };
                Insert: {
                    agent_id: string;
                    created_at?: string;
                    enabled?: boolean;
                    id?: string;
                    output_targets?: string[];
                    thresholds?: Json;
                    triggers?: string[];
                    updated_at?: string;
                };
                Update: {
                    agent_id?: string;
                    created_at?: string;
                    enabled?: boolean;
                    id?: string;
                    output_targets?: string[];
                    thresholds?: Json;
                    triggers?: string[];
                    updated_at?: string;
                };
            };
            agent_decisions: {
                Row: {
                    agent_id: string;
                    confidence: number;
                    created_at: string;
                    id: string;
                    input: string;
                    output: string;
                    reasoning: string;
                    severity: Database["public"]["Enums"]["decision_severity"];
                    workflow_triggered: string | null;
                };
                Insert: {
                    agent_id: string;
                    confidence?: number;
                    created_at?: string;
                    id?: string;
                    input: string;
                    output: string;
                    reasoning: string;
                    severity?: Database["public"]["Enums"]["decision_severity"];
                    workflow_triggered?: string | null;
                };
                Update: {
                    agent_id?: string;
                    confidence?: number;
                    created_at?: string;
                    id?: string;
                    input?: string;
                    output?: string;
                    reasoning?: string;
                    severity?: Database["public"]["Enums"]["decision_severity"];
                    workflow_triggered?: string | null;
                };
            };
            agent_metrics: {
                Row: {
                    agent_id: string;
                    avg_confidence: number;
                    avg_response_time: number;
                    created_at: string;
                    id: string;
                    recorded_at: string;
                    success_rate: number;
                    total_decisions: number;
                };
                Insert: {
                    agent_id: string;
                    avg_confidence?: number;
                    avg_response_time?: number;
                    created_at?: string;
                    id?: string;
                    recorded_at?: string;
                    success_rate?: number;
                    total_decisions?: number;
                };
                Update: {
                    agent_id?: string;
                    avg_confidence?: number;
                    avg_response_time?: number;
                    created_at?: string;
                    id?: string;
                    recorded_at?: string;
                    success_rate?: number;
                    total_decisions?: number;
                };
            };
            activity_logs: {
                Row: {
                    created_at: string;
                    id: string;
                    message: string;
                    metadata: Json;
                    source: string;
                    type: string;
                };
                Insert: {
                    created_at?: string;
                    id?: string;
                    message: string;
                    metadata?: Json;
                    source: string;
                    type: string;
                };
                Update: {
                    created_at?: string;
                    id?: string;
                    message?: string;
                    metadata?: Json;
                    source?: string;
                    type?: string;
                };
            };
            predictions: {
                Row: {
                    confidence: number;
                    created_at: string;
                    id: string;
                    input_data: Json;
                    prediction: Json;
                    type: string;
                };
                Insert: {
                    confidence?: number;
                    created_at?: string;
                    id?: string;
                    input_data: Json;
                    prediction: Json;
                    type: string;
                };
                Update: {
                    confidence?: number;
                    created_at?: string;
                    id?: string;
                    input_data?: Json;
                    prediction?: Json;
                    type?: string;
                };
            };
            risk_alerts: {
                Row: {
                    acknowledged_at: string | null;
                    created_at: string;
                    description: string;
                    id: string;
                    resolved_at: string | null;
                    severity: Database["public"]["Enums"]["decision_severity"];
                    source: string;
                    status: string;
                    title: string;
                };
                Insert: {
                    acknowledged_at?: string | null;
                    created_at?: string;
                    description: string;
                    id?: string;
                    resolved_at?: string | null;
                    severity?: Database["public"]["Enums"]["decision_severity"];
                    source: string;
                    status?: string;
                    title: string;
                };
                Update: {
                    acknowledged_at?: string | null;
                    created_at?: string;
                    description?: string;
                    id?: string;
                    resolved_at?: string | null;
                    severity?: Database["public"]["Enums"]["decision_severity"];
                    source?: string;
                    status?: string;
                    title?: string;
                };
            };
            agents: {
                Row: {
                    actions_today: number;
                    created_at: string;
                    description: string | null;
                    id: string;
                    last_action: string | null;
                    name: string;
                    role: string;
                    status: Database["public"]["Enums"]["agent_status"];
                    updated_at: string;
                };
                Insert: {
                    actions_today?: number;
                    created_at?: string;
                    description?: string | null;
                    id?: string;
                    last_action?: string | null;
                    name: string;
                    role: string;
                    status?: Database["public"]["Enums"]["agent_status"];
                    updated_at?: string;
                };
                Update: {
                    actions_today?: number;
                    created_at?: string;
                    description?: string | null;
                    id?: string;
                    last_action?: string | null;
                    name?: string;
                    role?: string;
                    status?: Database["public"]["Enums"]["agent_status"];
                    updated_at?: string;
                };
            };
            workflow_runs: {
                Row: {
                    completed_at: string | null;
                    created_at: string;
                    error_message: string | null;
                    id: string;
                    started_at: string;
                    status: string;
                    steps_completed: number;
                    total_steps: number;
                    workflow_id: string;
                };
                Insert: {
                    completed_at?: string | null;
                    created_at?: string;
                    error_message?: string | null;
                    id?: string;
                    started_at?: string;
                    status?: string;
                    steps_completed?: number;
                    total_steps?: number;
                    workflow_id: string;
                };
                Update: {
                    completed_at?: string | null;
                    created_at?: string;
                    error_message?: string | null;
                    id?: string;
                    started_at?: string;
                    status?: string;
                    steps_completed?: number;
                    total_steps?: number;
                    workflow_id?: string;
                };
            };
            workflows: {
                Row: {
                    created_at: string;
                    description: string | null;
                    id: string;
                    last_run: string | null;
                    name: string;
                    nodes: Json;
                    run_count: number;
                    status: Database["public"]["Enums"]["workflow_status"];
                    updated_at: string;
                };
                Insert: {
                    created_at?: string;
                    description?: string | null;
                    id?: string;
                    last_run?: string | null;
                    name: string;
                    nodes?: Json;
                    run_count?: number;
                    status?: Database["public"]["Enums"]["workflow_status"];
                    updated_at?: string;
                };
                Update: {
                    created_at?: string;
                    description?: string | null;
                    id?: string;
                    last_run?: string | null;
                    name?: string;
                    nodes?: Json;
                    run_count?: number;
                    status?: Database["public"]["Enums"]["workflow_status"];
                    updated_at?: string;
                };
            };
        };
        Views: Record<string, never>;
        Functions: Record<string, never>;
        Enums: {
            agent_status: "active" | "idle" | "processing" | "error";
            decision_severity: "low" | "medium" | "high" | "critical";
            workflow_status: "active" | "paused" | "draft";
        };
        CompositeTypes: Record<string, never>;
    };
};

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
    DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof Database;
    }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
    ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R;
        }
    ? R
    : never
    : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
            Row: infer R;
        }
    ? R
    : never
    : never;

export type TablesInsert<
    DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof Database;
    }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
    ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Insert: infer I;
    }
    ? I
    : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
    }
    ? I
    : never
    : never;

export type TablesUpdate<
    DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof Database;
    }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
    ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Update: infer U;
    }
    ? U
    : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
    }
    ? U
    : never
    : never;

export type Enums<
    DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
    EnumName extends DefaultSchemaEnumNameOrOptions extends {
        schema: keyof Database;
    }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
    ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;
