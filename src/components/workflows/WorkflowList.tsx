"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Edit2,
  Pause,
  Play,
  Plus,
  Trash2,
} from "lucide-react";

export interface Workflow {
  id: string;
  name: string;
  status: "active" | "paused" | "error" | "draft";
  lastRun?: string;
  nextRun?: string;
  nodeCount: number;
  runsToday: number;
}

interface WorkflowListProps {
  workflows: Workflow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
}

const statusConfig = {
  active: {
    icon: CheckCircle,
    label: "Active",
    color: "bg-foreground text-background",
  },
  paused: {
    icon: Pause,
    label: "Paused",
    color: "bg-muted text-muted-foreground",
  },
  error: {
    icon: AlertCircle,
    label: "Error",
    color: "bg-destructive/20 text-destructive",
  },
  draft: { icon: Edit2, label: "Draft", color: "bg-secondary text-foreground" },
};

export function WorkflowList({
  workflows,
  selectedId,
  onSelect,
  onNew,
  onDelete,
  onToggleStatus,
}: WorkflowListProps) {
  return (
    <div className="w-80 border-r-2 border-border bg-card flex flex-col h-full">
      <div className="p-4 border-b-2 border-border flex items-center justify-between">
        <div>
          <h3 className="font-bold uppercase tracking-wide">Workflows</h3>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            {workflows.length} workflow{workflows.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button size="sm" onClick={onNew}>
          <Plus className="w-4 h-4 mr-1" />
          New
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {workflows.map((workflow) => {
          const status = statusConfig[workflow.status];
          const StatusIcon = status.icon;

          return (
            <div
              key={workflow.id}
              className={cn(
                "p-4 border-b-2 border-border cursor-pointer transition-colors",
                selectedId === workflow.id ? "bg-accent" : "hover:bg-accent/50",
              )}
              onClick={() => onSelect(workflow.id)}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-bold uppercase tracking-wide text-sm truncate pr-2">
                  {workflow.name}
                </h4>
                <span
                  className={cn(
                    "text-xs font-mono px-2 py-0.5 border shrink-0",
                    status.color,
                  )}
                >
                  {status.label}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono mb-3">
                <span>{workflow.nodeCount} nodes</span>
                <span>{workflow.runsToday} runs today</span>
              </div>

              {workflow.lastRun && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <Clock className="w-3 h-3" />
                  <span>Last: {workflow.lastRun}</span>
                </div>
              )}

              {workflow.nextRun && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>Next: {workflow.nextRun}</span>
                </div>
              )}

              <div className="flex items-center gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleStatus(workflow.id);
                  }}
                >
                  {workflow.status === "active" ? (
                    <>
                      <Pause className="w-3 h-3 mr-1" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 mr-1" />
                      Start
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border h-7 px-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(workflow.id);
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
