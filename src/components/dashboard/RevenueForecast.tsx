"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { mlClient } from "@/lib/ml/client";
import { createClient } from "@/lib/supabase/client";
import { DollarSign, RefreshCw, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

interface ForecastResult {
  predictions: Array<{
    date: string;
    predicted_revenue: number;
    day_offset: number;
  }>;
  confidence_intervals: Array<{
    date: string;
    lower_bound: number;
    upper_bound: number;
    confidence_level: number;
  }>;
  trend: "increasing" | "decreasing" | "stable";
  accuracy_metrics: {
    mae: number;
    rmse: number;
    mape: number;
  };
}

export function RevenueForecast() {
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [forecasting, setForecasting] = useState(false);
  const [forecastPeriod, setForecastPeriod] = useState(30);
  const [historicalData, setHistoricalData] = useState<
    Array<{ date: string; revenue: number }>
  >([]);

  useEffect(() => {
    generateForecast();
  }, []);

  const generateForecast = async (periods: number = forecastPeriod) => {
    setForecasting(true);
    try {
      // Fetch historical data from Supabase (using predictions as revenue proxy if actuals don't exist)
      const supabase = createClient();
      const { data: predictions, error } = await supabase
        .from("predictions")
        .select("*")
        .eq("type", "revenue")
        .order("created_at", { ascending: false })
        .limit(60);

      let historical = [];
      if (!error && predictions && predictions.length > 0) {
        historical = predictions.reverse().map((p: any) => {
          const rawValue = 
            (p.prediction as any)?.forecast ||
            (p.prediction as any)?.average_revenue ||
            (p.prediction as any)?.predicted_revenue ||
            (p.prediction as any)?.value ||
            p.predicted_value ||
            30;
          
          // If value is small (e.g. < 1000), assume it needs to be multiplied by 1000 to represent $K
          const revenue = rawValue < 10000 ? rawValue * 1000 : rawValue;
          
          return {
            date: p.created_at.split("T")[0],
            revenue,
          };
        });
      } else {
        // Fallback static deterministic historical data if DB is completely empty
        historical = Array.from({ length: 60 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (59 - i));
          return {
            date: date.toISOString().split("T")[0],
            revenue: 30000 + i * 100,
          };
        });
      }

      setHistoricalData(historical);

      const result = await mlClient.forecastRevenue({
        historical_data: historical,
        forecast_periods: periods,
      });

      setForecast(result);
    } catch (error) {
      console.error("Revenue forecast failed:", error);
    } finally {
      setLoading(false);
      setForecasting(false);
    }
  };

  const handlePeriodChange = (value: string) => {
    const period = parseInt(value);
    setForecastPeriod(period);
    generateForecast(period);
  };

  const getTrendIcon = (trend: string) => {
    if (trend === "increasing") {
      return <TrendingUp className="h-5 w-5 text-green-600" />;
    }
    if (trend === "decreasing") {
      return <TrendingDown className="h-5 w-5 text-red-600" />;
    }
    return <DollarSign className="h-5 w-5 text-blue-600" />;
  };

  const getTrendColor = (trend: string) => {
    if (trend === "increasing") return "text-green-600";
    if (trend === "decreasing") return "text-red-600";
    return "text-blue-600";
  };

  if (loading) {
    return (
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-7 w-28" />
        </div>
        <Skeleton className="h-44 w-full" />
      </div>
    );
  }

  const avgForecast =
    forecast?.predictions && forecast.predictions.length > 0
      ? forecast.predictions.reduce((sum, p) => sum + (p.predicted_revenue || 0), 0) / forecast.predictions.length
      : 0;

  const avgHistorical =
    historicalData && historicalData.length > 0
      ? historicalData.reduce((sum, d) => sum + (d.revenue || 0), 0) / historicalData.length
      : 0;

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Revenue Forecast</span>
        <div className="flex items-center gap-2">
          <Select
            value={forecastPeriod.toString()}
            onValueChange={handlePeriodChange}
          >
            <SelectTrigger className="h-7 w-24 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="14">14 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="60">60 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => generateForecast()}
            disabled={forecasting}
            size="sm"
            variant="ghost"
            className="h-7 gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3 w-3 ${forecasting ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {!forecast ? (
        <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
          <DollarSign className="h-8 w-8 opacity-30" />
          <p className="text-xs">Click Refresh to generate a forecast.</p>
        </div>
      ) : (
        <div className="p-4 space-y-5">
          {/* Compact stat strip */}
          <div className="grid grid-cols-4 divide-x divide-border rounded-lg border bg-muted/20">
            {[
              {
                label: "Trend",
                value: forecast.trend,
                color: getTrendColor(forecast.trend),
                extra: getTrendIcon(forecast.trend),
              },
              {
                label: "Avg Forecast",
                value: `$${avgForecast.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
                color: "text-foreground",
                extra: null,
              },
              {
                label: "Avg Historical",
                value: `$${avgHistorical.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
                color: "text-foreground",
                extra: null,
              },
              {
                label: "Change",
                value: avgHistorical > 0 
                  ? `${(((avgForecast - avgHistorical) / avgHistorical) * 100).toFixed(1)}%`
                  : "—",
                color: avgForecast >= avgHistorical ? "text-emerald-500" : "text-red-500",
                extra: null,
              },
            ].map(({ label, value, color, extra }) => (
              <div key={label} className="flex flex-col items-center gap-0.5 py-3">
                {extra && <span className="mb-0.5">{extra}</span>}
                <span className={`text-sm font-bold tabular-nums capitalize ${color}`}>{value}</span>
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Revenue Trend</span>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-500 inline-block" />Historical</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500/70 inline-block" />Forecast</span>
              </div>
            </div>
            <div className="relative rounded-md border bg-muted/20 overflow-hidden">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none py-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="w-full border-t border-border/40" />
                ))}
              </div>
              <div className="flex items-end h-44 gap-px px-2 pb-2 pt-4 relative">
                {historicalData.slice(-30).map((data, index) => {
                  const allValues = [
                    ...historicalData.slice(-30).map((d) => d.revenue),
                    ...forecast.predictions.map((p) => p.predicted_revenue),
                  ];
                  const maxValue = Math.max(...allValues) || 1;
                  const height = Math.max((data.revenue / maxValue) * 100, 2);
                  return (
                    <div key={`hist-${index}`} className="flex-1 flex flex-col items-center justify-end">
                      <div
                        className="w-full rounded-sm bg-blue-500/70 hover:bg-blue-500 transition-all"
                        style={{ height: `${height}%` }}
                        title={`${data.date}: $${(data.revenue || 0).toFixed(0)}`}
                      />
                    </div>
                  );
                })}
                {forecast.predictions.map((pred, index) => {
                  const allValues = [
                    ...historicalData.slice(-30).map((d) => d.revenue),
                    ...forecast.predictions.map((p) => p.predicted_revenue),
                  ];
                  const maxValue = Math.max(...allValues) || 1;
                  const height = Math.max((pred.predicted_revenue / maxValue) * 100, 2);
                  return (
                    <div key={`pred-${index}`} className="flex-1 flex flex-col items-center justify-end">
                      <div
                        className="w-full rounded-sm bg-emerald-500/60 hover:bg-emerald-500/80 transition-all"
                        style={{ height: `${height}%` }}
                        title={`${pred.date}: $${(pred.predicted_revenue || 0).toFixed(0)} (Forecast)`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center justify-between mt-1 text-[10px] text-muted-foreground">
              <span>← Historical</span>
              <span>Forecast →</span>
            </div>
          </div>

          {/* Accuracy metrics */}
          <div className="grid grid-cols-3 divide-x divide-border rounded-lg border bg-muted/20">
            {[
              { label: "MAE", value: `$${(forecast.accuracy_metrics?.mae || 0).toFixed(0)}`, desc: "Mean Abs. Error" },
              { label: "RMSE", value: `$${(forecast.accuracy_metrics?.rmse || 0).toFixed(0)}`, desc: "Root Mean Sq." },
              { label: "MAPE", value: `${(forecast.accuracy_metrics?.mape || 0).toFixed(2)}%`, desc: "Mean Abs. %" },
            ].map(({ label, value, desc }) => (
              <div key={label} className="flex flex-col items-center gap-0.5 py-3">
                <span className="text-sm font-bold tabular-nums">{value}</span>
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{desc}</span>
              </div>
            ))}
          </div>

          {/* Forecast table */}
          <div>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Next 7 Days</span>
            <div className="mt-2 rounded-md border overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Date</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Predicted</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Low</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">High</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {forecast.predictions.slice(0, 7).map((pred, index) => {
                    const confidence = forecast.confidence_intervals?.[index];
                    const predValue = typeof pred.predicted_revenue === 'number' ? pred.predicted_revenue : 0;
                    const lowBound = typeof confidence?.lower_bound === 'number' ? confidence.lower_bound : predValue * 0.9;
                    const highBound = typeof confidence?.upper_bound === 'number' ? confidence.upper_bound : predValue * 1.1;
                    
                    return (
                      <tr key={index} className="hover:bg-muted/30 transition-colors">
                        <td className="px-3 py-2 tabular-nums">{pred.date}</td>
                        <td className="px-3 py-2 text-right font-semibold tabular-nums">${(predValue || 0).toFixed(0)}</td>
                        <td className="px-3 py-2 text-right text-muted-foreground tabular-nums">${(lowBound || 0).toFixed(0)}</td>
                        <td className="px-3 py-2 text-right text-muted-foreground tabular-nums">${(highBound || 0).toFixed(0)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
