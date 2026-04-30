"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { Calendar, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface PredictionHistory {
  date: string;
  churn_probability: number;
  confidence: number;
  risk_level: string;
}

interface CustomerPredictionHistoryProps {
  customerId: string;
}

export function CustomerPredictionHistory({
  customerId,
}: CustomerPredictionHistoryProps) {
  const [history, setHistory] = useState<PredictionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [trend, setTrend] = useState<"improving" | "worsening" | "stable">(
    "stable",
  );

  useEffect(() => {
    loadHistory();
  }, [customerId]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("ml_predictions")
        .select("prediction_data, confidence, created_at")
        .eq("customer_id", customerId)
        .eq("prediction_type", "churn")
        .order("created_at", { ascending: true })
        .limit(30);

      if (error) throw error;

      if (data && data.length > 0) {
        const historyData: PredictionHistory[] = data.map((pred) => ({
          date: new Date(pred.created_at).toLocaleDateString(),
          churn_probability: pred.prediction_data.churn_probability || 0,
          confidence: pred.confidence || 0,
          risk_level: pred.prediction_data.risk_level || "unknown",
        }));

        setHistory(historyData);

        // Calculate trend
        if (historyData.length >= 2) {
          const recent = historyData.slice(-3);
          const older = historyData.slice(-6, -3);

          const recentAvg =
            recent.reduce((sum, h) => sum + h.churn_probability, 0) /
            recent.length;
          const olderAvg =
            older.length > 0
              ? older.reduce((sum, h) => sum + h.churn_probability, 0) /
                older.length
              : recentAvg;

          const change = recentAvg - olderAvg;

          if (Math.abs(change) < 0.05) {
            setTrend("stable");
          } else if (change > 0) {
            setTrend("worsening");
          } else {
            setTrend("improving");
          }
        }
      }
    } catch (error) {
      console.error("Failed to load prediction history:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Prediction History</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Prediction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No historical predictions available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const latestPrediction = history[history.length - 1] || {
    churn_probability: 0,
    risk_level: "unknown",
  };
  const oldestPrediction = history[0] || { churn_probability: 0 };
  const totalChange =
    latestPrediction.churn_probability - oldestPrediction.churn_probability;
  const percentChange =
    oldestPrediction.churn_probability > 0
      ? ((totalChange / oldestPrediction.churn_probability) * 100).toFixed(1)
      : "0.0";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Prediction History</CardTitle>
          <div className="flex items-center gap-2">
            {trend === "improving" && (
              <>
                <TrendingDown className="h-5 w-5 text-green-600" />
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800"
                >
                  Improving
                </Badge>
              </>
            )}
            {trend === "worsening" && (
              <>
                <TrendingUp className="h-5 w-5 text-red-600" />
                <Badge variant="destructive">Worsening</Badge>
              </>
            )}
            {trend === "stable" && <Badge variant="secondary">Stable</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Current Risk</p>
            <p className="text-2xl font-bold">
              {(latestPrediction.churn_probability * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {latestPrediction.risk_level.toUpperCase()}
            </p>
          </div>

          <div className="border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Change</p>
            <p
              className={`text-2xl font-bold ${totalChange > 0 ? "text-red-600" : "text-green-600"}`}
            >
              {totalChange > 0 ? "+" : ""}
              {(totalChange * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {percentChange}% relative
            </p>
          </div>

          <div className="border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Data Points</p>
            <p className="text-2xl font-bold">{history.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Last {Math.min(30, history.length)} days
            </p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                interval={Math.floor(history.length / 6)}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                domain={[0, 1]}
              />
              <Tooltip
                formatter={(value: any) => [
                  `${(Number(value) * 100).toFixed(1)}%`,
                  "Churn Risk" as any,
                ]}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="churn_probability"
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                name="Churn Probability"
                dot={{ fill: "hsl(var(--destructive))" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Timeline */}
        <div className="mt-6 space-y-2">
          <h4 className="font-medium text-sm mb-3">Recent Predictions</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {history
              .slice(-10)
              .reverse()
              .map((pred, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between border rounded-lg p-3 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-muted-foreground">{pred.date}</div>
                    <Badge
                      variant={
                        pred.risk_level === "critical"
                          ? "destructive"
                          : pred.risk_level === "high"
                            ? "default"
                            : "secondary"
                      }
                    >
                      {pred.risk_level}
                    </Badge>
                  </div>
                  <div className="font-medium">
                    {(pred.churn_probability * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
