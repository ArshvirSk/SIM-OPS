"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import {
  Activity,
  AlertTriangle,
  Bot,
  Brain,
  CheckCircle,
  ChevronRight,
  Clock,
  Cpu,
  MessageSquare,
  Play,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AgentDecision {
  id: string;
  agent_id: string;
  output: string;
  input: string;
  confidence: number;
  severity: string;
  created_at: string;
  reasoning: string;
  workflow_triggered: string | null;
}

interface AgentComm {
  id: string;
  from_agent_id: string;
  to_agent_id: string;
  message_type: string;
  payload: any;
  latency_ms: number | null;
  created_at: string;
}

// ─── Agent metadata ───────────────────────────────────────────────────────────
const AGENT_META: Record<string, { label: string; color: string; icon: any }> =
{
  "monitoring": {
    label: "Monitor",
    color: "bg-blue-500",
    icon: Brain,
  },
  "prediction": {
    label: "Predictor",
    color: "bg-purple-500",
    icon: TrendingUp,
  },
  "decision": {
    label: "Decision",
    color: "bg-orange-500",
    icon: Cpu,
  },
  "action": {
    label: "Action",
    color: "bg-green-500",
    icon: Zap,
  },
  "reporting": {
    label: "Reporter",
    color: "bg-pink-500",
    icon: MessageSquare,
  },
  "feedback": {
    label: "Feedback",
    color: "bg-cyan-500",
    icon: RefreshCw,
  },
};

// ─── Severity badge ────────────────────────────────────────────────────────────
function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, string> = {
    critical: "bg-red-500/15 text-red-400 border-red-500/30",
    high: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    low: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    info: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span
      className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${map[severity] ?? map.info}`}
    >
      {severity.toUpperCase()}
    </span>
  );
}

// ─── Method badge ────────────────────────────────────────────────────────────
function MethodBadge({ method }: { method?: string }) {
  if (method === "llm")
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded border bg-violet-500/15 text-violet-400 border-violet-500/30">
        <Sparkles className="w-2.5 h-2.5" />
        AI Engine
      </span>
    );
  return (
    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border bg-muted text-muted-foreground border-border">
      rules
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function LLMAgentStatus() {
  const [decisions, setDecisions] = useState<AgentDecision[]>([]);
  const [comms, setComms] = useState<AgentComm[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [llmEnabled, setLlmEnabled] = useState<boolean | null>(null);

  // Per-agent decision counts
  const [agentStats, setAgentStats] = useState<
    Record<string, { total: number; llm: number; success: number }>
  >({});

  const supabase = createClient();

  // ── Fetch data ────────────────────────────────────────────────────────────
  const fetchData = async () => {
    setLoading(true);
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [{ data: dec }, { data: comm }] = await Promise.all([
      supabase
        .from("agent_decisions")
        .select("*")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(30),
      supabase
        .from("agent_communications")
        .select("*")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    const decisions = dec ?? [];
    const comms = comm ?? [];

    setDecisions(decisions);
    setComms(comms);

    // Build per-agent stats
    const stats: Record<
      string,
      { total: number; llm: number; success: number }
    > = {};
    for (const d of decisions) {
      const id = d.agent_id;
      if (!stats[id]) stats[id] = { total: 0, llm: 0, success: 0 };
      stats[id].total++;
      // reasoning is stored as a plain string in the live DB
      const reasoningLower = (d.reasoning ?? "").toLowerCase();
      if (reasoningLower.includes("llm") || reasoningLower.includes("ai") || reasoningLower.includes("neural"))
        stats[id].llm++;
      // no outcome column — treat workflow_triggered as a success signal
      if (d.workflow_triggered) stats[id].success++;
    }
    setAgentStats(stats);

    // Check if any decision used LLM
    const anyLLM = decisions.some((d) => {
      const r = (d.reasoning ?? "").toLowerCase();
      return r.includes("llm") || r.includes("ai") || r.includes("neural");
    });
    // If no decisions yet, check env via API
    if (decisions.length === 0) {
      setLlmEnabled(null);
    } else {
      setLlmEnabled(anyLLM);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, []);

  // ── Trigger prediction run ────────────────────────────────────────────────
  const triggerRun = async () => {
    setTriggering(true);
    try {
      const secret = prompt("Enter your CRON_SECRET to trigger agent run:");
      if (!secret) {
        setTriggering(false);
        return;
      }

      const res = await fetch("/api/cron/predictions", {
        method: "POST",
        headers: { Authorization: `Bearer ${secret}` },
      });
      const data = await res.json();

      if (res.ok) {
        toast.success("Agent chain triggered", {
          description: `${data.results?.agentChains ?? 0} agent chains executed`,
        });
        setTimeout(fetchData, 3000);
      } else {
        toast.error("Trigger failed", { description: data.error });
      }
    } finally {
      setTriggering(false);
    }
  };

  // ── Derived metrics ────────────────────────────────────────────────────────
  const totalDecisions = decisions.length;
  const llmDecisions = decisions.filter((d) => {
    const r = (d.reasoning ?? "").toLowerCase();
    return r.includes("llm") || r.includes("ai") || r.includes("neural");
  }).length;
  const successRate =
    totalDecisions > 0
      ? Math.round(
        (decisions.filter((d) => d.workflow_triggered).length /
          totalDecisions) *
        100,
      )
      : 0;
  const criticalCount = decisions.filter(
    (d) => d.severity === "critical",
  ).length;
  const highCount = decisions.filter((d) => d.severity === "high").length;

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
            <Sparkles className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">
              Autonomous AI Agents
            </h3>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </div>
          {llmEnabled === true && (
            <Badge
              variant="outline"
              className="text-violet-400 border-violet-400/40 text-[10px]"
            >
              <Sparkles className="w-2.5 h-2.5 mr-1" />
              LLM Active
            </Badge>
          )}
          {llmEnabled === false && (
            <Badge
              variant="outline"
              className="text-yellow-400 border-yellow-400/40 text-[10px]"
            >
              Rule-based fallback
            </Badge>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={triggerRun}
          disabled={triggering}
          className="text-xs"
        >
          {triggering ? (
            <Activity className="w-3 h-3 mr-2 animate-spin" />
          ) : (
            <Play className="w-3 h-3 mr-2" />
          )}
          Run Agents Now
        </Button>
      </div>

      {/* ── Summary cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Total Decisions",
            value: totalDecisions,
            icon: Bot,
            color: "text-blue-400",
          },
          {
            label: "LLM-Powered",
            value: llmDecisions,
            icon: Sparkles,
            color: "text-violet-400",
          },
          {
            label: "Success Rate",
            value: `${successRate}%`,
            icon: CheckCircle,
            color: "text-green-400",
          },
          {
            label: "Critical Alerts",
            value: criticalCount + highCount,
            icon: AlertTriangle,
            color: "text-red-400",
          },
        ].map((stat) => (
          <Card key={stat.label} className="border bg-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold font-mono">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Agent pipeline cards ──────────────────────────────────────────── */}
      <div>
        <h4 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
          Agent Performance (24h)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {Object.entries(AGENT_META).map(([id, meta]) => {
            const stats = agentStats[id] ?? { total: 0, llm: 0, success: 0 };
            const llmPct =
              stats.total > 0 ? Math.round((stats.llm / stats.total) * 100) : 0;
            const Icon = meta.icon;
            return (
              <Card key={id} className="border bg-card">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${meta.color}`} />
                    <p className="text-xs font-semibold">{meta.label}</p>
                    <Icon className="w-3 h-3 ml-auto text-muted-foreground" />
                  </div>
                  <p className="text-xl font-bold font-mono">{stats.total}</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>LLM usage</span>
                      <span>{llmPct}%</span>
                    </div>
                    <Progress value={llmPct} className="h-1" />
                  </div>
                  {stats.total > 0 && (
                    <MethodBadge
                      method={stats.llm > stats.total / 2 ? "llm" : "rule"}
                    />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ── Agent chain timeline + communications ────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Decisions */}
        <Card className="border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Recent Agent Decisions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {decisions.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                <Bot className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No decisions yet. Run agents to see activity.
              </div>
            ) : (
              <div className="divide-y divide-border max-h-96 overflow-y-auto">
                {decisions.slice(0, 15).map((d) => {
                  const meta = AGENT_META[d.agent_id];
                  const reasoningLower = (d.reasoning ?? "").toLowerCase();
                    const method =
                      reasoningLower.includes("llm") ||
                        reasoningLower.includes("ai") ||
                        reasoningLower.includes("neural")
                        ? "llm"
                        : "rule";
                  return (
                    <div
                      key={d.id}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${meta?.color ?? "bg-muted"}`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="text-xs font-medium">
                            {meta?.label ?? "Agent"}
                          </span>
                          <SeverityBadge severity={d.severity} />
                          <MethodBadge method={method} />
                          {d.workflow_triggered ? (
                            <CheckCircle className="w-3 h-3 text-green-400 ml-auto" />
                          ) : (
                            <Clock className="w-3 h-3 text-muted-foreground ml-auto" />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {(() => {
                            try {
                              const r = JSON.parse(d.reasoning);
                              if (r.llm_analysis) return "Completed deep behavioral analysis";
                              if (r.severity) return `Risk level evaluated as ${r.severity.toUpperCase()}`;
                              if (r.churn_risk) return `Calculated churn risk: ${(r.churn_risk * 100).toFixed(1)}%`;
                              return d.output;
                            } catch {
                              return d.output;
                            }
                          })()}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-muted-foreground font-mono">
                            Cust: {d.input.split(" ").pop()?.substring(0, 8)}...
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            Confidence: {d.confidence?.toFixed(0)}%
                          </span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {new Date(d.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inter-Agent Communications */}
        <Card className="border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Inter-Agent Communications
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {comms.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No communications yet.
              </div>
            ) : (
              <div className="divide-y divide-border max-h-96 overflow-y-auto">
                {comms.slice(0, 15).map((c) => {
                  const fromLabel =
                    AGENT_META[c.from_agent_id]?.label ?? c.from_agent_id.slice(0, 8);
                  const toLabel =
                    AGENT_META[c.to_agent_id]?.label ?? c.to_agent_id.slice(0, 8);
                  const method = c.payload?.method;

                  // Summarize payload
                  let summary = "Data handoff";
                  if (c.payload?.decision) {
                    const d = c.payload.decision;
                    summary = `${d.severity.toUpperCase()} Risk · ${d.actions?.length || 0} Actions`;
                  } else if (c.payload?.analysis) {
                    const a = c.payload.analysis;
                    const risk = a.churn_risk || a.churn_probability || 0;
                    summary = `Analysis: ${(risk * 100).toFixed(0)}% Churn Risk`;
                  } else if (c.payload?.forecast) {
                    summary = "Trend Forecast Data";
                  }

                  return (
                    <div
                      key={c.id}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                          <span className="text-xs font-medium capitalize">
                            {fromLabel}
                          </span>
                          <ChevronRight className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs font-medium capitalize">
                            {toLabel}
                          </span>
                          <MethodBadge method={method} />
                          <span className="text-[10px] text-muted-foreground ml-auto flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {new Date(c.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground font-medium">
                          {summary}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono opacity-50">
                          {c.message_type}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── LLM Info Banner ──────────────────────────────────────────────── */}
      <Card className="border border-violet-500/20 bg-violet-500/5">
        <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <Sparkles className="w-4 h-4 text-violet-400 shrink-0 mt-0.5 sm:mt-0" />
          <div className="flex-1 text-xs text-muted-foreground">
            {llmEnabled ? (
              <span>
                <span className="text-violet-400 font-medium">
                  AI Engine is active.
                </span>{" "}
                Agents use natural language reasoning for complex analysis. 20%
                of customers get full LLM treatment, 20% get rule-based, 60% get
                direct ML predictions.
              </span>
            ) : (
              <span>
                <span className="text-yellow-400 font-medium">
                  AI Engine not configured.
                </span>{" "}
                Add{" "}
                <code className="bg-muted px-1 rounded">GOOGLE_AI_API_KEY</code>{" "}
                to <code className="bg-muted px-1 rounded">.env.local</code> to
                enable LLM-powered agents. System is currently using rule-based
                fallbacks — everything still works!
              </span>
            )}
          </div>
          {!llmEnabled && (
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-violet-400 hover:underline shrink-0"
            >
              Get free API key →
            </a>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
