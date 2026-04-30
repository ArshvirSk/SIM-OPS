"use client";

import type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/integrations/supabase/types";
import { createClient } from "@/lib/supabase/client";
import type { WorkflowNode } from "@/types/workflow";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type DbWorkflow = Tables<"workflows">;
export type DbWorkflowRun = Tables<"workflow_runs">;

export function useWorkflows() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["workflows"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workflows")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useWorkflow(workflowId: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["workflow", workflowId],
    queryFn: async () => {
      if (!workflowId) return null;

      const { data, error } = await supabase
        .from("workflows")
        .select("*")
        .eq("id", workflowId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!workflowId,
  });
}

export function useWorkflowRuns(workflowId: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["workflow-runs", workflowId],
    queryFn: async () => {
      if (!workflowId) return [];

      const { data, error } = await supabase
        .from("workflow_runs")
        .select("*")
        .eq("workflow_id", workflowId)
        .order("started_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
    enabled: !!workflowId,
  });
}

export function useCreateWorkflow() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (workflow: TablesInsert<"workflows">) => {
      const { data, error } = await supabase
        .from("workflows")
        .insert(workflow)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
    },
  });
}

export function useUpdateWorkflow() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: TablesUpdate<"workflows">;
    }) => {
      const { data, error } = await supabase
        .from("workflows")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      queryClient.invalidateQueries({ queryKey: ["workflow", data.id] });
    },
  });
}

export function useDeleteWorkflow() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("workflows").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
    },
  });
}

export function useCreateWorkflowRun() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (run: TablesInsert<"workflow_runs">) => {
      const { data, error } = await supabase
        .from("workflow_runs")
        .insert(run)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["workflow-runs", data.workflow_id],
      });
    },
  });
}

export function useUpdateWorkflowRun() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: TablesUpdate<"workflow_runs">;
    }) => {
      const { data, error } = await supabase
        .from("workflow_runs")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["workflow-runs", data.workflow_id],
      });
    },
  });
}

export function useExecuteWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workflowId,
      nodes,
      connections,
    }: {
      workflowId: string;
      nodes: WorkflowNode[];
      connections: { from: string; to: string }[];
    }) => {
      // Dynamic import to avoid bundling issues
      const { WorkflowExecutor } = await import("@/lib/workflows/executor");
      return await WorkflowExecutor.execute(workflowId, nodes, connections);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      queryClient.invalidateQueries({
        queryKey: ["workflow", data.workflowId],
      });
      queryClient.invalidateQueries({
        queryKey: ["workflow-runs", data.workflowId],
      });
    },
  });
}
