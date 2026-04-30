"use client";

import type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/integrations/supabase/types";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";

export type DbAgent = Tables<"agents">;
export type DbAgentConfig = Tables<"agent_configs">;
export type DbAgentDecision = Tables<"agent_decisions">;
export type DbAgentMetrics = Tables<"agent_metrics">;

export interface AgentWithDetails extends DbAgent {
  config: DbAgentConfig | null;
  decisions: DbAgentDecision[];
  metrics: DbAgentMetrics | null;
}

export type AgentWithBasics = DbAgent & {
  agent_metrics: DbAgentMetrics[];
  agent_configs: DbAgentConfig[];
  agent_decisions: Pick<DbAgentDecision, "output" | "created_at">[];
};

export function useAgents() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  const query = useQuery({
    queryKey: ["agents"],
    queryFn: async () => {
      const { data: agents, error } = await supabase
        .from("agents")
        .select("*, agent_metrics(*), agent_configs(*), agent_decisions(output, created_at)")
        .order("created_at", { ascending: true });

      if (error) {
        logger.error("Failed to fetch agents", { error: error.message });
        throw error;
      }
      return agents as AgentWithBasics[];
    },
    refetchInterval: 2000, // Fallback polling to keep UI in sync
  });

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel("agents-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "agents" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["agents"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, supabase]);

  return query;
}

export function useAgentWithDetails(agentId: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["agent-details", agentId],
    queryFn: async () => {
      if (!agentId) return null;

      const [agentRes, configRes, decisionsRes, metricsRes] = await Promise.all(
        [
          supabase.from("agents").select("*").eq("id", agentId).maybeSingle(),
          supabase
            .from("agent_configs")
            .select("*")
            .eq("agent_id", agentId)
            .maybeSingle(),
          supabase
            .from("agent_decisions")
            .select("*")
            .eq("agent_id", agentId)
            .order("created_at", { ascending: false })
            .limit(50),
          supabase
            .from("agent_metrics")
            .select("*")
            .eq("agent_id", agentId)
            .order("recorded_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ],
      );

      if (agentRes.error) throw agentRes.error;
      if (!agentRes.data) return null;

      return {
        ...agentRes.data,
        config: configRes.data,
        decisions: decisionsRes.data || [],
        metrics: metricsRes.data,
      } as AgentWithDetails;
    },
    enabled: !!agentId,
  });
}

export function useUpdateAgent() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: TablesUpdate<"agents">;
    }) => {
      const { data, error } = await supabase
        .from("agents")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        logger.error("Failed to update agent", { error: error.message, id });
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
  });
}

export function useDeleteAgent() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (agentId: string) => {
      // also cleanup the config and metrics due to foreign keys if they are not cascaded
      await supabase.from("agent_configs").delete().eq("agent_id", agentId);
      await supabase.from("agent_metrics").delete().eq("agent_id", agentId);

      const { error } = await supabase
        .from("agents")
        .delete()
        .eq("id", agentId);

      if (error) {
        logger.error("Failed to delete agent", {
          error: error.message,
          id: agentId,
        });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
  });
}

export function useRunAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      agentId,
      agentName,
      agentRole,
      input,
      context,
    }: {
      agentId: string;
      agentName: string;
      agentRole: string;
      input?: string;
      context?: Record<string, unknown>;
    }) => {
      const response = await fetch("/api/agents/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentId,
          agentName,
          agentRole,
          input,
          context,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to run agent");
      }

      const data = await response.json();
      return data.result;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      queryClient.invalidateQueries({
        queryKey: ["agent-details", variables.agentId],
      });
      queryClient.invalidateQueries({ queryKey: ["agent-communications"] });

      toast.success(
        (data as any).escalated
          ? `Decision made and escalated to ${(data as any).escalatedTo}`
          : "Decision logged successfully",
      );
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useRunAllAgents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      agents: { id: string; name: string; role: string }[],
    ) => {
      // Create a single request to the pipeline endpoint
      const response = await fetch("/api/agents/run-pipeline", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to run pipeline");
      }

      const data = await response.json();
      return data.results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      queryClient.invalidateQueries({ queryKey: ["agent-communications"] });
      toast.success("Pipeline executed successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateAgentConfig() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({
      agentId,
      updates,
    }: {
      agentId: string;
      updates: Partial<TablesUpdate<"agent_configs">>;
    }) => {
      const { data, error } = await supabase
        .from("agent_configs")
        .update(updates)
        .eq("agent_id", agentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { agentId }) => {
      queryClient.invalidateQueries({ queryKey: ["agent-details", agentId] });
    },
  });
}

export function useAgentCommunications() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  const query = useQuery({
    queryKey: ["agent-communications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_communications")
        .select(
          "*, from_agent:agents!agent_communications_from_agent_id_fkey(name), to_agent:agents!agent_communications_to_agent_id_fkey(name)",
        )
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    },
    refetchInterval: 1000, // Faster polling for logs to feel real-time
  });

  // Subscribe to realtime communications
  useEffect(() => {
    const channel = supabase
      .channel("agent-comms")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "agent_communications" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["agent-communications"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, supabase]);

  return query;
}

export function useInsertAgentDecision() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (decision: TablesInsert<"agent_decisions">) => {
      const { data, error } = await supabase
        .from("agent_decisions")
        .insert(decision)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["agent-details", data.agent_id],
      });
    },
  });
}

export function useInsertAgentCommunication() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (comm: TablesInsert<"agent_communications">) => {
      const { data, error } = await supabase
        .from("agent_communications")
        .insert(comm)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-communications"] });
    },
  });
}
