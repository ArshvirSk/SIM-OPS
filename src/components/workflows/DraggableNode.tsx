"use client";

import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Brain,
  Clock,
  Database,
  FileText,
  GitBranch,
  Mail,
  Send,
  Zap,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { useDrag } from "react-dnd";

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

interface NodeConfig {
  icon: React.ElementType;
  label: string;
  color: string;
  description: string;
}

export const nodeConfigs: Record<NodeType, NodeConfig> = {
  trigger: {
    icon: Clock,
    label: "Trigger",
    color: "bg-secondary",
    description: "Start workflow on schedule or event",
  },
  data: {
    icon: Database,
    label: "Data Fetch",
    color: "bg-accent",
    description: "Retrieve data from sources",
  },
  ml: {
    icon: Brain,
    label: "ML Model",
    color: "bg-secondary",
    description: "Run ML inference",
  },
  decision: {
    icon: Zap,
    label: "Decision",
    color: "bg-accent",
    description: "Apply business rules",
  },
  condition: {
    icon: GitBranch,
    label: "Condition",
    color: "bg-muted",
    description: "Branch based on conditions",
  },
  action: {
    icon: Send,
    label: "Action",
    color: "bg-secondary",
    description: "Execute automated action",
  },
  alert: {
    icon: AlertTriangle,
    label: "Alert",
    color: "bg-destructive/10",
    description: "Send alert notification",
  },
  notify: {
    icon: Mail,
    label: "Notify",
    color: "bg-secondary",
    description: "Send email or message",
  },
  report: {
    icon: FileText,
    label: "Report",
    color: "bg-muted",
    description: "Generate report",
  },
};

interface DraggableNodeProps {
  type: NodeType;
  isTemplate?: boolean;
}

export function DraggableNode({
  type,
  isTemplate = false,
}: DraggableNodeProps) {
  const config = nodeConfigs[type];
  const Icon = config.icon;
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: "workflow-node",
    item: { type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  useEffect(() => {
    if (ref.current) {
      drag(ref.current);
    }
  }, [drag]);

  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center gap-3 px-4 py-3 border-2 border-border cursor-grab active:cursor-grabbing transition-all select-none",
        config.color,
        isDragging && "opacity-50 shadow-md",
        isTemplate && "hover:shadow-xs hover:border-foreground",
      )}
    >
      <Icon className="w-5 h-5 shrink-0" />
      <div className="min-w-0">
        <p className="font-mono text-sm font-medium uppercase tracking-wide truncate">
          {config.label}
        </p>
        {isTemplate && (
          <p className="text-xs text-muted-foreground truncate">
            {config.description}
          </p>
        )}
      </div>
    </div>
  );
}
