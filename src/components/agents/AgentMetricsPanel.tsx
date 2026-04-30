"use client";

import type { AgentMetrics } from "@/data/agentsData";
import { cn } from "@/lib/utils";
import { Activity, CheckCircle, Clock, Target, TrendingUp, Zap } from "lucide-react";

interface AgentMetricsPanelProps {
  metrics: AgentMetrics;
  actionsToday: number;
}

export function AgentMetricsPanel({
  metrics,
  actionsToday,
}: AgentMetricsPanelProps) {
  return (
    <div className="border-2 border-border bg-card overflow-hidden">
      <div className="border-b-2 border-border p-4 bg-muted/20 flex items-center justify-between">
        <h3 className="font-bold uppercase tracking-widest text-xs flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Unit Performance Metrics
        </h3>
        <span className="text-[10px] font-mono text-muted-foreground uppercase">Live Telemetry</span>
      </div>

      <div className="p-6 space-y-6">
        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-border p-4 bg-background relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
               <Zap className="w-8 h-8" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-muted-foreground uppercase mb-1">Lifetime Decisions</span>
              <span className="text-2xl font-black font-mono">
                {metrics.totalDecisions.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="border border-border p-4 bg-background relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
               <TrendingUp className="w-8 h-8" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-muted-foreground uppercase mb-1">Actions Today</span>
              <span className="text-2xl font-black font-mono">{actionsToday}</span>
            </div>
          </div>
        </div>

        {/* Success Rate Bar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className={cn("w-4 h-4", metrics.successRate >= 0.9 ? "text-emerald-400" : "text-amber-400")} />
              <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold">
                Operational Success Rate
              </span>
            </div>
            <span className="font-mono font-bold text-sm">
              {(metrics.successRate * 100).toFixed(1)}%
            </span>
          </div>
          <div className="h-3 bg-muted border border-border rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-1000 ease-out",
                metrics.successRate >= 0.9 ? "bg-emerald-400" : 
                metrics.successRate >= 0.7 ? "bg-amber-400" : "bg-red-400"
              )} 
              style={{ width: `${metrics.successRate * 100}%` }} 
            />
          </div>
        </div>

        {/* Confidence Level Bar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-400" />
              <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold">
                Reasoning Confidence Level
              </span>
            </div>
            <span className="font-mono font-bold text-sm">
              {(metrics.avgConfidence * 100).toFixed(1)}%
            </span>
          </div>
          <div className="h-3 bg-muted border border-border rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-400 transition-all duration-1000 ease-out" 
              style={{ width: `${metrics.avgConfidence * 100}%` }} 
            />
          </div>
        </div>

        {/* Footer Metrics */}
        <div className="grid grid-cols-2 gap-4 border-t border-border pt-6">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[9px] font-mono text-muted-foreground uppercase">Avg Latency</span>
            </div>
            <p className="text-base font-mono font-bold">
              {metrics.avgResponseTime.toFixed(2)}s
            </p>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-mono text-muted-foreground uppercase">Uptime Stability</span>
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-base font-mono font-bold text-emerald-400">
              99.98%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
