"use client";

import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

type DbAgent = Tables<"agents">;

/**
 * Hook to subscribe to real-time agent updates
 * Automatically updates React Query cache when agents change
 */
export function useRealtimeAgents() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    // Subscribe to all changes on agents table
    const channel = supabase
      .channel("agents-changes")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all events (INSERT, UPDATE, DELETE)
          schema: "public",
          table: "agents",
        },
        (payload) => {
          console.log("Real-time agent update:", payload);

          // Invalidate queries to refetch latest data
          queryClient.invalidateQueries({ queryKey: ["agents"] });

          if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
            const agent = payload.new as DbAgent;
            queryClient.invalidateQueries({
              queryKey: ["agent", agent.id],
            });
          }
        },
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, supabase]);
}
