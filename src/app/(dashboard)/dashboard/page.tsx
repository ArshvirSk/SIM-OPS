"use client";

import { ActivityLog } from "@/components/dashboard/ActivityLog";
import { AgentCard } from "@/components/dashboard/AgentCard";
import { AnomalyDetector } from "@/components/dashboard/AnomalyDetector";
import { ChurnRiskList } from "@/components/dashboard/ChurnRiskList";
import { KPICard } from "@/components/dashboard/KPICard";
import { RevenueForecast } from "@/components/dashboard/RevenueForecast";
import { RiskAlert } from "@/components/dashboard/RiskAlert";
import { SystemStatus } from "@/components/dashboard/SystemStatus";
import { WorkflowPipeline } from "@/components/dashboard/WorkflowPipeline";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAgents } from "@/hooks/useAgents";
import {
  useDashboardActivity,
  useDashboardCharts,
  useDashboardKPIs,
  useDashboardRisks,
  useDashboardWorkflows,
} from "@/hooks/useDashboard";
import { useRealtimeActivity } from "@/hooks/useRealtimeActivity";
import { useRealtimeAgents } from "@/hooks/useRealtimeAgents";
import { useRealtimeMLPredictions } from "@/hooks/useRealtimeMLPredictions";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bot,
  Building2,
  DollarSign,
  GitBranch,
  RefreshCw,
  ShieldCheck,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function DashboardPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  useRealtimeAgents();
  useRealtimeActivity();
  useRealtimeMLPredictions();

  const {
    data: kpis,
    isLoading: kpisLoading,
    refetch: refetchKPIs,
  } = useDashboardKPIs();
  const {
    data: risks,
    isLoading: risksLoading,
    refetch: refetchRisks,
  } = useDashboardRisks();
  const {
    data: activity,
    isLoading: activityLoading,
    refetch: refetchActivity,
  } = useDashboardActivity();
  const { data: dbAgents, isLoading: agentsLoading } = useAgents();
  const { data: chartsData, isLoading: chartsLoading } = useDashboardCharts();
  const { data: workflows, isLoading: workflowsLoading } =
    useDashboardWorkflows();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchKPIs(), refetchRisks(), refetchActivity()]);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const PIPELINE_IDS = new Set([
    "monitoring",
    "prediction",
    "decision",
    "action",
    "reporting",
    "feedback",
  ]);

  const PIPELINE_DEFAULTS = [
    { name: "Analyst",    role: "monitor",    status: "idle" as const, lastAction: "No actions yet", actionsToday: 0 },
    { name: "Forecaster", role: "prediction", status: "idle" as const, lastAction: "No actions yet", actionsToday: 0 },
    { name: "Decision",   role: "decision",   status: "idle" as const, lastAction: "No actions yet", actionsToday: 0 },
    { name: "Action",     role: "action",     status: "idle" as const, lastAction: "No actions yet", actionsToday: 0 },
  ];

  const agents = (() => {
    const pipelineAgents = (dbAgents || []).filter((a) => PIPELINE_IDS.has(a.id));
    if (pipelineAgents.length === 0) return PIPELINE_DEFAULTS;
    return pipelineAgents.map((a) => {
      const decisions = (a.agent_decisions || []) as Array<{
        output: string;
        created_at: string;
      }>;
      const latestDecision = decisions.sort((x, y) =>
        new Date(y.created_at).getTime() - new Date(x.created_at).getTime()
      )[0];
      const lastAction =
        a.last_action ||
        (latestDecision
          ? latestDecision.output.substring(0, 60).trim()
          : null);
      return {
        name: a.name,
        role: a.role,
        status: a.status as "active" | "idle" | "processing" | "error",
        lastAction: lastAction || "No actions yet",
        actionsToday: a.actions_today,
      };
    });
  })();

  const activeAgentCount = agents.filter(
    (a) => a.status === "active" || a.status === "processing",
  ).length;
  const riskCount = risks?.length ?? 0;

  return (
    <div className="space-y-10 pb-16">
      {/* ───────────────────────────── HERO BANNER ───────────────────────────── */}
      <section className="rounded-2xl border border-slate-200 bg-white p-8 relative overflow-hidden">
        {/* Faint watermark */}
        <Bot className="absolute -right-6 -bottom-6 w-56 h-56 text-slate-100 pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between gap-6">
          {/* Left: headline */}
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Autonomous Mode — {activeAgentCount} agent
              {activeAgentCount !== 1 ? "s" : ""} active
            </span>

            <h1 className="text-3xl font-bold text-slate-900 mb-3">
              SIM-OPS Control Center
            </h1>

            <p className="text-slate-500 leading-relaxed">
              SIM-OPS is continuously monitoring your SaaS business data,
              running ML predictions, and executing automated actions. This
              dashboard shows you <strong>what the AI is doing</strong> and{" "}
              <strong>what it has found</strong>.
            </p>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                variant="outline"
                className="gap-2"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
                {isRefreshing ? "Syncing…" : "Refresh All"}
              </Button>
              <Link href="/acme-corp">
                <Button variant="outline" className="gap-2">
                  <Building2 className="w-4 h-4" />
                  Open Business Dashboard
                </Button>
              </Link>
            </div>
          </div>

          {/* Right: quick stats */}
          <div className="grid grid-cols-2 gap-4 shrink-0 self-center">
            <div className="bg-slate-50 rounded-xl p-4 text-center min-w-[120px]">
              <p className="text-3xl font-bold text-slate-900">
                {activeAgentCount}
              </p>
              <p className="text-xs text-slate-500 mt-1">Agents Online</p>
            </div>
            <div
              className={`rounded-xl p-4 text-center min-w-[120px] transition-all ${riskCount > 0
                  ? "bg-red-50 text-red-700 cursor-pointer hover:bg-red-100 hover:shadow-md active:scale-95"
                  : "bg-emerald-50 text-emerald-700"
                }`}
              onClick={() => {
                if (riskCount > 0) {
                  document
                    .getElementById("risks-section")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              }}
              title={riskCount > 0 ? "Click to view open risks" : undefined}
            >
              <p className="text-3xl font-bold">{riskCount}</p>
              <p className="text-xs mt-1 opacity-70">
                {riskCount > 0 ? "Open Risks ↓" : "All Clear ✓"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────── SECTION 1: AGENTS + SYSTEM HEALTH ─────────────── */}
      <section>
        <SectionHeader
          icon={<Bot className="w-5 h-5 text-indigo-500" />}
          title="AI Agents"
          subtitle="These are the autonomous agents currently analyzing your data and making decisions."
        />

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mt-4">
          {/* Agents — 3 cols */}
          <div className="xl:col-span-3">
            {agentsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-36 rounded-xl" />
                ))}
              </div>
            ) : agents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {agents.map((agent) => (
                  <AgentCard key={agent.name} {...agent} />
                ))}
              </div>
            ) : (
              <EmptyState text="No agents configured yet." />
            )}
          </div>

          {/* System Health — 1 col */}
          <div>
            <SystemStatus />
          </div>
        </div>
      </section>

      {/* ────────────── SECTION 2: ACTIVE PLAYBOOKS (WORKFLOWS) ──────────── */}
      <section>
        <SectionHeader
          icon={<GitBranch className="w-5 h-5 text-emerald-500" />}
          title="Active Playbooks"
          subtitle="Automated workflows that trigger when the agents detect issues."
        />
        <div className="mt-4">
          {workflowsLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Skeleton className="h-36 rounded-xl" />
              <Skeleton className="h-36 rounded-xl" />
            </div>
          ) : workflows && workflows.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {workflows.map((wf, i) => (
                <WorkflowPipeline key={i} {...wf} />
              ))}
            </div>
          ) : (
            <EmptyState text="No playbooks are running right now." />
          )}
        </div>
      </section>

      {/* ──────────────── SECTION 3: BUSINESS IMPACT + RISKS ─────────────── */}
      <section>
        <SectionHeader
          icon={<TrendingUp className="w-5 h-5 text-blue-500" />}
          title="Business Impact"
          subtitle="Real-time KPIs that reflect how the AI's decisions are affecting your business."
        />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mt-4">
          {/* KPI Grid — 2 cols */}
          <div className="xl:col-span-2">
            {kpisLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-32 rounded-xl" />
                ))}
              </div>
            ) : kpis ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <KPICard
                  title="Monthly Revenue"
                  value={`$${(kpis.revenue / 1000).toFixed(0)}K`}
                  change={kpis.revenueChange}
                  predicted={`$${(kpis.revenuePredicted / 1000).toFixed(0)}K`}
                  icon={<DollarSign className="w-5 h-5 text-green-600" />}
                />
                <KPICard
                  title="Active Customers"
                  value={kpis.customers.toLocaleString()}
                  change={kpis.customersChange}
                  predicted={kpis.customersPredicted.toLocaleString()}
                  icon={<Users className="w-5 h-5 text-blue-600" />}
                />
                <KPICard
                  title="Churn Rate"
                  value={`${kpis.churnRate}%`}
                  change={kpis.churnRateChange}
                  predicted={`${kpis.churnRatePredicted}%`}
                  icon={<TrendingUp className="w-5 h-5 text-amber-500" />}
                  isNegativeGood
                />
                <KPICard
                  title="Active Alerts"
                  value={kpis.alerts.toString()}
                  change={kpis.alertsChange}
                  icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
                  isNegativeGood
                />
                <KPICard
                  title="Active Agents"
                  value={kpis.activeAgents.toString()}
                  change={kpis.activeAgentsChange}
                  icon={<Activity className="w-5 h-5 text-purple-500" />}
                />
                <KPICard
                  title="Automation Rate"
                  value={`${kpis.automationRate}%`}
                  change={kpis.automationRateChange}
                  icon={<Target className="w-5 h-5 text-emerald-500" />}
                />
              </div>
            ) : null}
          </div>

          {/* Risks — 1 col */}
          <div id="risks-section">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <h3 className="font-semibold text-sm">
                Requires Attention ({riskCount})
              </h3>
            </div>
            {risksLoading ? (
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <Skeleton key={i} className="h-28 rounded-xl" />
                ))}
              </div>
            ) : riskCount > 0 ? (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {risks!.map((risk) => (
                  <RiskAlert key={risk.id} {...risk} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 p-8 text-center h-full flex flex-col items-center justify-center">
                <ShieldCheck className="w-10 h-10 text-emerald-400 mb-3" />
                <p className="font-medium text-emerald-800 text-sm">
                  All clear
                </p>
                <p className="text-emerald-600/70 text-xs mt-1">
                  No issues need human attention right now.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─────────────────── SECTION 4: DEEP INSIGHTS TABS ───────────────── */}
      <section>
        {/* Section header */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-500/10">
              <BarChart3 className="w-4 h-4 text-violet-500" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight text-foreground">Deep Insights</h2>
              <p className="text-xs text-muted-foreground">ML predictions &amp; agent activity</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="churn" className="mt-4">
          {/* Dark pill tab bar */}
          <TabsList className="inline-flex h-10 items-center rounded-lg bg-muted p-1 text-muted-foreground w-full gap-0.5">
            <TabsTrigger
              value="churn"
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all
                data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm
                data-[state=inactive]:hover:text-foreground/80"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Churn</span>
            </TabsTrigger>
            <TabsTrigger
              value="anomaly"
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all
                data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm
                data-[state=inactive]:hover:text-foreground/80"
            >
              <Activity className="w-3.5 h-3.5 text-purple-500 shrink-0" />
              <span>Anomalies</span>
            </TabsTrigger>
            <TabsTrigger
              value="revenue"
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all
                data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm
                data-[state=inactive]:hover:text-foreground/80"
            >
              <BarChart3 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Revenue</span>
            </TabsTrigger>
            <TabsTrigger
              value="logs"
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all
                data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm
                data-[state=inactive]:hover:text-foreground/80"
            >
              <Bot className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Agent Logs</span>
            </TabsTrigger>
          </TabsList>

          {/* Churn */}
          <TabsContent value="churn" className="mt-6">
            <ExplainerBox
              color="amber"
              text="The ML churn model analyzes each customer's activity, spending, and support history to predict the probability of cancellation. Customers flagged here have a high likelihood of leaving."
            />
            <ChurnRiskList />
          </TabsContent>

          {/* Anomaly */}
          <TabsContent value="anomaly" className="mt-6">
            <ExplainerBox
              color="purple"
              text="The anomaly detector scans transaction patterns and login frequency to identify unusual spikes or drops that deviate from historical norms."
            />
            <AnomalyDetector />
          </TabsContent>

          {/* Revenue */}
          <TabsContent value="revenue" className="mt-6">
            <ExplainerBox
              color="emerald"
              text="Revenue forecasting uses time-series analysis on your MRR data and predicted churn to project the most likely revenue trajectory over the next 4 weeks."
            />
            <RevenueForecast />
          </TabsContent>

          {/* Agent Logs */}
          <TabsContent value="logs" className="mt-6">
            <ExplainerBox
              color="slate"
              text="A chronological log of every decision and action the AI agents have taken. Use this to audit why the system made specific choices."
            />
            {activityLoading ? (
              <Skeleton className="h-60 rounded-xl" />
            ) : activity && activity.length > 0 ? (
              <ActivityLog entries={activity} />
            ) : (
              <EmptyState text="No recent agent activity to display." />
            )}
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}

/* ─────────────────────── Helper Components ─────────────────────── */

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5">{icon}</div>
      <div>
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

function ExplainerBox({ color, text }: { color: string; text: string }) {
  const accentMap: Record<string, string> = {
    amber: "border-l-amber-400 text-amber-900/80",
    purple: "border-l-purple-400 text-purple-900/80",
    emerald: "border-l-emerald-400 text-emerald-900/80",
    slate: "border-l-slate-400 text-slate-600",
  };
  return (
    <div
      className={`mb-4 pl-3 border-l-2 text-xs leading-relaxed text-muted-foreground ${accentMap[color] || accentMap.slate}`}
    >
      {text}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border/60 bg-muted/30 py-10 text-center">
      <p className="text-muted-foreground text-xs">{text}</p>
    </div>
  );
}
