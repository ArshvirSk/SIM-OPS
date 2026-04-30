"use client";

import { createClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";

export interface KPIData {
  revenue: number;
  revenuePredicted: number;
  revenueChange: number;
  customers: number;
  customersPredicted: number;
  customersChange: number;
  churnRate: number;
  churnRatePredicted: number;
  churnRateChange: number;
  alerts: number;
  alertsChange: number;
  activeAgents: number;
  activeAgentsChange: number;
  automationRate: number;
  automationRateChange: number;
}

export interface RiskAlert {
  id: string;
  type: "churn" | "revenue" | "cost";
  title: string;
  description: string;
  severity: "high" | "medium" | "low" | "critical";
  probability: number;
  timestamp: string;
}

export interface ActivityLog {
  id: string;
  type: "success" | "warning" | "info" | "error";
  source: "workflow" | "ml" | "agent" | "system";
  message: string;
  timestamp: string;
  details?: string;
}

export function useDashboardKPIs() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["dashboard-kpis"],
    queryFn: async (): Promise<KPIData> => {
      const now = new Date();
      const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

      // 1. Active agents
      const { count: activeAgentCount } = await supabase
        .from("agents")
        .select("*", { count: "exact", head: true })
        .in("status", ["active", "processing"]);

      // 2. Total customers vs last month
      const { count: customersValue } = await supabase
        .from("customers")
        .select("*", { count: "exact", head: true });

      const { count: customersLastMonth } = await supabase
        .from("customers")
        .select("*", { count: "exact", head: true })
        .lt("created_at", startOfThisMonth);

      // 3. Risk alerts (active only)
      const { count: alertsValue } = await supabase
        .from("risk_alerts")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      // 4. Revenue this month vs last month
      const { data: txThisMonth } = await supabase
        .from("transactions")
        .select("amount")
        .eq("status", "completed")
        .gte("created_at", startOfThisMonth);

      const { data: txLastMonth } = await supabase
        .from("transactions")
        .select("amount")
        .eq("status", "completed")
        .gte("created_at", startOfLastMonth)
        .lt("created_at", startOfThisMonth);

      const revenueThisMonth =
        txThisMonth?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
      const revenueLastMonth =
        txLastMonth?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

      const revenueChange =
        revenueLastMonth > 0
          ? Number((((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100).toFixed(1))
          : 0;

      // 5. Automation Rate (last 24 h)
      const { data: decisions } = await supabase
        .from("agent_decisions")
        .select("workflow_triggered")
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const totalDecisions = decisions?.length || 0;
      const automatedDecisions = decisions?.filter((d) => d.workflow_triggered).length || 0;
      const automationRate =
        totalDecisions > 0 ? Math.round((automatedDecisions / totalDecisions) * 100) : 0;

      // Last-month automation rate for delta
      const { data: decisionsLastMonth } = await supabase
        .from("agent_decisions")
        .select("workflow_triggered")
        .gte("created_at", startOfLastMonth)
        .lt("created_at", startOfThisMonth);

      const totalLM = decisionsLastMonth?.length || 0;
      const automatedLM = decisionsLastMonth?.filter((d) => d.workflow_triggered).length || 0;
      const automationRateLM = totalLM > 0 ? Math.round((automatedLM / totalLM) * 100) : 0;
      const automationRateChange = automationRate - automationRateLM;

      // 6. Churn Rate this month vs last month
      const { count: totalCustomers } = await supabase
        .from("customers")
        .select("*", { count: "exact", head: true });

      const { count: churnedCount } = await supabase
        .from("customers")
        .select("*", { count: "exact", head: true })
        .eq("status", "churned");

      // Customers who churned last month (approximated by those churned before this month)
      const { count: churnedLastMonthCount } = await supabase
        .from("customers")
        .select("*", { count: "exact", head: true })
        .eq("status", "churned")
        .lt("updated_at", startOfThisMonth);

      const churnRate =
        totalCustomers && totalCustomers > 0
          ? Number((((churnedCount || 0) / totalCustomers) * 100).toFixed(2))
          : 0;

      const churnRateLM =
        (customersLastMonth || 0) > 0
          ? Number((((churnedLastMonthCount || 0) / (customersLastMonth || 1)) * 100).toFixed(2))
          : 0;

      const churnRateChange = Number((churnRate - churnRateLM).toFixed(2));

      // Customers change %
      const customersChange =
        (customersLastMonth || 0) > 0
          ? Number(
            (((((customersValue || 0) - (customersLastMonth || 0)) / (customersLastMonth || 1)) * 100).toFixed(1)),
          )
          : 0;

      // Alerts change: active now vs last month snapshot
      const { count: alertsLastMonth } = await supabase
        .from("risk_alerts")
        .select("*", { count: "exact", head: true })
        .eq("status", "active")
        .lt("created_at", startOfThisMonth);

      const alertsChange = (alertsValue || 0) - (alertsLastMonth || 0);

      // ML predictions for predicted KPIs
      const { data: latestPrediction } = await supabase
        .from("predictions")
        .select("predicted_value, prediction_type")
        .in("prediction_type", ["revenue", "churn"])
        .order("timestamp", { ascending: false })
        .limit(10);

      const revenuePred = latestPrediction?.find((p) => p.prediction_type === "revenue");
      const churnPred = latestPrediction?.find((p) => p.prediction_type === "churn");

      return {
        revenue: revenueThisMonth,
        revenuePredicted: revenuePred
          ? Number(revenuePred.predicted_value)
          : revenueThisMonth * 1.05,
        revenueChange,
        customers: customersValue || 0,
        customersPredicted: Math.round((customersValue || 0) * 1.02),
        customersChange,
        churnRate,
        churnRatePredicted: churnPred
          ? Number(Number(churnPred.predicted_value).toFixed(2))
          : churnRate,
        churnRateChange,
        alerts: alertsValue || 0,
        alertsChange,
        activeAgents: activeAgentCount || 0,
        activeAgentsChange: 0,
        automationRate,
        automationRateChange,
      };
    },
    refetchInterval: 30000,
  });
}

export function useDashboardRisks() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["dashboard-risks"],
    queryFn: async (): Promise<RiskAlert[]> => {
      const { data: decisions } = await supabase
        .from("agent_decisions")
        .select("*")
        .in("severity", ["high", "critical"])
        .order("created_at", { ascending: false })
        .limit(5);

      if (!decisions || decisions.length === 0) {
        return [];
      }

      return decisions.map((d, index) => ({
        id: d.id,
        type: (index % 3 === 0
          ? "churn"
          : index % 3 === 1
            ? "revenue"
            : "cost") as "churn" | "revenue" | "cost",
        title: d.output.substring(0, 60),
        description: d.reasoning.substring(0, 150),
        severity: d.severity as "high" | "medium" | "low" | "critical",
        probability: Math.round(Number(d.confidence) * 100),
        timestamp: new Date(d.created_at).toLocaleString(),
      }));
    },
    refetchInterval: 60000, // Refetch every minute
  });
}

export function useDashboardActivity() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["dashboard-activity"],
    queryFn: async (): Promise<ActivityLog[]> => {
      // Fetch both decisions (final results) and communications (inter-agent logs)
      const [decisionsRes, commsRes] = await Promise.all([
        supabase
          .from("agent_decisions")
          .select("*, agents(name)")
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("agent_communications")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(15),
      ]);

      const decisions = decisionsRes.data || [];
      const comms = commsRes.data || [];

      // Map decisions to ActivityLog format
      const decisionLogs: ActivityLog[] = decisions.map((d) => {
        const agent = d.agents as { name: string } | null;
        const severity = d.severity;
        return {
          id: d.id,
          type:
            severity === "critical" || severity === "high"
              ? "warning"
              : severity === "medium"
                ? "info"
                : "success",
          source: d.workflow_triggered ? "workflow" : "agent",
          message: `${agent?.name || "Agent"}: ${d.output.substring(0, 80)}`,
          timestamp: new Date(d.created_at).toLocaleString(),
          details: d.reasoning.substring(0, 100),
        };
      });

      // Map communications to ActivityLog format
      const commLogs: ActivityLog[] = comms.map((c) => {
        const payload = c.payload as any;
        const method = payload?.method || "LLM";
        const summary = payload?.summary || "Data handoff";
        
        return {
          id: c.id,
          type: "info",
          source: "agent",
          message: `🔄 [${method}] ${c.from_agent_id} → ${c.to_agent_id}`,
          timestamp: new Date(c.created_at).toLocaleString(),
          details: summary.length > 120 ? summary.substring(0, 120) + "..." : summary,
        };
      });

      // Merge and sort by timestamp (desc)
      return [...decisionLogs, ...commLogs]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 15);
    },
    refetchInterval: 5000, // Faster refetch for live feel
  });
}

export function useDashboardCharts() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["dashboard-charts"],
    queryFn: async () => {
      const now = new Date();

      // Build last 6 months as { label, start, end }
      const months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        return {
          label: d.toLocaleString("default", { month: "short" }),
          start: new Date(d.getFullYear(), d.getMonth(), 1).toISOString(),
          end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString(),
        };
      });

      // Fetch 6 months of transactions in one query
      const { data: transactions } = await supabase
        .from("transactions")
        .select("amount, created_at")
        .eq("status", "completed")
        .gte("created_at", months[0].start)
        .lte("created_at", months[5].end);

      // Fetch all customers with their created_at and status for churn calc
      const { data: customers } = await supabase
        .from("customers")
        .select("created_at, status, updated_at");

      // Revenue per month
      const revenueData = months.map((m) => {
        const actual =
          transactions
            ?.filter((t) => t.created_at >= m.start && t.created_at <= m.end)
            .reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
        return {
          name: m.label,
          actual: Math.round(actual),
          predicted: Math.round(actual * 1.05),
        };
      });

      // Churn rate per month: (customers who churned by month end) / (total active by month end)
      const churnData = months.map((m) => {
        const activeByEnd = customers?.filter((c) => c.created_at <= m.end).length || 0;
        const churnedByEnd =
          customers?.filter(
            (c) =>
              c.status === "churned" &&
              c.updated_at &&
              c.updated_at <= m.end,
          ).length || 0;
        const rate =
          activeByEnd > 0
            ? Number(((churnedByEnd / activeByEnd) * 100).toFixed(1))
            : 0;
        return {
          name: m.label,
          actual: rate,
          predicted: Number((rate * 0.95).toFixed(1)), // ML target: 5% reduction
        };
      });

      return { revenueData, churnData };
    },
    refetchInterval: 60000,
  });
}

export function useDashboardWorkflows() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["dashboard-workflows"],
    queryFn: async () => {
      const { data: workflows } = await supabase
        .from("workflows")
        .select("id, name, last_run, status, nodes")
        .order("created_at", { ascending: false })
        .limit(2);

      if (!workflows || workflows.length === 0) return [];

      const nodeLabels: Record<string, string> = {
        trigger: "Trigger",
        data: "Fetch",
        ml: "Process",
        decision: "Analyze",
        action: "Action",
        notify: "Notify",
        alert: "Alert",
        report: "Report",
        condition: "Condition",
      };

      // Fetch the latest run for each workflow to get real node results
      const enriched = await Promise.all(
        workflows.map(async (w) => {
          const { data: latestRun } = await supabase
            .from("workflow_runs")
            .select("status, node_results")
            .eq("workflow_id", w.id)
            .order("started_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          const runStatus = latestRun?.status || "never";

          // node_results from DB: object keyed by nodeId { n1: { status: "success" }, … }
          // OR array of { nodeId, nodeType, success } from executor
          const rawResults = (latestRun?.node_results as any) || {};

          // Build a lookup: nodeId → success
          const idResultMap = new Map<string, boolean>();
          if (Array.isArray(rawResults)) {
            for (const r of rawResults) {
              if (r.nodeId) idResultMap.set(r.nodeId, r.success !== false);
            }
          } else if (typeof rawResults === "object") {
            for (const [id, val] of Object.entries(rawResults)) {
              idResultMap.set(id, (val as any)?.status === "success");
            }
          }

          // Parse the actual workflow nodes from the DB (array of { id, type, config })
          const dbNodes: Array<{ id: string; type: string }> = Array.isArray(w.nodes)
            ? (w.nodes as any[])
            : [];

          const steps = dbNodes.map((node, idx) => {
            const type = node.type as any;
            let status: "completed" | "running" | "pending" | "error";

            if (runStatus === "never" || runStatus === "pending") {
              status = "pending";
            } else if (idResultMap.has(node.id)) {
              status = idResultMap.get(node.id) ? "completed" : "error";
            } else if (runStatus === "running" && idx === dbNodes.length - 1) {
              status = "running";
            } else {
              status = "pending";
            }

            return { type, label: nodeLabels[type] ?? type, status };
          });

          return {
            id: w.id,
            name: w.name,
            steps,
            lastRun: w.last_run ? new Date(w.last_run).toLocaleString() : "Never",
            nextRun: w.status === "active" ? "Scheduled" : "Paused",
          };
        }),
      );

      return enriched;
    },
  });
}
