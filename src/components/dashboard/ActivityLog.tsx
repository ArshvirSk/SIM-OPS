"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Bot,
  Brain,
  CheckCircle,
  Info,
  Server,
  Workflow,
  XCircle,
} from "lucide-react";

type LogType = "success" | "warning" | "info" | "error";
type LogSource = "workflow" | "ml" | "agent" | "system";

interface LogEntry {
  id: string;
  type: LogType;
  source: LogSource;
  message: string;
  timestamp: string;
  details?: string;
}

interface ActivityLogProps {
  entries: LogEntry[];
}

export function ActivityLog({ entries }: ActivityLogProps) {
  const getTypeIcon = (type: LogType) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case "warning":
        return <AlertTriangle className="w-3 h-3 text-yellow-500" />;
      case "error":
        return <XCircle className="w-3 h-3 text-destructive" />;
      default:
        return <Info className="w-3 h-3 text-blue-500" />;
    }
  };

  const getSourceIcon = (source: LogSource) => {
    switch (source) {
      case "workflow":
        return <Workflow className="w-3 h-3" />;
      case "ml":
        return <Brain className="w-3 h-3" />;
      case "agent":
        return <Bot className="w-3 h-3" />;
      default:
        return <Server className="w-3 h-3" />;
    }
  };

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Activity Log</span>
      </div>
      <ScrollArea className="h-100">
        <div className="divide-y divide-border/60">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-start gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors"
            >
              {/* Colour dot */}
              <span
                className={cn(
                  "mt-1.5 w-1.5 h-1.5 rounded-full shrink-0",
                  entry.type === "error" && "bg-destructive",
                  entry.type === "warning" && "bg-yellow-500",
                  entry.type === "success" && "bg-emerald-500",
                  entry.type === "info" && "bg-blue-500",
                )}
              />
              {/* Source icon */}
              <span className="mt-0.5 text-muted-foreground shrink-0">
                {getSourceIcon(entry.source)}
              </span>
              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono truncate leading-snug">{entry.message}</p>
                {entry.details && (
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">{entry.details}</p>
                )}
              </div>
              {/* Timestamp */}
              <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums mt-0.5">
                {entry.timestamp}
              </span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
