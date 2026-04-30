"use client";

import { createClient } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

/**
 * Hook to subscribe to real-time activity log, alerts, and predictions
 */
export function useRealtimeActivity() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    // Subscribe to activity logs
    const activityChannel = supabase
      .channel("activity-logs-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "activity_logs",
        },
        (payload) => {
          console.log("New activity log:", payload);
          queryClient.invalidateQueries({ queryKey: ["activity"] });
        },
      )
      .subscribe();

    // Subscribe to risk alerts
    const alertsChannel = supabase
      .channel("risk-alerts-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "risk_alerts",
        },
        (payload) => {
          console.log("Risk alert update:", payload);
          queryClient.invalidateQueries({ queryKey: ["risks"] });
          queryClient.invalidateQueries({ queryKey: ["alerts"] });
        },
      )
      .subscribe();

    // Subscribe to predictions
    const predictionsChannel = supabase
      .channel("predictions-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "predictions",
        },
        (payload) => {
          console.log("New prediction:", payload);
          queryClient.invalidateQueries({ queryKey: ["predictions"] });
        },
      )
      .subscribe();

    // Subscribe to agent decisions
    const decisionsChannel = supabase
      .channel("agent-decisions-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "agent_decisions",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["dashboard-activity"] });
          queryClient.invalidateQueries({ queryKey: ["activity"] });
        },
      )
      .subscribe();

    // Subscribe to agent communications (live agent chat)
    const commsChannel = supabase
      .channel("agent-communications-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "agent_communications",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["dashboard-activity"] });
          queryClient.invalidateQueries({ queryKey: ["agent-communications"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(activityChannel);
      supabase.removeChannel(alertsChannel);
      supabase.removeChannel(predictionsChannel);
      supabase.removeChannel(decisionsChannel);
      supabase.removeChannel(commsChannel);
    };
  }, [queryClient, supabase]);
}
