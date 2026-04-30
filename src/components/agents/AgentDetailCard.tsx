"use client";

import { Button } from "@/components/ui/button";
import type { Agent } from "@/data/agentsData";
import { cn } from "@/lib/utils";
import {
  Activity,
  AlertCircle,
  Brain,
  CheckCircle,
  Clock,
  Pause,
  Play,
  TrendingUp,
  Zap,
} from "lucide-react";

interface AgentDetailCardProps {
  agent: Agent;
  isSelected: boolean;
  onSelect: () => void;
  onToggle: () => void;
}

export function AgentDetailCard({
  agent,
  isSelected,
  onSelect,
  onToggle,
}: AgentDetailCardProps) {
  const statusConfig = {
    active: {
      icon: CheckCircle,
      label: "ACTIVE",
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/30",
      dotColor: "bg-emerald-400",
    },
    idle: {
      icon: Clock,
      label: "IDLE",
      color: "text-muted-foreground",
      bgColor: "bg-muted",
      borderColor: "border-muted-foreground/30",
      dotColor: "bg-muted-foreground",
    },
    processing: {
      icon: Activity,
      label: "PROCESSING",
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
      dotColor: "bg-blue-400",
    },
    error: {
      icon: AlertCircle,
      label: "ERROR",
      color: "text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30",
      dotColor: "bg-red-400",
    },
  };

  const config = statusConfig[agent.status];
  const StatusIcon = config.icon;

  // Determine agent type icon
  const agentTypeIcon = () => {
    const role = agent.role.toLowerCase();
    if (role.includes("monitor") || role.includes("kpi")) return <Activity className="w-4 h-4" />;
    if (role.includes("predict") || role.includes("ml") || role.includes("inference")) return <Brain className="w-4 h-4" />;
    if (role.includes("decision") || role.includes("severity") || role.includes("classif")) return <TrendingUp className="w-4 h-4" />;
    if (role.includes("action") || role.includes("execut") || role.includes("workflow")) return <Zap className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  const successPct = (agent.metrics.successRate * 100);
  const confidencePct = (agent.metrics.avgConfidence * 100);

  return (
    <div
      className={cn(
        "border-2 bg-card p-4 shadow-xs transition-all cursor-pointer group",
        isSelected
          ? "border-foreground shadow-md"
          : "border-border hover:border-muted-foreground",
      )}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "w-8 h-8 border-2 flex items-center justify-center transition-colors",
            isSelected ? "border-foreground bg-foreground/5" : "border-border bg-muted/30",
          )}>
            {agentTypeIcon()}
          </div>
          <div>
            <h3 className="font-bold uppercase tracking-wide text-xs leading-tight">
              {agent.name}
            </h3>
            <p className="text-[10px] text-muted-foreground font-mono leading-tight">
              {agent.role.length > 30 ? agent.role.slice(0, 30) + "…" : agent.role}
            </p>
          </div>
        </div>
        <span
          className={cn(
            "text-[10px] font-mono px-2 py-0.5 border flex items-center gap-1",
            config.bgColor,
            config.borderColor,
            config.color,
          )}
        >
          <span className={cn("w-1.5 h-1.5 rounded-full", config.dotColor, agent.status === "active" && "animate-pulse", agent.status === "processing" && "animate-ping")} />
          {config.label}
        </span>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-3 gap-1.5 text-[10px] mb-2.5">
        <div className="border border-border p-1.5 text-center">
          <span className="text-muted-foreground block leading-tight">Decisions</span>
          <span className="font-mono font-bold text-xs">
            {agent.metrics.totalDecisions.toLocaleString()}
          </span>
        </div>
        <div className="border border-border p-1.5 text-center">
          <span className="text-muted-foreground block leading-tight">Success</span>
          <span className={cn(
            "font-mono font-bold text-xs",
            successPct >= 90 ? "text-emerald-400" : successPct >= 70 ? "text-amber-400" : "text-red-400",
          )}>
            {successPct.toFixed(0)}%
          </span>
        </div>
        <div className="border border-border p-1.5 text-center">
          <span className="text-muted-foreground block leading-tight">Conf.</span>
          <span className="font-mono font-bold text-xs">
            {confidencePct.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-2.5">
        <div className="h-1 bg-border w-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-500",
              successPct >= 90 ? "bg-emerald-400" : successPct >= 70 ? "bg-amber-400" : "bg-red-400",
            )}
            style={{ width: `${Math.min(successPct, 100)}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border pt-2">
        <span className="text-[10px] text-muted-foreground truncate max-w-[60%]">
          {agent.lastAction ? agent.lastAction : "No recent actions"}
        </span>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-6 text-[10px] px-2",
            agent.config.enabled
              ? "border-muted-foreground/30"
              : "border-emerald-500/30 text-emerald-400",
          )}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
        >
          {agent.config.enabled ? (
            <>
              <Pause className="w-2.5 h-2.5 mr-1" />
              Pause
            </>
          ) : (
            <>
              <Play className="w-2.5 h-2.5 mr-1" />
              Start
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
