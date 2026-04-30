"use client";

import type { AgentDecision, DecisionSeverity } from "@/data/agentsData";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  GitBranch,
  Info,
  Lightbulb,
  Search,
  Shield,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useState } from "react";

interface AgentDecisionHistoryProps {
  decisions: AgentDecision[];
}

const severityConfig: Record<
  DecisionSeverity,
  { icon: React.ElementType; color: string; bg: string; accent: string }
> = {
  low: {
    icon: Info,
    color: "text-muted-foreground",
    bg: "bg-muted",
    accent: "border-muted-foreground/30",
  },
  medium: {
    icon: AlertCircle,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    accent: "border-amber-500/30",
  },
  high: {
    icon: AlertTriangle,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    accent: "border-orange-500/30",
  },
  critical: {
    icon: AlertTriangle,
    color: "text-red-500",
    bg: "bg-red-500/10",
    accent: "border-red-500/30",
  },
};

function tryParseReasoning(reasoning: string) {
  try {
    const parsed = JSON.parse(reasoning);
    return parsed;
  } catch {
    return null;
  }
}

function RootCauseSection({ data }: { data: any }) {
  if (!data) return null;
  return (
    <div className="border border-border bg-background p-3">
      <h5 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
        <Search className="w-3 h-3" />
        Root Cause Analysis
      </h5>
      {data.primary_cause && (
        <p className="text-sm font-medium mb-2">{data.primary_cause}</p>
      )}
      {data.contributing_factors && data.contributing_factors.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {data.contributing_factors.map((f: string, i: number) => (
            <span
              key={i}
              className="text-[10px] font-mono bg-muted/60 border border-border px-2 py-0.5 rounded-sm"
            >
              {f}
            </span>
          ))}
        </div>
      )}
      {data.customer_sentiment && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>Sentiment:</span>
          <span
            className={cn(
              "font-mono font-bold uppercase text-[10px] px-1.5 py-0.5 border rounded-sm",
              data.customer_sentiment === "frustrated" &&
                "text-red-400 border-red-500/30 bg-red-500/10",
              data.customer_sentiment === "disengaged" &&
                "text-amber-400 border-amber-500/30 bg-amber-500/10",
              data.customer_sentiment === "at-risk" &&
                "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
            )}
          >
            {data.customer_sentiment}
          </span>
        </div>
      )}
    </div>
  );
}

function SolutionsSection({ solutions }: { solutions: any[] }) {
  if (!solutions || solutions.length === 0) return null;
  return (
    <div className="border border-border bg-background p-3">
      <h5 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
        <Lightbulb className="w-3 h-3" />
        Recommended Solutions
      </h5>
      <div className="space-y-2">
        {solutions.map((s: any, i: number) => (
          <div
            key={i}
            className="flex items-start gap-2 text-xs border-l-2 border-border pl-3 py-1"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-bold text-foreground">
                  {s.action || s.title}
                </span>
                {s.priority && (
                  <span
                    className={cn(
                      "text-[9px] font-mono uppercase px-1.5 py-0 border rounded-sm",
                      s.priority === "immediate" &&
                        "text-red-400 border-red-500/30 bg-red-500/5",
                      s.priority === "short_term" &&
                        "text-amber-400 border-amber-500/30 bg-amber-500/5",
                      s.priority === "long_term" &&
                        "text-blue-400 border-blue-500/30 bg-blue-500/5",
                    )}
                  >
                    {s.priority.replace("_", " ")}
                  </span>
                )}
              </div>
              {s.description && (
                <p className="text-muted-foreground text-[11px]">
                  {s.description}
                </p>
              )}
            </div>
            {(s.effort || s.expected_impact) && (
              <div className="flex gap-2 shrink-0 text-[9px] font-mono text-muted-foreground">
                {s.effort && (
                  <span className="flex items-center gap-0.5">
                    <Zap className="w-2.5 h-2.5" />
                    {s.effort}
                  </span>
                )}
                {s.expected_impact && (
                  <span className="flex items-center gap-0.5">
                    <Target className="w-2.5 h-2.5" />
                    {s.expected_impact}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PreventionSection({ strategies }: { strategies: string[] }) {
  if (!strategies || strategies.length === 0) return null;
  return (
    <div className="border border-border bg-background p-3">
      <h5 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
        <Shield className="w-3 h-3" />
        Prevention Strategies
      </h5>
      <div className="space-y-1">
        {strategies.map((s: string, i: number) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            <span className="text-muted-foreground shrink-0">•</span>
            <span className="text-foreground">{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DecisionItem({ decision }: { decision: AgentDecision }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = severityConfig[decision.severity] || severityConfig.low;
  const Icon = config.icon;
  const parsed = tryParseReasoning(decision.reasoning);

  return (
    <div
      className={cn(
        "border-2 bg-card transition-all",
        isExpanded ? config.accent : "border-border",
      )}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 text-left flex items-start gap-3 hover:bg-accent/30 transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 mt-0.5 shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 mt-0.5 shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Icon className={cn("w-3.5 h-3.5", config.color)} />
            <span
              className={cn(
                "text-xs font-mono px-2 py-0.5 border uppercase font-bold",
                config.bg,
                config.accent,
              )}
            >
              {decision.severity}
            </span>
            {parsed?.method && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-muted border border-border rounded-sm text-muted-foreground">
                {parsed.method === "llm" ? "🧠 Core LLM" : "📋 Rules"}
              </span>
            )}
            <span className="text-xs text-muted-foreground font-mono">
              {decision.timestamp}
            </span>
            <span className="text-xs font-mono ml-auto flex items-center gap-1">
              <Target className="w-3 h-3 text-muted-foreground" />
              {(decision.confidence * 100).toFixed(0)}%
            </span>
          </div>
          <p className="text-sm font-medium truncate">{decision.output}</p>
          {parsed?.estimated_revenue_impact && (
            <p className="text-[11px] text-amber-400 font-mono mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Revenue at risk: {parsed.estimated_revenue_impact}
            </p>
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t-2 border-border p-4 space-y-3 bg-muted/20">
          {/* Input */}
          <div>
            <h4 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" />
              Trigger
            </h4>
            <div className="bg-background border border-border p-2.5 font-mono text-xs">
              {decision.input}
            </div>
          </div>

          {/* Rich structured reasoning */}
          {parsed ? (
            <div className="space-y-3">
              {/* Summary row */}
              {(parsed.severity || parsed.urgency || parsed.churn_risk) && (
                <div className="grid grid-cols-3 gap-2">
                  {parsed.severity && (
                    <div className="border border-border p-2 text-center">
                      <span className="text-[9px] font-mono uppercase text-muted-foreground block">
                        Severity
                      </span>
                      <span
                        className={cn(
                          "text-sm font-mono font-bold uppercase",
                          config.color,
                        )}
                      >
                        {parsed.severity}
                      </span>
                    </div>
                  )}
                  {parsed.urgency && (
                    <div className="border border-border p-2 text-center">
                      <span className="text-[9px] font-mono uppercase text-muted-foreground block">
                        Urgency
                      </span>
                      <span className="text-sm font-mono font-bold">
                        {parsed.urgency.replace("_", " ")}
                      </span>
                    </div>
                  )}
                  {parsed.churn_risk !== undefined && (
                    <div className="border border-border p-2 text-center">
                      <span className="text-[9px] font-mono uppercase text-muted-foreground block">
                        Churn Risk
                      </span>
                      <span
                        className={cn(
                          "text-sm font-mono font-bold",
                          parsed.churn_risk > 0.8
                            ? "text-red-400"
                            : parsed.churn_risk > 0.6
                              ? "text-amber-400"
                              : "text-green-400",
                        )}
                      >
                        {(parsed.churn_risk * 100).toFixed(0)}%
                      </span>
                    </div>
                  )}
                </div>
              )}

              <RootCauseSection data={parsed.root_cause_analysis} />
              <SolutionsSection solutions={parsed.recommended_solutions} />
              <PreventionSection strategies={parsed.prevention_strategies} />

              {/* Actions */}
              {parsed.should_act && parsed.actions && parsed.actions.length > 0 && (
                <div className="border border-border bg-background p-3">
                  <h5 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Zap className="w-3 h-3" />
                    Triggered Actions
                  </h5>
                  <div className="flex flex-wrap gap-1.5">
                    {parsed.actions.map((a: string, i: number) => (
                      <span
                        key={i}
                        className="text-[10px] font-mono bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-sm uppercase"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Fallback for unparseable reasoning */
            <div>
              <h4 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">
                Reasoning Chain
              </h4>
              <div className="bg-background border border-border p-2.5 font-mono text-xs whitespace-pre-wrap">
                {decision.reasoning}
              </div>
            </div>
          )}

          {/* Output */}
          <div>
            <h4 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">
              Output
            </h4>
            <div className="bg-background border border-border p-2.5 font-mono text-xs">
              {decision.output}
            </div>
          </div>

          {decision.workflowTriggered && (
            <div className="flex items-center gap-2 text-sm border-t border-border pt-3">
              <GitBranch className="w-4 h-4" />
              <span className="text-muted-foreground">Workflow triggered:</span>
              <span className="font-mono font-bold">
                {decision.workflowTriggered}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AgentDecisionHistory({ decisions }: AgentDecisionHistoryProps) {
  if (decisions.length === 0) {
    return (
      <div className="border-2 border-border bg-card p-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-2 border-border flex items-center justify-center bg-muted/30">
            <Info className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-mono">
            No decisions recorded yet
          </p>
          <p className="text-xs text-muted-foreground">
            Run the pipeline to generate decision data
          </p>
        </div>
      </div>
    );
  }

  const criticalCount = decisions.filter(
    (d) => d.severity === "critical",
  ).length;
  const highCount = decisions.filter((d) => d.severity === "high").length;

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground px-1">
        <span>{decisions.length} decisions total</span>
        {criticalCount > 0 && (
          <span className="text-red-400">
            {criticalCount} critical
          </span>
        )}
        {highCount > 0 && (
          <span className="text-orange-400">
            {highCount} high
          </span>
        )}
      </div>
      {decisions.map((decision) => (
        <DecisionItem key={decision.id} decision={decision} />
      ))}
    </div>
  );
}
