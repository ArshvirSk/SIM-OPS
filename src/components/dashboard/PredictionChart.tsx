"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface DataPoint {
  name: string;
  actual: number;
  predicted: number;
}

interface PredictionChartProps {
  title: string;
  data: DataPoint[];
  unit?: string;
  threshold?: number;
  thresholdLabel?: string;
}

export function PredictionChart({
  title,
  data,
  unit = "",
  threshold,
  thresholdLabel,
}: PredictionChartProps) {
  return (
    <div className="border-2 border-border bg-card p-6 shadow-sm">
      <h3 className="font-bold uppercase tracking-wide mb-4">{title}</h3>
      <div className="h-62.5">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              strokeOpacity={0.5}
            />
            <XAxis
              dataKey="name"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              fontFamily="Space Mono"
              tickLine={false}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              fontFamily="Space Mono"
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}${unit}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "2px solid hsl(var(--border))",
                borderRadius: "0",
                fontFamily: "Space Mono",
                fontSize: "12px",
              }}
              formatter={(value) => [`${value}${unit}`, ""]}
            />
            {threshold && (
              <ReferenceLine
                y={threshold}
                stroke="hsl(var(--destructive))"
                strokeDasharray="5 5"
                label={{
                  value: thresholdLabel || "Threshold",
                  position: "right",
                  fill: "hsl(var(--destructive))",
                  fontSize: 10,
                  fontFamily: "Space Mono",
                }}
              />
            )}
            <Line
              type="monotone"
              dataKey="actual"
              stroke="hsl(var(--foreground))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--foreground))", strokeWidth: 0, r: 4 }}
              name="Actual"
            />
            <Line
              type="monotone"
              dataKey="predicted"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{
                fill: "hsl(var(--muted-foreground))",
                strokeWidth: 0,
                r: 4,
              }}
              name="Predicted"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-6 mt-4 text-xs font-mono">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-foreground" />
          <span>Actual</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-muted-foreground border-dashed border-t-2 border-muted-foreground" />
          <span>Predicted</span>
        </div>
      </div>
    </div>
  );
}
