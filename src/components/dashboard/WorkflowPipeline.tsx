"use client";

import { NodeType, WorkflowNode } from "./WorkflowNode";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface WorkflowStep {
  type: NodeType;
  label: string;
  status: "pending" | "running" | "completed" | "error";
}

interface WorkflowPipelineProps {
  name: string;
  steps: WorkflowStep[];
  lastRun?: string;
  nextRun?: string;
}

export function WorkflowPipeline({
  name,
  steps,
  lastRun,
  nextRun,
}: WorkflowPipelineProps) {
  const completedSteps = steps.filter((s) => s.status === "completed").length;
  const progress = (completedSteps / steps.length) * 100;

  return (
    <div className="border-2 border-border bg-card p-6 shadow-sm hover:border-emerald-500/50 transition-colors group">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold uppercase tracking-wide text-lg">{name}</h3>
          <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground mt-1">
            {lastRun && <span>Last Run: {lastRun}</span>}
            {nextRun && <span>Next Run: {nextRun}</span>}
          </div>
        </div>
        <Link href="/workflows">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 px-3 text-xs gap-2 border-2"
          >
            Configure
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>

      {/* Progress bar */}
      <div className="h-2 border-2 border-border mb-4 bg-muted">
        <div
          className="h-full bg-foreground transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Workflow nodes */}
      <div className="flex flex-wrap items-center gap-y-3 overflow-x-auto pb-2">
        {steps.map((step, index) => (
          <WorkflowNode
            key={index}
            type={step.type}
            label={step.label}
            status={step.status}
            isLast={index === steps.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
