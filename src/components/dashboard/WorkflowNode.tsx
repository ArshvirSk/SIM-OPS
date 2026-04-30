"use client";

import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Bell,
  Brain,
  ChevronRight,
  Clock,
  Database,
  FileText,
  GitBranch,
  Mail,
  Zap,
} from "lucide-react";

export type NodeType =
  | "trigger"
  | "data"
  | "ml"
  | "decision"
  | "action"
  | "report"
  | "condition"
  | "alert"
  | "notify";

interface WorkflowNodeProps {
  type: NodeType;
  label: string;
  status?: "pending" | "running" | "completed" | "error";
  isLast?: boolean;
}

const nodeConfig: Record<NodeType, { icon: React.ElementType; color: string }> =
{
  trigger: { icon: Clock, color: "bg-secondary" },
  data: { icon: Database, color: "bg-accent" },
  ml: { icon: Brain, color: "bg-secondary" },
  decision: { icon: Zap, color: "bg-accent" },
  action: { icon: Mail, color: "bg-secondary" },
  report: { icon: FileText, color: "bg-muted" },
  condition: { icon: GitBranch, color: "bg-accent" },
  alert: { icon: AlertTriangle, color: "bg-secondary" },
  notify: { icon: Bell, color: "bg-muted" },
};

export function WorkflowNode({
  type,
  label,
  status = "pending",
  isLast,
}: WorkflowNodeProps) {
  const config = nodeConfig[type] ?? { icon: Zap, color: "bg-secondary" };
  const Icon = config.icon;

  const statusStyles = {
    pending: "border-muted-foreground opacity-50",
    running: "border-foreground shadow-sm animate-pulse",
    completed: "border-foreground",
    error: "border-destructive bg-destructive/10",
  };

  return (
    <div className="flex items-center">
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 border-2 transition-all",
          config.color,
          statusStyles[status],
        )}
      >
        <Icon className="w-5 h-5" />
        <span className="font-mono text-sm uppercase tracking-wide">
          {label}
        </span>
        {status === "completed" && <div className="w-2 h-2 bg-foreground" />}
        {status === "running" && (
          <div className="w-2 h-2 bg-foreground animate-ping" />
        )}
      </div>
      {!isLast && (
        <ChevronRight className="w-5 h-5 mx-2 text-muted-foreground" />
      )}
    </div>
  );
}
