"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import {
  Activity,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Target,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ModelMetrics {
  prediction_type: string;
  total_predictions: number;
  avg_confidence: number;
  high_confidence_count: number;
  low_confidence_count: number;
  predictions_today: number;
  predictions_this_week: number;
}

interface PredictionTrend {
  date: string;
  churn: number;
  anomaly: number;
  revenue: number;
}

export function MLModelPerformance() {
  const [metrics, setMetrics] = useState<ModelMetrics[]>([]);
  const [trends, setTrends] = useState<PredictionTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    setRefreshing(true);
    try {
      const supabase = createClient();

      // Get metrics for each prediction type
      const { data: allPredictions } = await supabase
        .from("ml_predictions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);

      if (allPredictions) {
        // Calculate metrics by type
        const metricsByType = ["churn", "anomaly", "revenue"].map((type) => {
          const typePredictions = allPredictions.filter(
            (p) => p.prediction_type === type,
          );

          const now = new Date();
          const todayStart = new Date(now.setHours(0, 0, 0, 0));
          const weekStart = new Date(now.setDate(now.getDate() - 7));

          return {
            prediction_type: type,
            total_predictions: typePredictions.length,
            avg_confidence:
              typePredictions.reduce((sum, p) => sum + (p.confidence || 0), 0) /
              (typePredictions.length || 1),
            high_confidence_count: typePredictions.filter(
              (p) => (p.confidence || 0) > 0.8,
            ).length,
            low_confidence_count: typePredictions.filter(
              (p) => (p.confidence || 0) < 0.6,
            ).length,
            predictions_today: typePredictions.filter(
              (p) => new Date(p.created_at) >= todayStart,
            ).length,
            predictions_this_week: typePredictions.filter(
              (p) => new Date(p.created_at) >= weekStart,
            ).length,
          };
        });

        setMetrics(metricsByType);

        // Calculate daily trends (last 7 days)
        const trendData: PredictionTrend[] = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toLocaleDateString();

          const dayStart = new Date(date.setHours(0, 0, 0, 0));
          const dayEnd = new Date(date.setHours(23, 59, 59, 999));

          const dayPredictions = allPredictions.filter((p) => {
            const createdAt = new Date(p.created_at);
            return createdAt >= dayStart && createdAt <= dayEnd;
          });

          trendData.push({
            date: dateStr,
            churn: dayPredictions.filter((p) => p.prediction_type === "churn")
              .length,
            anomaly: dayPredictions.filter(
              (p) => p.prediction_type === "anomaly",
            ).length,
            revenue: dayPredictions.filter(
              (p) => p.prediction_type === "revenue",
            ).length,
          });
        }

        setTrends(trendData);
      }
    } catch (error) {
      console.error("Failed to load ML metrics:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>ML Model Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  const totalPredictions = metrics.reduce(
    (sum, m) => sum + m.total_predictions,
    0,
  );
  const avgConfidence =
    metrics.reduce((sum, m) => sum + m.avg_confidence, 0) /
    (metrics.length || 1);
  const totalToday = metrics.reduce((sum, m) => sum + m.predictions_today, 0);
  const totalWeek = metrics.reduce(
    (sum, m) => sum + m.predictions_this_week,
    0,
  );

  // Pie chart data
  const pieData = metrics.map((m) => ({
    name:
      m.prediction_type.charAt(0).toUpperCase() + m.prediction_type.slice(1),
    value: m.total_predictions,
  }));

  const COLORS = [
    "hsl(var(--destructive))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>ML Model Performance Dashboard</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Real-time monitoring of ML prediction accuracy and volume
              </p>
            </div>
            <Button
              onClick={loadMetrics}
              disabled={refreshing}
              size="sm"
              variant="outline"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Predictions
                </p>
                <p className="text-3xl font-bold">
                  {totalPredictions.toLocaleString()}
                </p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Confidence</p>
                <p className="text-3xl font-bold text-green-600">
                  {(avgConfidence * 100).toFixed(1)}%
                </p>
              </div>
              <Target className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today</p>
                <p className="text-3xl font-bold text-blue-600">{totalToday}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-3xl font-bold text-purple-600">
                  {totalWeek}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prediction Volume Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daily Prediction Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="churn"
                    stroke="hsl(var(--destructive))"
                    strokeWidth={2}
                    name="Churn"
                  />
                  <Line
                    type="monotone"
                    dataKey="anomaly"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    name="Anomaly"
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--chart-3))"
                    strokeWidth={2}
                    name="Revenue"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Prediction Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Prediction Type Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) =>
                      `${name}: ${(Number(percent) * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Model Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Model Metrics by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.map((metric) => (
              <div
                key={metric.prediction_type}
                className="border rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold capitalize">
                    {metric.prediction_type} Model
                  </h4>
                  <Badge
                    variant={
                      metric.avg_confidence > 0.8 ? "default" : "secondary"
                    }
                  >
                    {(metric.avg_confidence * 100).toFixed(1)}% confidence
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total</p>
                    <p className="font-bold">{metric.total_predictions}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">High Confidence</p>
                    <p className="font-bold text-green-600">
                      {metric.high_confidence_count}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Low Confidence</p>
                    <p className="font-bold text-orange-600">
                      {metric.low_confidence_count}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Today</p>
                    <p className="font-bold">{metric.predictions_today}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">This Week</p>
                    <p className="font-bold">{metric.predictions_this_week}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">System Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 border rounded-lg p-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="font-medium">ML Service</p>
                <p className="text-sm text-muted-foreground">Operational</p>
              </div>
            </div>

            <div className="flex items-center gap-3 border rounded-lg p-4">
              {avgConfidence > 0.7 ? (
                <CheckCircle className="h-8 w-8 text-green-600" />
              ) : (
                <AlertCircle className="h-8 w-8 text-orange-600" />
              )}
              <div>
                <p className="font-medium">Model Quality</p>
                <p className="text-sm text-muted-foreground">
                  {avgConfidence > 0.7 ? "Good" : "Needs Attention"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 border rounded-lg p-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="font-medium">Predictions</p>
                <p className="text-sm text-muted-foreground">
                  {totalToday > 0 ? "Active" : "Idle"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
