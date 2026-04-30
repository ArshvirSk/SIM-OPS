"use client";

import { createClient } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export function useRealtimeMLPredictions() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("ml_predictions_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ml_predictions",
        },
        (payload) => {
          console.log("ML prediction change detected:", payload);

          // Invalidate relevant queries based on prediction type
          const predictionType =
            (payload.new as any)?.prediction_type ||
            (payload.old as any)?.prediction_type;

          if (predictionType === "churn") {
            queryClient.invalidateQueries({ queryKey: ["churn-predictions"] });
          } else if (predictionType === "anomaly") {
            queryClient.invalidateQueries({
              queryKey: ["anomaly-predictions"],
            });
          } else if (predictionType === "revenue") {
            queryClient.invalidateQueries({
              queryKey: ["revenue-predictions"],
            });
          }

          // Invalidate all ML predictions query
          queryClient.invalidateQueries({ queryKey: ["ml-predictions"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
