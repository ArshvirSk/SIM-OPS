"use client";

import {
  ArrowRight,
  Brain,
  Database,
  FileText,
  Search,
  Send,
  Shield,
  Target,
  Zap,
} from "lucide-react";

interface AgentReasoningFlowProps {
  agentId: string;
}

const agentFlows: Record<
  string,
  { steps: { icon: React.ElementType; label: string; description: string }[] }
> = {
  analyst: {
    steps: [
      {
        icon: Database,
        label: "Data Context",
        description: "Pull churn features and KPI history",
      },
      {
        icon: Search,
        label: "Anomaly Scan",
        description: "Detect deviations from benchmark",
      },
      {
        icon: Brain,
        label: "Risk Synthesis",
        description: "Identify primary churn drivers",
      },
      {
        icon: Send,
        label: "Handover",
        description: "Pass insights to Forecaster",
      },
    ],
  },
  forecaster: {
    steps: [
      {
        icon: Database,
        label: "Signal Input",
        description: "Receive analyst risk drivers",
      },
      {
        icon: Brain,
        label: "ML Projection",
        description: "Predict 30-day churn likelihood",
      },
      {
        icon: Target,
        label: "Impact Analysis",
        description: "Calculate LTV and Revenue at risk",
      },
      {
        icon: Send,
        label: "Trigger",
        description: "Inform Decision Engine",
      },
    ],
  },
  decision: {
    steps: [
      {
        icon: Database,
        label: "Decision Context",
        description: "Aggregate risk and impact data",
      },
      {
        icon: Brain,
        label: "Reasoning Engine",
        description: "Generate root cause and solutions",
      },
      {
        icon: Shield,
        label: "Validation",
        description: "Check against business constraints",
      },
      {
        icon: Zap,
        label: "Dispatch",
        description: "Send instructions to Action Agent",
      },
    ],
  },
  action: {
    steps: [
      {
        icon: Database,
        label: "Instruction",
        description: "Receive solution runbook",
      },
      {
        icon: Brain,
        label: "Execution Plan",
        description: "Map solution to automated tasks",
      },
      {
        icon: Zap,
        label: "API Push",
        description: "Trigger external webhooks/SLAs",
      },
      {
        icon: FileText,
        label: "Final Audit",
        description: "Log outcome and close incident",
      },
    ],
  },
};

export function AgentReasoningFlow({ agentId }: AgentReasoningFlowProps) {
  // Map incoming ID to our canonical keys
  const getAgentKey = (id: string) => {
    const lower = id.toLowerCase();
    if (lower.includes("analyst")) return "analyst";
    if (lower.includes("forecaster")) return "forecaster";
    if (lower.includes("decision")) return "decision";
    if (lower.includes("action")) return "action";
    return "analyst";
  };

  const flowKey = getAgentKey(agentId);
  const flow = agentFlows[flowKey];
  
  if (!flow) {
    return null;
  }

  return (
    <div className="border-2 border-border bg-card">
      <div className="border-b-2 border-border p-4 flex items-center justify-between">
        <h3 className="font-bold uppercase tracking-wide text-sm flex items-center gap-2">
          <Brain className="w-4 h-4" />
          Reasoning Pipeline
        </h3>
        <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 border border-border">
          STEP-BY-STEP LOGIC
        </span>
      </div>

      <div className="p-6">
        <div className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-border">
          {flow.steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="flex items-center gap-4 shrink-0">
                <div className="flex flex-col items-center w-[120px] text-center">
                  <div className="relative">
                    <div className="w-12 h-12 border-2 border-border bg-secondary flex items-center justify-center transition-transform hover:scale-105">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-foreground text-background text-[10px] font-bold flex items-center justify-center rounded-sm border-2 border-card">
                      {index + 1}
                    </div>
                  </div>
                  <span className="text-xs font-bold mt-3 uppercase tracking-tight">
                    {step.label}
                  </span>
                  <p className="text-[10px] text-muted-foreground mt-1 px-1 leading-tight">
                    {step.description}
                  </p>
                </div>
                {index < flow.steps.length - 1 && (
                  <div className="flex flex-col items-center gap-1">
                    <ArrowRight className="w-4 h-4 text-muted-foreground/50" />
                    <div className="w-8 border-t-2 border-dashed border-border" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
