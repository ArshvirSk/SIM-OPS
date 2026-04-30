"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  TrendingUp,
  Zap
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
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
  YAxis
} from "recharts";

interface PredictionData {
  churn_probability?: number;
  risk_segment?: string;
  anomalies_detected?: boolean;
  severity?: string;
  trend?: string;
  predicted_clv?: number;
}

interface Prediction {
  id: string;
  customer_id: string;
  prediction_type: string;
  prediction_data: PredictionData;
  confidence: number;
  created_at: string;
}

export default function ReportsPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState("all");

  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("ml_predictions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) throw error;
      setPredictions(data || []);
    } catch (error) {
      console.error("Error fetching predictions:", error);
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  };

  const getChurnStats = () => {
    const churnPreds = predictions.filter(
      (p) => p.prediction_type === "churn"
    );
    if (churnPreds.length === 0) return null;
    const high = churnPreds.filter(
      (p) => (p.prediction_data as any)?.churn_probability > 0.7
    ).length;
    const avg = (
      churnPreds.reduce((sum, p) => sum + ((p.prediction_data as any)?.churn_probability || 0), 0) /
      churnPreds.length
    ) * 100;
    return {
      total: churnPreds.length,
      highRisk: high,
      average: avg.toFixed(1),
    };
  };

  const getAnomalyStats = () => {
    const anomalyPreds = predictions.filter(
      (p) => p.prediction_type === "anomaly"
    );
    if (anomalyPreds.length === 0) return null;
    const detected = anomalyPreds.filter(
      (p) => (p.prediction_data as any)?.anomalies_detected
    ).length;
    return {
      total: anomalyPreds.length,
      detected,
      percentage: ((detected / anomalyPreds.length) * 100).toFixed(1),
    };
  };

  const getRevenueTrend = () => {
    const revenuePreds = predictions.filter(
      (p) => p.prediction_type === "revenue"
    );
    if (revenuePreds.length === 0) return null;
    const increasing = revenuePreds.filter(
      (p) => (p.prediction_data as any)?.trend === "increasing"
    ).length;
    const decreasing = revenuePreds.filter(
      (p) => (p.prediction_data as any)?.trend === "decreasing"
    ).length;
    return {
      increasing,
      decreasing,
      stable: revenuePreds.length - increasing - decreasing,
    };
  };

  const getCLVStats = () => {
    const clvPreds = predictions.filter(
      (p) => p.prediction_type === "clv"
    );
    if (clvPreds.length === 0) return null;
    const total = clvPreds.reduce(
      (sum, p) => sum + ((p.prediction_data as any)?.predicted_clv || 0),
      0
    );
    const avg = (total / clvPreds.length).toFixed(2);
    return {
      count: clvPreds.length,
      totalValue: total.toFixed(0),
      average: avg,
    };
  };

  const getPredictionsByType = () => {
    const counts: Record<string, number> = {
      churn: 0,
      clv: 0,
      anomaly: 0,
      revenue: 0,
    };
    predictions.forEach((p) => {
      if (counts.hasOwnProperty(p.prediction_type)) {
        counts[p.prediction_type]++;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  };

  const getDailyTrend = () => {
    const dailyData: Record<string, number> = {};
    predictions.forEach((p) => {
      const date = new Date(p.created_at).toLocaleDateString();
      dailyData[date] = (dailyData[date] || 0) + 1;
    });
    return Object.entries(dailyData)
      .map(([date, count]) => ({ date, count }))
      .slice(-7);
  };

  const getConfidenceDistribution = () => {
    const bins = {
      "0-20%": 0,
      "20-40%": 0,
      "40-60%": 0,
      "60-80%": 0,
      "80-100%": 0,
    };
    predictions.forEach((p) => {
      const conf = p.confidence * 100;
      if (conf < 20) bins["0-20%"]++;
      else if (conf < 40) bins["20-40%"]++;
      else if (conf < 60) bins["40-60%"]++;
      else if (conf < 80) bins["60-80%"]++;
      else bins["80-100%"]++;
    });
    return Object.entries(bins).map(([range, count]) => ({
      range,
      count,
    }));
  };

  const getChurnRiskBreakdown = () => {
    const churnPreds = predictions.filter(
      (p) => p.prediction_type === "churn"
    );
    const critical = churnPreds.filter(
      (p) => (p.prediction_data as any)?.churn_probability > 0.8
    ).length;
    const high = churnPreds.filter(
      (p) =>
        (p.prediction_data as any)?.churn_probability > 0.6 &&
        (p.prediction_data as any)?.churn_probability <= 0.8
    ).length;
    const medium = churnPreds.filter(
      (p) =>
        (p.prediction_data as any)?.churn_probability > 0.4 &&
        (p.prediction_data as any)?.churn_probability <= 0.6
    ).length;
    const low = churnPreds.filter(
      (p) => (p.prediction_data as any)?.churn_probability <= 0.4
    ).length;
    return [
      { name: "Critical (>80%)", value: critical, color: "#dc2626" },
      { name: "High (60-80%)", value: high, color: "#f97316" },
      { name: "Medium (40-60%)", value: medium, color: "#eab308" },
      { name: "Low (<40%)", value: low, color: "#22c55e" },
    ];
  };

  const getAnomalySeverityBreakdown = () => {
    const anomalyPreds = predictions.filter(
      (p) => p.prediction_type === "anomaly"
    );
    const high = anomalyPreds.filter(
      (p) => (p.prediction_data as any)?.severity === "high"
    ).length;
    const medium = anomalyPreds.filter(
      (p) => (p.prediction_data as any)?.severity === "medium"
    ).length;
    const low = anomalyPreds.filter(
      (p) => (p.prediction_data as any)?.severity === "low"
    ).length;
    const normal = anomalyPreds.filter(
      (p) => !(p.prediction_data as any)?.anomalies_detected
    ).length;
    return [
      { severity: "High", count: high },
      { severity: "Medium", count: medium },
      { severity: "Low", count: low },
      { severity: "Normal", count: normal },
    ];
  };

  const getCLVDistribution = () => {
    const clvPreds = predictions.filter(
      (p) => p.prediction_type === "clv"
    );
    const bins: Record<string, number> = {
      "<$10K": 0,
      "$10K-$25K": 0,
      "$25K-$50K": 0,
      "$50K-$100K": 0,
      ">$100K": 0,
    };
    clvPreds.forEach((p) => {
      const clv = (p.prediction_data as any)?.predicted_clv || 0;
      if (clv < 10000) bins["<$10K"]++;
      else if (clv < 25000) bins["$10K-$25K"]++;
      else if (clv < 50000) bins["$25K-$50K"]++;
      else if (clv < 100000) bins["$50K-$100K"]++;
      else bins[">$100K"]++;
    });
    return Object.entries(bins).map(([range, count]) => ({
      range,
      count,
    }));
  };

  const getHourlyTrend = () => {
    const hourlyData: Record<string, number> = {};
    predictions.forEach((p) => {
      const hour = new Date(p.created_at).getHours();
      const hourStr = `${hour.toString().padStart(2, "0")}:00`;
      hourlyData[hourStr] = (hourlyData[hourStr] || 0) + 1;
    });
    const sortedHours = Array.from({ length: 24 }, (_, i) =>
      i.toString().padStart(2, "0") + ":00"
    );
    return sortedHours
      .map((hour) => ({
        hour,
        count: hourlyData[hour] || 0,
      }))
      .filter((d) => d.count > 0);
  };

  const getConfidenceStats = () => {
    if (predictions.length === 0) return null;
    const avgConfidence =
      (predictions.reduce((sum, p) => sum + p.confidence, 0) /
        predictions.length) *
      100;
    const maxConfidence = Math.max(...predictions.map((p) => p.confidence)) * 100;
    const minConfidence = Math.min(...predictions.map((p) => p.confidence)) * 100;
    const highConfidence = predictions.filter((p) => p.confidence > 0.8)
      .length;
    return {
      average: avgConfidence.toFixed(1),
      max: maxConfidence.toFixed(1),
      min: minConfidence.toFixed(1),
      highCount: highConfidence,
      highPercentage: ((highConfidence / predictions.length) * 100).toFixed(1),
    };
  };

  const getModelComparison = () => {
    const models: Record<string, { count: number; avgConfidence: number }> = {
      churn: { count: 0, avgConfidence: 0 },
      clv: { count: 0, avgConfidence: 0 },
      anomaly: { count: 0, avgConfidence: 0 },
      revenue: { count: 0, avgConfidence: 0 },
    };

    predictions.forEach((p) => {
      if (models[p.prediction_type]) {
        models[p.prediction_type].count++;
        models[p.prediction_type].avgConfidence += p.confidence;
      }
    });

    return Object.entries(models)
      .filter(([, v]) => v.count > 0)
      .map(([name, data]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        predictions: data.count,
        avgConfidence: (data.avgConfidence / data.count * 100).toFixed(1),
      }));
  };

  const churnStats = getChurnStats();
  const anomalyStats = getAnomalyStats();
  const revenueTrend = getRevenueTrend();
  const clvStats = getCLVStats();
  const predictionsByType = getPredictionsByType();
  const dailyTrend = getDailyTrend();
  const confidenceDistribution = getConfidenceDistribution();
  const churnRiskBreakdown = getChurnRiskBreakdown();
  const anomalySeverityBreakdown = getAnomalySeverityBreakdown();
  const clvDistribution = getCLVDistribution();
  const hourlyTrend = getHourlyTrend();
  const confidenceStats = getConfidenceStats();
  const modelComparison = getModelComparison();

  const exportToCSV = () => {
    if (predictions.length === 0) {
      alert("No data to export");
      return;
    }

    const headers = [
      "Date",
      "Customer ID",
      "Type",
      "Confidence",
      "Details",
    ];
    const rows = predictions.map((pred) => [
      new Date(pred.created_at).toLocaleString(),
      pred.customer_id,
      pred.prediction_type,
      (pred.confidence * 100).toFixed(1) + "%",
      JSON.stringify(pred.prediction_data),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ml-predictions-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-2">
          <Clock className="w-8 h-8 animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-wide mb-2">
            Reports & Analytics
          </h1>
          <p className="text-sm text-muted-foreground font-mono">
            {predictions.length} predictions analyzed
          </p>
        </div>
        <Button
          onClick={exportToCSV}
          className="font-mono uppercase text-xs"
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {churnStats && (
          <Card className="border-2 border-border p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-mono uppercase">
                  Critical Churn
                </p>
                <p className="text-2xl font-bold mt-2">{churnStats.highRisk}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  &gt;70% risk
                </p>
              </div>
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
          </Card>
        )}

        {anomalyStats && (
          <Card className="border-2 border-border p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-mono uppercase">
                  Anomalies
                </p>
                <p className="text-2xl font-bold mt-2">{anomalyStats.detected}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {anomalyStats.percentage}%
                </p>
              </div>
              <AlertCircle className="w-5 h-5 text-yellow-500" />
            </div>
          </Card>
        )}

        {clvStats && (
          <Card className="border-2 border-border p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-mono uppercase">
                  Avg CLV
                </p>
                <p className="text-2xl font-bold mt-2">
                  ${parseInt(clvStats.average).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Per customer
                </p>
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
          </Card>
        )}

        {confidenceStats && (
          <Card className="border-2 border-border p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-mono uppercase">
                  Confidence
                </p>
                <p className="text-2xl font-bold mt-2">
                  {confidenceStats.average}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Average
                </p>
              </div>
              <CheckCircle className="w-5 h-5 text-blue-500" />
            </div>
          </Card>
        )}

        <Card className="border-2 border-border p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-mono uppercase">
                Total Predictions
              </p>
              <p className="text-2xl font-bold mt-2">{predictions.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                All models
              </p>
            </div>
            <Zap className="w-5 h-5 text-purple-500" />
          </div>
        </Card>

        <Card className="border-2 border-border p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-mono uppercase">
                High Confidence
              </p>
              <p className="text-2xl font-bold mt-2">
                {confidenceStats?.highCount || 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                &gt;80% confident
              </p>
            </div>
            <Activity className="w-5 h-5 text-cyan-500" />
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Predictions by Type */}
        {predictionsByType.some((p) => p.value > 0) && (
          <Card className="border-2 border-border p-4">
            <h3 className="font-bold uppercase text-sm mb-4">
              Predictions by Model
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={predictionsByType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#ef4444" />
                  <Cell fill="#3b82f6" />
                  <Cell fill="#f59e0b" />
                  <Cell fill="#10b981" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Churn Risk Breakdown */}
        {churnRiskBreakdown.some((c) => c.value > 0) && (
          <Card className="border-2 border-border p-4">
            <h3 className="font-bold uppercase text-sm mb-4">
              Churn Risk Distribution
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={churnRiskBreakdown}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Daily Trend */}
        {dailyTrend.length > 0 && (
          <Card className="border-2 border-border p-4">
            <h3 className="font-bold uppercase text-sm mb-4">
              Predictions Last 7 Days
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Anomaly Severity */}
        {anomalySeverityBreakdown.some((a) => a.count > 0) && (
          <Card className="border-2 border-border p-4">
            <h3 className="font-bold uppercase text-sm mb-4">
              Anomaly Severity Levels
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={anomalySeverityBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="severity" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Revenue Trend */}
        {revenueTrend &&
          (revenueTrend.increasing > 0 ||
            revenueTrend.decreasing > 0 ||
            revenueTrend.stable > 0) && (
            <Card className="border-2 border-border p-4">
              <h3 className="font-bold uppercase text-sm mb-4">
                Revenue Trend
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={[revenueTrend]}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="increasing" stackId="a" fill="#10b981" />
                  <Bar dataKey="stable" stackId="a" fill="#6b7280" />
                  <Bar dataKey="decreasing" stackId="a" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

        {/* Confidence Distribution */}
        {confidenceDistribution.some((c) => c.count > 0) && (
          <Card className="border-2 border-border p-4">
            <h3 className="font-bold uppercase text-sm mb-4">
              Confidence Score Distribution
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={confidenceDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* CLV Distribution */}
        {clvDistribution.some((c) => c.count > 0) && (
          <Card className="border-2 border-border p-4">
            <h3 className="font-bold uppercase text-sm mb-4">
              CLV Distribution
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={clvDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Hourly Activity */}
        {hourlyTrend.length > 0 && (
          <Card className="border-2 border-border p-4">
            <h3 className="font-bold uppercase text-sm mb-4">
              Hourly Activity Pattern
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={hourlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#a855f7" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* Model Performance Comparison */}
      {modelComparison.length > 0 && (
        <Card className="border-2 border-border overflow-hidden">
          <div className="p-4 border-b-2 border-border">
            <h3 className="font-bold uppercase tracking-wide text-sm">
              Model Performance Comparison
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b-2 border-border bg-secondary">
                <tr>
                  <th className="px-4 py-3 text-left font-bold uppercase">
                    Model
                  </th>
                  <th className="px-4 py-3 text-right font-bold uppercase">
                    Predictions
                  </th>
                  <th className="px-4 py-3 text-right font-bold uppercase">
                    Avg Confidence
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-border">
                {modelComparison.map((model) => (
                  <tr
                    key={model.name}
                    className="hover:bg-accent transition-colors"
                  >
                    <td className="px-4 py-3 text-xs font-bold uppercase">
                      {model.name}
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-mono">
                      {model.predictions}
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-mono">
                      {model.avgConfidence}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Recent Predictions Table */}
      <Card className="border-2 border-border overflow-hidden">
        <div className="p-4 border-b-2 border-border">
          <h3 className="font-bold uppercase tracking-wide text-sm">
            Recent Predictions (Latest 20)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b-2 border-border bg-secondary">
              <tr>
                <th className="px-4 py-3 text-left font-bold uppercase">
                  Date
                </th>
                <th className="px-4 py-3 text-left font-bold uppercase">
                  Customer
                </th>
                <th className="px-4 py-3 text-left font-bold uppercase">
                  Type
                </th>
                <th className="px-4 py-3 text-left font-bold uppercase">
                  Details
                </th>
                <th className="px-4 py-3 text-right font-bold uppercase">
                  Confidence
                </th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-border">
              {predictions.slice(0, 20).map((pred) => {
                const data = pred.prediction_data;
                let detail = "";
                if (pred.prediction_type === "churn") {
                  detail = `${((data.churn_probability || 0) * 100).toFixed(1)}% churn risk`;
                } else if (pred.prediction_type === "clv") {
                  detail = `CLV: $${((data.predicted_clv || 0) / 1000).toFixed(0)}K`;
                } else if (pred.prediction_type === "anomaly") {
                  detail = `${data.anomalies_detected ? "Anomaly" : "Normal"} (${data.severity || "N/A"})`;
                } else if (pred.prediction_type === "revenue") {
                  detail = `Trend: ${data.trend || "N/A"}`;
                }

                return (
                  <tr
                    key={pred.id}
                    className="hover:bg-accent transition-colors"
                  >
                    <td className="px-4 py-3 text-xs font-mono">
                      {new Date(pred.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-xs">{pred.customer_id}</td>
                    <td className="px-4 py-3 text-xs uppercase font-bold">
                      {pred.prediction_type}
                    </td>
                    <td className="px-4 py-3 text-xs">{detail}</td>
                    <td className="px-4 py-3 text-right text-xs font-mono">
                      {(pred.confidence * 100).toFixed(0)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Detailed Breakdown Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Churn Breakdown */}
        {predictions.filter((p) => p.prediction_type === "churn").length > 0 && (
          <Card className="border-2 border-border overflow-hidden">
            <div className="p-4 border-b-2 border-border">
              <h3 className="font-bold uppercase tracking-wide text-sm">
                Churn Predictions Details
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="border-b-2 border-border bg-secondary">
                  <tr>
                    <th className="px-4 py-2 text-left font-bold uppercase">
                      Risk Level
                    </th>
                    <th className="px-4 py-2 text-right font-bold uppercase">
                      Count
                    </th>
                    <th className="px-4 py-2 text-right font-bold uppercase">
                      %
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-border">
                  {churnRiskBreakdown.map((risk) => {
                    const total = predictions.filter(
                      (p) => p.prediction_type === "churn"
                    ).length;
                    return (
                      <tr key={risk.name} className="hover:bg-accent">
                        <td className="px-4 py-2 font-mono text-xs">
                          {risk.name}
                        </td>
                        <td className="px-4 py-2 text-right font-bold">
                          {risk.value}
                        </td>
                        <td className="px-4 py-2 text-right font-mono">
                          {((risk.value / total) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Anomaly Breakdown */}
        {predictions.filter((p) => p.prediction_type === "anomaly").length > 0 && (
          <Card className="border-2 border-border overflow-hidden">
            <div className="p-4 border-b-2 border-border">
              <h3 className="font-bold uppercase tracking-wide text-sm">
                Anomaly Detection Details
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="border-b-2 border-border bg-secondary">
                  <tr>
                    <th className="px-4 py-2 text-left font-bold uppercase">
                      Severity
                    </th>
                    <th className="px-4 py-2 text-right font-bold uppercase">
                      Count
                    </th>
                    <th className="px-4 py-2 text-right font-bold uppercase">
                      %
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-border">
                  {anomalySeverityBreakdown.map((sev) => {
                    const total = predictions.filter(
                      (p) => p.prediction_type === "anomaly"
                    ).length;
                    return (
                      <tr key={sev.severity} className="hover:bg-accent">
                        <td className="px-4 py-2 font-mono text-xs">
                          {sev.severity}
                        </td>
                        <td className="px-4 py-2 text-right font-bold">
                          {sev.count}
                        </td>
                        <td className="px-4 py-2 text-right font-mono">
                          {((sev.count / total) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* CLV Breakdown */}
        {predictions.filter((p) => p.prediction_type === "clv").length > 0 && (
          <Card className="border-2 border-border overflow-hidden">
            <div className="p-4 border-b-2 border-border">
              <h3 className="font-bold uppercase tracking-wide text-sm">
                CLV Segment Distribution
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="border-b-2 border-border bg-secondary">
                  <tr>
                    <th className="px-4 py-2 text-left font-bold uppercase">
                      Range
                    </th>
                    <th className="px-4 py-2 text-right font-bold uppercase">
                      Count
                    </th>
                    <th className="px-4 py-2 text-right font-bold uppercase">
                      %
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-border">
                  {clvDistribution.map((dist) => {
                    const total = predictions.filter(
                      (p) => p.prediction_type === "clv"
                    ).length;
                    return (
                      <tr key={dist.range} className="hover:bg-accent">
                        <td className="px-4 py-2 font-mono text-xs">
                          {dist.range}
                        </td>
                        <td className="px-4 py-2 text-right font-bold">
                          {dist.count}
                        </td>
                        <td className="px-4 py-2 text-right font-mono">
                          {((dist.count / total) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Confidence Breakdown */}
        {confidenceDistribution.some((c) => c.count > 0) && (
          <Card className="border-2 border-border overflow-hidden">
            <div className="p-4 border-b-2 border-border">
              <h3 className="font-bold uppercase tracking-wide text-sm">
                Confidence Ranges
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="border-b-2 border-border bg-secondary">
                  <tr>
                    <th className="px-4 py-2 text-left font-bold uppercase">
                      Range
                    </th>
                    <th className="px-4 py-2 text-right font-bold uppercase">
                      Count
                    </th>
                    <th className="px-4 py-2 text-right font-bold uppercase">
                      %
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-border">
                  {confidenceDistribution.map((conf) => (
                    <tr key={conf.range} className="hover:bg-accent">
                      <td className="px-4 py-2 font-mono text-xs">
                        {conf.range}
                      </td>
                      <td className="px-4 py-2 text-right font-bold">
                        {conf.count}
                      </td>
                      <td className="px-4 py-2 text-right font-mono">
                        {((conf.count / predictions.length) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
