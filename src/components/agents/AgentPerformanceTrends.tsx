"use client";

import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface TrendData {
  timestamp: string;
  decisions: number;
  confidence: number;
  successRate: number;
  responseTime: number;
}

interface AgentPerformanceTrendsProps {
  agentName: string;
  data?: TrendData[];
}

// Deterministic data generator for demonstration
const generateDeterministicData = (): TrendData[] => {
  const now = Date.now();
  const data: TrendData[] = [];

  for (let i = 23; i >= 0; i--) {
    const timestamp = new Date(now - i * 60 * 60 * 1000);
    const seed = i + 1;
    data.push({
      timestamp: timestamp.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      decisions: Math.floor((seed * 7) % 20) + 5,
      confidence: 0.75 + ((seed * 3) % 20) / 100,
      successRate: 0.85 + ((seed * 5) % 12) / 100,
      responseTime: 0.2 + ((seed * 11) % 80) / 100,
    });
  }

  return data;
};

export function AgentPerformanceTrends({
  agentName,
  data = generateDeterministicData(),
}: AgentPerformanceTrendsProps) {
  const latestData = data[data.length - 1];
  const previousData = data[data.length - 2];

  // Return null if we don't have enough data
  if (!latestData || !previousData) {
    return null;
  }

  const calculateTrend = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change).toFixed(1),
      isPositive: change > 0,
    };
  };

  const confidenceTrend = calculateTrend(
    latestData.confidence,
    previousData.confidence,
  );
  const successTrend = calculateTrend(
    latestData.successRate,
    previousData.successRate,
  );
  const responseTrend = calculateTrend(
    latestData.responseTime,
    previousData.responseTime,
  );

  return (
    <div className="border-2 border-border bg-card">
      <div className="border-b-2 border-border p-4">
        <h3 className="font-bold uppercase tracking-wide text-sm">
          Performance Trends (24h)
        </h3>
        <p className="text-xs text-muted-foreground mt-1">{agentName}</p>
      </div>

      <div className="p-4 space-y-6">
        {/* Key Metrics Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="border border-border p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground uppercase">
                Confidence
              </span>
              <div
                className={cn(
                  "flex items-center gap-1 text-xs font-mono",
                  confidenceTrend.isPositive
                    ? "text-foreground"
                    : "text-destructive",
                )}
              >
                {confidenceTrend.isPositive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {confidenceTrend.value}%
              </div>
            </div>
            <p className="text-xl font-mono font-bold">
              {(latestData.confidence * 100).toFixed(1)}%
            </p>
          </div>

          <div className="border border-border p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground uppercase">
                Success
              </span>
              <div
                className={cn(
                  "flex items-center gap-1 text-xs font-mono",
                  successTrend.isPositive
                    ? "text-foreground"
                    : "text-destructive",
                )}
              >
                {successTrend.isPositive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {successTrend.value}%
              </div>
            </div>
            <p className="text-xl font-mono font-bold">
              {(latestData.successRate * 100).toFixed(1)}%
            </p>
          </div>

          <div className="border border-border p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground uppercase">
                Response
              </span>
              <div
                className={cn(
                  "flex items-center gap-1 text-xs font-mono",
                  !responseTrend.isPositive
                    ? "text-foreground"
                    : "text-destructive",
                )}
              >
                {responseTrend.isPositive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {responseTrend.value}%
              </div>
            </div>
            <p className="text-xl font-mono font-bold">
              {latestData.responseTime.toFixed(2)}s
            </p>
          </div>
        </div>

        {/* Confidence Chart */}
        <div>
          <h4 className="text-xs font-mono uppercase tracking-wide text-muted-foreground mb-3">
            Confidence Over Time
          </h4>
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={data}>
              <defs>
                <linearGradient
                  id="confidenceGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="timestamp"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 1]}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "2px solid hsl(var(--border))",
                  fontSize: "12px",
                }}
                formatter={(value) => `${(Number(value) * 100).toFixed(1)}%`}
              />
              <Area
                type="monotone"
                dataKey="confidence"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#confidenceGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Success Rate Chart */}
        <div>
          <h4 className="text-xs font-mono uppercase tracking-wide text-muted-foreground mb-3">
            Success Rate Over Time
          </h4>
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={data}>
              <defs>
                <linearGradient
                  id="successGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="hsl(var(--secondary))"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(var(--secondary))"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="timestamp"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 1]}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "2px solid hsl(var(--border))",
                  fontSize: "12px",
                }}
                formatter={(value) => `${(Number(value) * 100).toFixed(1)}%`}
              />
              <Area
                type="monotone"
                dataKey="successRate"
                stroke="hsl(var(--secondary))"
                strokeWidth={2}
                fill="url(#successGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
