"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import {
  Activity,
  AlertOctagon,
  Database,
  DollarSign,
  Loader2,
  RefreshCw,
  TrendingUp,
  Users,
  Zap,
  Terminal,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ActivityLog } from "@/components/dashboard/ActivityLog";
import { AgentCommunicationPipeline } from "@/components/agents/AgentCommunicationPipeline";
import { useDashboardActivity } from "@/hooks/useDashboard";
import { useRealtimeActivity } from "@/hooks/useRealtimeActivity";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LiveMetrics {
  mrr: number;
  activeUsers: number;
  atRiskUsers: number;
  totalTransactions: number;
  failedTransactions: number;
  churnRate: number;
  healthScore: number;
  isLoading: boolean;
}

async function fetchLiveMetrics(): Promise<Partial<LiveMetrics>> {
  const supabase = createClient();

  // Fetch all customers
  const { data: customers } = await supabase
    .from("customers")
    .select("id, status, total_spend, engagement_score");

  // Fetch transactions for MRR approximation
  const { data: transactions } = await supabase
    .from("transactions")
    .select("amount, status, created_at")
    .gte(
      "created_at",
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    );

  if (!customers) return {};

  const activeUsers = customers.filter((c) => c.status === "active").length;
  const atRiskUsers = customers.filter((c) => c.status === "at_risk").length;
  const totalCustomers = customers.length;

  const completedTxs = (transactions ?? []).filter(
    (t) => t.status === "completed",
  );
  const failedTxs = (transactions ?? []).filter((t) => t.status === "failed");

  const mrr = Math.round(
    completedTxs.reduce((sum, t) => sum + (t.amount ?? 0), 0),
  );

  const churnRate =
    totalCustomers > 0
      ? parseFloat(((atRiskUsers / totalCustomers) * 100).toFixed(1))
      : 0;

  // Health score: weighted by failed txns and at-risk users
  const failureRatio =
    (transactions ?? []).length > 0
      ? failedTxs.length / (transactions ?? []).length
      : 0;
  const atRiskRatio = totalCustomers > 0 ? atRiskUsers / totalCustomers : 0;
  const healthScore = Math.max(
    0,
    Math.min(100, Math.round(100 - failureRatio * 50 - atRiskRatio * 50)),
  );

  return {
    mrr,
    activeUsers,
    atRiskUsers,
    totalTransactions: (transactions ?? []).length,
    failedTransactions: failedTxs.length,
    churnRate,
    healthScore,
    isLoading: false,
  };
}

export default function AcmeDashboard() {
  const { toast } = useToast();
  const [isSimulating, setIsSimulating] = useState(false);
  const [isInjecting, setIsInjecting] = useState(false);
  const [isPipelineRunning, setIsPipelineRunning] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const { data: activityEntries = [] } = useDashboardActivity();
  
  // Enable realtime updates for this page too
  useRealtimeActivity();

  const [metrics, setMetrics] = useState<LiveMetrics>({
    mrr: 0,
    activeUsers: 0,
    atRiskUsers: 0,
    totalTransactions: 0,
    failedTransactions: 0,
    churnRate: 0,
    healthScore: 100,
    isLoading: true,
  });

  const refreshMetrics = useCallback(async () => {
    const live = await fetchLiveMetrics();
    setMetrics((prev) => ({ ...prev, ...live, isLoading: false }));
    setMetricsLoading(false);
  }, []);

  // Initial load
  useEffect(() => {
    refreshMetrics();
  }, [refreshMetrics]);

  // Live simulation loop: tick every 3s + refresh real metrics every 15s
  useEffect(() => {
    let tickInterval: NodeJS.Timeout;
    let refreshInterval: NodeJS.Timeout;

    if (isSimulating) {
      tickInterval = setInterval(async () => {
        try {
          const res = await fetch("/api/demo/tick", { method: "POST" });
          const data = await res.json();
          if (data.event === "transaction" || data.event === "signup") {
            // Optimistic local update
            setMetrics((prev) => ({
              ...prev,
              mrr:
                prev.mrr +
                (data.event === "transaction"
                  ? Math.floor(Math.random() * 150 + 50)
                  : 0),
              activeUsers: prev.activeUsers + (data.event === "signup" ? 1 : 0),
              totalTransactions:
                prev.totalTransactions + (data.event === "transaction" ? 1 : 0),
            }));
          }
        } catch (e) {
          console.error("Simulation tick failed", e);
        }
      }, 3000);

      // Pull real DB values every 15s during simulation
      refreshInterval = setInterval(() => {
        refreshMetrics();
      }, 15000);
    }

    return () => {
      clearInterval(tickInterval);
      clearInterval(refreshInterval);
    };
  }, [isSimulating, refreshMetrics]);

  const toggleSimulation = () => {
    setIsSimulating((prev) => !prev);
    if (!isSimulating) {
      toast({
        title: "Live Simulation Started",
        description: "Injecting authentic traffic patterns into database...",
      });
    } else {
      toast({ title: "Simulation Paused" });
      // Refresh metrics when we stop to get accurate final state
      refreshMetrics();
    }
  };

  const injectChurnEvent = async () => {
    setIsSimulating(false);
    setIsInjecting(true);
    toast({
      title: "⚡ Step 1/2 — Injecting churn signal…",
      description: "Degrading a customer's engagement metrics in the database.",
    });

    try {
      const res = await fetch("/api/demo/churn-signal", { method: "POST" });
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast({
          title: "Churn injection failed",
          description: data.error ?? "Unknown error",
          variant: "destructive",
        });
        setIsInjecting(false);
        return;
      }

      toast({
        title: "✓ Step 1/2 — Signal injected",
        description: `Customer ${data.customerId?.substring(0, 8)}… marked critical. Running SimOps pipeline…`,
      });

      // Step 2: immediately run the agent pipeline so it detects and records the decision
      const pipelineRes = await fetch("/api/agents/run-pipeline", {
        method: "POST",
      });
      const pipelineData = await pipelineRes.json();

      if (pipelineRes.ok) {
        const successCount = pipelineData.results?.filter(
          (r: { success: boolean }) => r.success,
        ).length;
        toast({
          title: "🚨 Churn Scenario Complete",
          description: `Signal injected + ${successCount ?? "?"} customers analysed. Check SimOps dashboard — a new CRITICAL risk should appear.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "✓ Signal injected (pipeline skipped)",
          description:
            "Churn event is recorded. Run the SimOps Pipeline manually to process it.",
        });
      }

      setTimeout(() => refreshMetrics(), 1500);
    } catch {
      toast({ title: "Churn scenario failed", variant: "destructive" });
    } finally {
      setIsInjecting(false);
    }
  };

  const runSimOps = async () => {
    setIsPipelineRunning(true);
    toast({ title: "Triggering SimOps Analysis…", description: "Processing up to 5 customers." });
    try {
      const res = await fetch("/api/agents/run-pipeline", { method: "POST" });
      const data = await res.json();
      if (res.status === 409) {
        toast({
          title: "Pipeline already running",
          description: "Please wait for the current run to finish.",
          variant: "destructive",
        });
        return;
      }
      if (res.ok) {
        const successCount = data.results?.filter(
          (r: { success: boolean }) => r.success,
        ).length;
        toast({
          title: "SimOps Analysis Complete! ✓",
          description: `Processed ${successCount ?? "?"} customers. Check your SimOps dashboard.`,
        });
        refreshMetrics();
      } else {
        toast({
          title: "Pipeline failed. Check console.",
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Pipeline error", variant: "destructive" });
    } finally {
      setIsPipelineRunning(false);
    }
  };


  const syncDashboard = async () => {
    setIsSyncing(true);
    toast({ title: "Syncing dashboard predictions…", description: "Writing aggregate record from latest ML results." });
    try {
      const res = await fetch("/api/demo/sync-dashboard", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({
          title: "✓ Dashboard Synced",
          description: data.message,
        });
        refreshMetrics();
      } else {
        toast({ title: "Sync failed", description: data.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "Sync error", variant: "destructive" });
    } finally {
      setIsSyncing(false);
    }
  };

  const generateHistory = async () => {
    setIsGenerating(true);
    toast({ title: "Generating 6 months of history…", description: "Seeding customers, transactions & predictions." });
    try {
      const res = await fetch("/api/demo/generate-history", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({
          title: "✓ Historical Data Generated",
          description: `${data.stats?.customers} customers · ${data.stats?.transactions} transactions · ${data.stats?.predictions} prediction records`,
        });
        refreshMetrics();
      } else {
        toast({ title: "Generation failed", description: data.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "Generation error", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Company Overview
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Live metrics pulled from Supabase · refreshes every 15s during
            simulation
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 mr-4">
            <span className="relative flex h-3 w-3">
              {isSimulating && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${isSimulating ? "bg-green-500" : "bg-gray-300"}`}
              ></span>
            </span>
            <span className="text-sm font-medium text-gray-600">
              {isSimulating ? "Live Traffic Active" : "System Idle"}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              onClick={generateHistory}
              variant="outline"
              size="sm"
              disabled={isGenerating}
              className="text-purple-600 border-purple-200 hover:bg-purple-50"
              title="Seed 6 months of historical customers, transactions & predictions"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Database className="w-4 h-4" />
              )}
              <span className="ml-1">{isGenerating ? "Generating…" : "Generate History"}</span>
            </Button>
            <InfoTooltip 
              content={
                <div className="space-y-2">
                  <p><strong>Action:</strong> Seeds 6 months of historical data</p>
                  <p><strong>Creates:</strong> Customers, transactions, and ML predictions</p>
                  <p><strong>Purpose:</strong> Populate charts and test time-series analysis</p>
                  <p><strong>Duration:</strong> ~5-10 seconds</p>
                </div>
              }
              iconClassName="text-purple-600"
            />
          </div>

          <div className="flex items-center gap-1">
            <Button
              onClick={syncDashboard}
              variant="outline"
              size="sm"
              disabled={isSyncing}
              className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
              title="Aggregate ML predictions → update Revenue Forecast graph"
            >
              {isSyncing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span className="ml-1">{isSyncing ? "Syncing…" : "Sync Dashboard"}</span>
            </Button>
            <InfoTooltip 
              content={
                <div className="space-y-2">
                  <p><strong>Action:</strong> Aggregates latest ML predictions</p>
                  <p><strong>Updates:</strong> Revenue forecast graph on main dashboard</p>
                  <p><strong>Source:</strong> ml_predictions table</p>
                  <p><strong>Duration:</strong> ~1-2 seconds</p>
                </div>
              }
              iconClassName="text-emerald-600"
            />
          </div>

          <Button
            onClick={() => refreshMetrics()}
            variant="outline"
            size="sm"
            disabled={metricsLoading}
            className="text-gray-600"
          >
            {metricsLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "↻ Refresh"
            )}
          </Button>

          <Button
            onClick={toggleSimulation}
            variant={isSimulating ? "outline" : "default"}
            className={
              !isSimulating ? "bg-blue-600 hover:bg-blue-700 text-white" : ""
            }
          >
            {isSimulating ? "Pause Traffic" : "Start Live Traffic"}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="shadow-sm border-gray-200 col-span-1 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-1.5">
              <CardTitle className="text-xs font-medium text-gray-500">
                MRR (30d)
              </CardTitle>
              <InfoTooltip 
                content={
                  <div className="space-y-2">
                    <p><strong>Source:</strong> Transactions table (last 30 days)</p>
                    <p><strong>Calculation:</strong> SUM(amount) WHERE status = 'completed'</p>
                    <p><strong>Updates:</strong> Real-time during simulation, every 15s otherwise</p>
                  </div>
                }
              />
            </div>
            <DollarSign className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {metricsLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
              ) : (
                `$${metrics.mrr.toLocaleString()}`
              )}
            </div>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" /> From transactions
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-1.5">
              <CardTitle className="text-xs font-medium text-gray-500">
                Active Users
              </CardTitle>
              <InfoTooltip 
                content={
                  <div className="space-y-2">
                    <p><strong>Source:</strong> Customers table</p>
                    <p><strong>Calculation:</strong> COUNT(*) WHERE status = 'active'</p>
                    <p><strong>Updates:</strong> Increments on signup events during simulation</p>
                  </div>
                }
              />
            </div>
            <Users className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {metricsLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
              ) : (
                metrics.activeUsers.toLocaleString()
              )}
            </div>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" /> Live from DB
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-1.5">
              <CardTitle className="text-xs font-medium text-gray-500">
                At-Risk Users
              </CardTitle>
              <InfoTooltip 
                content={
                  <div className="space-y-2">
                    <p><strong>Source:</strong> Detected by SimOps agents</p>
                    <p><strong>Calculation:</strong> COUNT(*) WHERE status = 'at_risk'</p>
                    <p><strong>Triggers:</strong> Low engagement, failed payments, ML predictions</p>
                    <p><strong>Action:</strong> Retention campaigns triggered automatically</p>
                  </div>
                }
              />
            </div>
            <AlertOctagon className="w-4 h-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${metrics.atRiskUsers > 0 ? "text-amber-600" : "text-slate-900"}`}
            >
              {metricsLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
              ) : (
                metrics.atRiskUsers
              )}
            </div>
            <p className="text-xs text-amber-600 mt-1">Detected by SimOps</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-1.5">
              <CardTitle className="text-xs font-medium text-gray-500">
                Churn Rate
              </CardTitle>
              <InfoTooltip 
                content={
                  <div className="space-y-2">
                    <p><strong>Formula:</strong> (At-risk users / Total users) × 100</p>
                    <p><strong>Threshold:</strong> {'>'}5% triggers alerts</p>
                    <p><strong>Updates:</strong> Recalculated every 15s during simulation</p>
                    <p><strong>Note:</strong> Simplified calculation for demo purposes</p>
                  </div>
                }
              />
            </div>
            <Activity className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${metrics.churnRate > 5 ? "text-red-600" : "text-slate-900"}`}
            >
              {metricsLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
              ) : (
                `${metrics.churnRate.toFixed(1)}%`
              )}
            </div>
            <p className="text-xs text-amber-600 mt-1">At-risk / total</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-1.5">
              <CardTitle className="text-xs font-medium text-gray-500">
                Transactions
              </CardTitle>
              <InfoTooltip 
                content={
                  <div className="space-y-2">
                    <p><strong>Source:</strong> Transactions table (last 30 days)</p>
                    <p><strong>Total:</strong> All transactions regardless of status</p>
                    <p><strong>Failed:</strong> Transactions with status = 'failed'</p>
                    <p><strong>Simulation:</strong> Generates random transactions every 3s</p>
                  </div>
                }
              />
            </div>
            <DollarSign className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {metricsLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
              ) : (
                metrics.totalTransactions
              )}
            </div>
            <p
              className={`text-xs mt-1 ${metrics.failedTransactions > 0 ? "text-red-500" : "text-gray-500"}`}
            >
              {metrics.failedTransactions} failed
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-1.5">
              <CardTitle className="text-xs font-medium text-gray-500">
                System Health
              </CardTitle>
              <InfoTooltip 
                content={
                  <div className="space-y-2">
                    <p><strong>Formula:</strong> 100 - (failure_ratio × 50) - (at_risk_ratio × 50)</p>
                    <p><strong>Factors:</strong> Failed transactions + at-risk customers</p>
                    <p><strong>Scale:</strong> 0-100 (higher is better)</p>
                    <p><strong>Thresholds:</strong> &lt;70 = critical, &lt;85 = warning, ≥85 = healthy</p>
                  </div>
                }
              />
            </div>
            <AlertOctagon className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${metrics.healthScore < 70 ? "text-red-600" : metrics.healthScore < 85 ? "text-amber-500" : "text-slate-900"}`}
            >
              {metricsLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
              ) : (
                `${metrics.healthScore}/100`
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Failure & churn weighted
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Live Agent Activity Log */}
      <div className="mt-8 space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-blue-500" /> Live Agent Thinking & Logs
          </h2>
          <InfoTooltip 
            content={
              <div className="space-y-2">
                <p><strong>What this shows:</strong> Real-time agent decisions and actions</p>
                <p><strong>Updates:</strong> Automatically via Supabase subscriptions</p>
                <p><strong>Source:</strong> agent_decisions table</p>
                <p><strong>Includes:</strong> Reasoning, output, severity, confidence scores</p>
              </div>
            }
          />
        </div>
        
        {/* Visual Pipeline */}
        <AgentCommunicationPipeline />

        <Card className="border border-slate-200 shadow-sm">
          <div className="p-0">
            <ActivityLog entries={activityEntries} />
          </div>
          {activityEntries.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-sm">
              No recent agent activity. Trigger a pipeline to see logs.
            </div>
          )}
        </Card>
      </div>

      {/* Chaos Engineering Panel */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" /> Chaos Engineering / SimOps Triggers
          </h2>
          <InfoTooltip 
            content={
              <div className="space-y-2">
                <p><strong>Purpose:</strong> Test and demonstrate agent responses</p>
                <p><strong>Churn Event:</strong> Simulates customer at risk of leaving</p>
                <p><strong>Pipeline:</strong> Runs all 6 agents in sequence</p>
                <p><strong>Safe:</strong> Only affects demo data, not production</p>
              </div>
            }
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border border-red-100 bg-red-50/30 shadow-sm">
            <CardHeader>
              <CardTitle className="text-red-800 text-base">
                Inject High-Risk Churn Event
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-red-600/80 mb-4">
                Marks a random active customer as at-risk (low engagement,
                failed payment), writes a <strong>CRITICAL</strong> agent
                decision, then immediately runs the SimOps pipeline. Head to the
                dashboard to see the new risk card.
              </p>
              <Button
                onClick={injectChurnEvent}
                variant="destructive"
                disabled={isInjecting}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                {isInjecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Running…
                  </>
                ) : (
                  "Execute Churn Scenario"
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-purple-100 bg-purple-50/30 shadow-sm">
            <CardHeader>
              <CardTitle className="text-purple-800 text-base">
                Trigger Analytics Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-purple-600/80 mb-4">
                Simulate a daily cron job that forces the SimOps external agents
                to analyze the entire customer base immediately looking for
                anomalies.
              </p>
              <Button
                onClick={runSimOps}
                variant="outline"
                className="w-full border-purple-300 text-purple-700 hover:bg-purple-100"
                disabled={isPipelineRunning}
              >
                {isPipelineRunning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Running Pipeline…
                  </>
                ) : (
                  "Run SimOps Pipeline"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Info box */}
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
        <strong>How this connects:</strong> All actions above write real data
        into Supabase. Head to the{" "}
        <a href="/" className="underline font-semibold hover:text-blue-900">
          SIM-OPS Dashboard
        </a>{" "}
        to see the agents detect anomalies, predict churn, and execute automated
        responses.
      </div>
    </div>
  );
}
