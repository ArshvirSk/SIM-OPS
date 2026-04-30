"use client";

import { ChurnRiskList } from "@/components/dashboard/ChurnRiskList";
import { MLModelPerformance } from "@/components/dashboard/MLModelPerformance";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Brain, Calendar } from "lucide-react";
import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function PredictionsPage() {
  const [timeRange, setTimeRange] = useState("7d");
  const [metricType, setMetricType] = useState("all");

  const { data: predictions, isLoading } = useQuery({
    queryKey: ["predictions", timeRange, metricType],
    queryFn: async () => {
      const supabase = createClient();

      let query = supabase
        .from("predictions")
        .select("*")
        .order("created_at", { ascending: false });

      if (metricType !== "all") {
        query = query.eq("type", metricType);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data;
    },
  });

  // Group predictions by type for charts
  const chartData =
    predictions?.reduce((acc: any[], pred) => {
      const date = new Date(pred.created_at).toLocaleDateString();
      const existing = acc.find((item) => item.date === date);

      // Extract numerical value from prediction JSON
      const predictionValue =
        (pred.prediction as any)?.value ??
        (pred.prediction as any)?.churn_probability ??
        (pred.prediction as any)?.average_probability ??
        (pred.prediction as any)?.avg_probability ??
        (pred.prediction as any)?.probability ??
        (pred.prediction as any)?.predicted_revenue ??
        (pred.prediction as any)?.forecast ??
        (pred.prediction as any)?.expected ??
        (pred.prediction as any)?.predicted_clv ??
        0;

      if (existing) {
        existing[pred.type] = predictionValue;
        existing[`${pred.type}_confidence`] = pred.confidence;
      } else {
        acc.push({
          date,
          [pred.type]: predictionValue,
          [`${pred.type}_confidence`]: pred.confidence,
        });
      }

      return acc;
    }, []) || [];

  const latestPredictions = predictions?.slice(0, 6) || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-wide mb-2">
            ML Predictions
          </h1>
          <p className="text-sm text-muted-foreground font-mono">
            Machine learning forecasts and predictions
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={metricType} onValueChange={setMetricType}>
            <SelectTrigger className="w-40 border-2 font-mono text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Metrics</SelectItem>
              <SelectItem value="churn">Churn</SelectItem>
              <SelectItem value="revenue">Revenue</SelectItem>
              <SelectItem value="cost_anomaly">Cost Anomaly</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32 border-2 font-mono text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Latest Predictions Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {latestPredictions.map((pred) => (
          <Card key={pred.id} className="border-2 border-border p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-mono uppercase text-muted-foreground">
                  {pred.type.replace(/_/g, " ")}
                </span>
              </div>
              <span
                className={`text-xs font-mono px-2 py-0.5 border-2 ${
                  pred.confidence > 0.8
                    ? "bg-green-500/10 border-green-500 text-green-600"
                    : pred.confidence > 0.6
                      ? "bg-yellow-500/10 border-yellow-500 text-yellow-600"
                      : "bg-red-500/10 border-red-500 text-red-600"
                }`}
              >
                {(pred.confidence * 100).toFixed(0)}% confidence
              </span>
            </div>
            <div className="mb-2">
              <div className="text-2xl font-bold font-mono">
                {(() => {
                  const val =
                    (pred.prediction as any)?.value ??
                    (pred.prediction as any)?.churn_probability ??
                    (pred.prediction as any)?.probability ??
                    (pred.prediction as any)?.predicted_revenue ??
                    (pred.prediction as any)?.forecast ??
                    (pred.prediction as any)?.expected;
                  return typeof val === "number"
                    ? val.toLocaleString()
                    : (val ?? "N/A");
                })()}
              </div>
              <div className="text-xs text-muted-foreground">
                Predicted Value
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              {new Date(pred.created_at).toLocaleString()}
            </div>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="border-2 border-border bg-card">
          <TabsTrigger value="trends" className="font-mono uppercase text-xs">
            Trends
          </TabsTrigger>
          <TabsTrigger
            value="confidence"
            className="font-mono uppercase text-xs"
          >
            Confidence
          </TabsTrigger>
          <TabsTrigger value="history" className="font-mono uppercase text-xs">
            History
          </TabsTrigger>
          <TabsTrigger
            value="customers"
            className="font-mono uppercase text-xs"
          >
            Customer Risks
          </TabsTrigger>
          <TabsTrigger
            value="performance"
            className="font-mono uppercase text-xs"
          >
            Model Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="mt-4">
          <div className="border-2 border-border bg-card p-6">
            <h3 className="font-bold uppercase tracking-wide text-sm mb-4">
              Prediction Trends
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: "12px" }}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: "12px" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "2px solid hsl(var(--border))",
                    fontSize: "12px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="churn"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Churn"
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Revenue"
                />
                <Line
                  type="monotone"
                  dataKey="cost_anomaly"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  name="Cost Anomaly"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="confidence" className="mt-4">
          <div className="border-2 border-border bg-card p-6">
            <h3 className="font-bold uppercase tracking-wide text-sm mb-4">
              Confidence Scores
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: "12px" }}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: "12px" }}
                  domain={[0, 1]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "2px solid hsl(var(--border))",
                    fontSize: "12px",
                  }}
                  formatter={(value) => `${(Number(value) * 100).toFixed(0)}%`}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="churn_confidence"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.2}
                  name="Churn Confidence"
                />
                <Area
                  type="monotone"
                  dataKey="revenue_confidence"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.2}
                  name="Revenue Confidence"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          {/* Existing Aggregate History */}
          <div className="border-2 border-border bg-card">
            <div className="p-4 border-b-2 border-border">
              <h3 className="font-bold uppercase tracking-wide text-sm">
                Aggregate Trend History
              </h3>
            </div>
            <div className="divide-y-2 divide-border">
              {predictions?.map((pred) => (
                <div
                  key={pred.id}
                  className="p-4 hover:bg-accent transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Brain className="w-4 h-4 text-muted-foreground" />
                      <span className="font-mono text-sm font-medium uppercase">
                        {pred.type.replace(/_/g, " ")}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      {new Date(pred.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Predicted:</span>
                      <span className="ml-2 font-mono font-bold">
                        {(() => {
                          const val =
                            (pred.prediction as any)?.value ??
                            (pred.prediction as any)?.churn_probability ??
                            (pred.prediction as any)?.probability ??
                            (pred.prediction as any)?.average_probability ??
                            (pred.prediction as any)?.avg_probability ??
                            (pred.prediction as any)?.predicted_revenue ??
                            (pred.prediction as any)?.forecast ??
                            (pred.prediction as any)?.expected ??
                            (pred.prediction as any)?.predicted_clv;
                          return typeof val === "number"
                            ? val.toLocaleString()
                            : (val ?? "N/A");
                        })()}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Confidence:</span>
                      <span className="ml-2 font-mono font-bold">
                        {(pred.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="mt-4">
          <ChurnRiskList />
        </TabsContent>

        <TabsContent value="performance" className="mt-4">
          <MLModelPerformance />
        </TabsContent>
      </Tabs>
    </div>
  );
}
