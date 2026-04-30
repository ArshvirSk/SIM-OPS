"use client";

import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

type DbWorkflow = Tables<"workflows">;
type DbWorkflowRun = Tables<"workflow_runs">;

/**
 * Hook to subscribe to real-time workflow and workflow run updates
 */
export function useRealtimeWorkflows() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    // Subscribe to workflow changes
    const workflowChannel = supabase
      .channel("workflows-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "workflows",
        },
        (payload) => {
          console.log("Real-time workflow update:", payload);
          queryClient.invalidateQueries({ queryKey: ["workflows"] });

          if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
            const workflow = payload.new as DbWorkflow;
            queryClient.invalidateQueries({
              queryKey: ["workflow", workflow.id],
            });
          }
        },
      )
      .subscribe();

    // Subscribe to workflow run changes for execution progress
    const runChannel = supabase
      .channel("workflow-runs-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "workflow_runs",
        },
        (payload) => {
          console.log("Real-time workflow run update:", payload);

          if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
            const run = payload.new as DbWorkflowRun;
            queryClient.invalidateQueries({
              queryKey: ["workflow-runs", run.workflow_id],
            });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(workflowChannel);
      supabase.removeChannel(runChannel);
    };
  }, [queryClient, supabase]);
}
