"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Cpu, Database, Server, Wifi } from "lucide-react";

interface SystemMetric {
  name: string;
  value: number;
  status: "healthy" | "warning" | "critical";
  icon: React.ReactNode;
}

export function SystemStatus() {
  const metrics: SystemMetric[] = [
    {
      name: "API Gateway",
      value: 99.9,
      status: "healthy",
      icon: <Server className="w-4 h-4" />,
    },
    {
      name: "Database",
      value: 98.5,
      status: "healthy",
      icon: <Database className="w-4 h-4" />,
    },
    {
      name: "ML Pipeline",
      value: 87.2,
      status: "warning",
      icon: <Cpu className="w-4 h-4" />,
    },
    {
      name: "Agent Network",
      value: 100,
      status: "healthy",
      icon: <Wifi className="w-4 h-4" />,
    },
  ];

  const getStatusColor = (status: SystemMetric["status"]) => {
    switch (status) {
      case "critical":
        return "text-destructive";
      case "warning":
        return "text-yellow-500";
      default:
        return "text-green-500";
    }
  };

  const getProgressColor = (status: SystemMetric["status"]) => {
    switch (status) {
      case "critical":
        return "[&>div]:bg-destructive";
      case "warning":
        return "[&>div]:bg-yellow-500";
      default:
        return "[&>div]:bg-green-500";
    }
  };

  return (
    <Card className="border-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          System Health
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {metrics.map((metric) => (
          <div key={metric.name} className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {metric.icon}
                <span className="text-xs font-mono">{metric.name}</span>
              </div>
              <span
                className={cn(
                  "text-xs font-mono",
                  getStatusColor(metric.status),
                )}
              >
                {metric.value}%
              </span>
            </div>
            <Progress
              value={metric.value}
              className={cn("h-1", getProgressColor(metric.status))}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
