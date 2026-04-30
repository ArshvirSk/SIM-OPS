"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { mlClient } from "@/lib/ml/client";
import { MLDataPipeline } from "@/lib/ml/pipeline";
import { createClient } from "@/lib/supabase/client";
import { AlertTriangle, RefreshCw, TrendingUp, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface ChurnPrediction {
  customer_id: string;
  prediction_data: {
    churn_probability: number;
    risk_level: string;
    contributing_factors?: Array<{
      factor: string;
      importance: number;
      value: number;
    }>;
    recommended_actions?: string[];
  };
  confidence: number;
  created_at: string;
}

export function ChurnRiskList() {
  const router = useRouter();
  const [predictions, setPredictions] = useState<ChurnPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadPredictions();

    // Set up real-time subscription
    const supabase = createClient();
    const channel = supabase
      .channel("churn_predictions_updates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ml_predictions",
          filter: "prediction_type=eq.churn",
        },
        (payload) => {
          console.log("New churn prediction:", payload);
          const newPred = payload.new as ChurnPrediction;

          // Show toast for high-risk predictions
          if (newPred.prediction_data?.churn_probability > 0.7) {
            toast({
              title: "High Churn Risk Detected",
              description: `Customer ${newPred.customer_id} has ${(newPred.prediction_data.churn_probability * 100).toFixed(0)}% churn probability`,
              variant: "destructive",
            });
          }

          // Reload predictions
          loadPredictions();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadPredictions = async () => {
    try {
      const supabase = createClient();

      // Get latest churn predictions
      const { data, error } = await supabase
        .from("ml_predictions")
        .select("*")
        .eq("prediction_type", "churn")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      setPredictions(data || []);

      // Calculate stats
      const total = data?.length || 0;
      const critical =
        data?.filter((p) => p.prediction_data?.risk_level === "critical")
          .length || 0;
      const high =
        data?.filter((p) => p.prediction_data?.risk_level === "high").length ||
        0;
      const medium =
        data?.filter((p) => p.prediction_data?.risk_level === "medium")
          .length || 0;

      setStats({ total, critical, high, medium });
    } catch (error) {
      console.error("Failed to load predictions:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshPredictions = async () => {
    setRefreshing(true);
    try {
      const supabase = createClient();

      // Fetch recent customers
      const { data: customers } = await supabase
        .from("customers")
        .select("*")
        .order("last_activity", { ascending: false })
        .limit(20);

      if (!customers || customers.length === 0) {
        return;
      }

      // Run predictions
      const newPredictions = await Promise.all(
        customers.map(async (customer) => {
          try {
            const features = MLDataPipeline.extractChurnFeatures(customer);
            const prediction = await mlClient.predictChurn({
              customer_id: customer.id,
              features,
            });

            // Store in database
            await supabase.from("ml_predictions").insert({
              customer_id: customer.id,
              prediction_type: "churn",
              prediction_data: {
                churn_probability: prediction.churn_probability,
                risk_level: prediction.risk_level,
                contributing_factors: prediction.contributing_factors,
                recommended_actions: prediction.recommended_actions,
              },
              confidence: prediction.confidence,
              expires_at: new Date(
                Date.now() + 24 * 60 * 60 * 1000,
              ).toISOString(),
              metadata: {
                model_version: "v1.0",
                timestamp: new Date().toISOString(),
              },
            });

            return prediction;
          } catch (error) {
            console.error(`Prediction failed for ${customer.id}:`, error);
            return null;
          }
        }),
      );

      // Reload predictions
      await loadPredictions();
    } catch (error) {
      console.error("Failed to refresh predictions:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "critical":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    if (riskLevel === "critical" || riskLevel === "high") {
      return <AlertTriangle className="h-4 w-4" />;
    }
    return <TrendingUp className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Churn Risk Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Compact stat strip */}
      <div className="grid grid-cols-4 divide-x divide-border rounded-lg border bg-card">
        {[
          { label: "Analyzed", value: stats.total, color: "text-foreground" },
          { label: "Critical", value: stats.critical, color: "text-red-500" },
          { label: "High", value: stats.high, color: "text-orange-500" },
          { label: "Medium", value: stats.medium, color: "text-yellow-500" },
        ].map(({ label, value, color }) => (
          <div key={label} className="flex flex-col items-center gap-0.5 py-3">
            <span className={`text-xl font-bold tabular-nums ${color}`}>{value}</span>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      {/* Customer list */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">High-Risk Customers</span>
          <Button
            onClick={refreshPredictions}
            disabled={refreshing}
            size="sm"
            variant="ghost"
            className="h-7 gap-1.5 text-xs"
          >
            <RefreshCw
              className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {predictions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
            <Users className="h-8 w-8 opacity-30" />
            <p className="text-xs">No predictions yet — click Refresh to analyse customers.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {predictions.map((prediction) => {
              const prob = prediction.prediction_data?.churn_probability || 0;
              const riskLevel = prediction.prediction_data?.risk_level || "low";
              const barColor =
                prob > 0.8
                  ? "bg-red-500"
                  : prob > 0.6
                    ? "bg-orange-500"
                    : "bg-yellow-500";
              return (
                <div
                  key={prediction.customer_id}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-muted/40 transition-colors cursor-pointer"
                  onClick={() => {
                    router.push(`/customers/${prediction.customer_id}`);
                  }}
                >
                  {/* Left: id + date */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{prediction.customer_id}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(prediction.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Middle: probability bar */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] text-muted-foreground">Churn probability</span>
                      <span className="text-xs font-semibold tabular-nums">{(prob * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColor} transition-all`}
                        style={{ width: `${prob * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Right: badge */}
                  <Badge
                    variant={getRiskColor(riskLevel) as any}
                    className="shrink-0 text-[10px] uppercase tracking-wide"
                  >
                    {riskLevel}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
