"use client";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AgentCommunicationPipeline } from "@/components/agents/AgentCommunicationPipeline";
import { AgentConfigEditor } from "@/components/agents/AgentConfigEditor";
import { AgentConfigPanel } from "@/components/agents/AgentConfigPanel";
import { AgentConnectionStatus } from "@/components/agents/AgentConnectionStatus";
import { AgentDecisionHistory } from "@/components/agents/AgentDecisionHistory";
import { AgentDetailCard } from "@/components/agents/AgentDetailCard";
import { AgentMetricsPanel } from "@/components/agents/AgentMetricsPanel";
import { AgentReasoningFlow } from "@/components/agents/AgentReasoningFlow";
import { CreateAgentDialog } from "@/components/agents/CreateAgentDialog";
import { EditAgentDialog } from "@/components/agents/EditAgentDialog";
import { LiveDataFlowIndicator } from "@/components/agents/LiveDataFlowIndicator";
import { LLMAgentStatus } from "@/components/ai/LLMAgentStatus";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Agent, AgentConfig } from "@/data/agentsData";
import {
  useAgents,
  useAgentWithDetails,
  useDeleteAgent,
  useRunAgent,
  useRunAllAgents,
  useUpdateAgent,
  useUpdateAgentConfig,
} from "@/hooks/useAgents";
import { useRealtimeAgents } from "@/hooks/useRealtimeAgents";
import type { Tables } from "@/integrations/supabase/types";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  Activity,
  Cpu,
  Edit,
  GitBranch,
  History,
  Info,
  LayoutDashboard,
  Loader2,
  Network,
  Play,
  Plus,
  Search,
  Settings,
  Shield,
  Sparkles,
  Target,
  Trash2,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type DbAgent = Tables<"agents">;
type DbAgentConfig = Tables<"agent_configs">;
type DbAgentDecision = Tables<"agent_decisions">;
type DbAgentMetrics = Tables<"agent_metrics">;

const PIPELINE_AGENT_IDS = new Set([
  "monitoring",
  "prediction",
  "decision",
  "action",
  "reporting",
  "feedback",
]);

// Transform DB data to match the existing component interfaces
function transformDbAgent(
  dbAgent: DbAgent & {
    config: DbAgentConfig | null;
    decisions: DbAgentDecision[];
    metrics: DbAgentMetrics | null;
  },
): Agent {
  return {
    id: dbAgent.id,
    name: dbAgent.name,
    role: dbAgent.role,
    description: dbAgent.description || "",
    status: dbAgent.status as "active" | "idle" | "processing" | "error",
    lastAction: dbAgent.last_action || undefined,
    actionsToday: dbAgent.actions_today,
    decisions: dbAgent.decisions
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((d) => ({
        id: d.id,
        timestamp: new Date(d.created_at).toLocaleString(),
        input: d.input,
        reasoning: d.reasoning,
        output: d.output,
        severity: d.severity as "low" | "medium" | "high" | "critical",
        confidence: Number(d.confidence),
        workflowTriggered: d.workflow_triggered || undefined,
      })),
    metrics: dbAgent.metrics
      ? {
          totalDecisions: dbAgent.metrics.total_decisions,
          avgConfidence: Number(dbAgent.metrics.avg_confidence),
          successRate: Number(dbAgent.metrics.success_rate),
          avgResponseTime: Number(dbAgent.metrics.avg_response_time),
        }
      : {
          totalDecisions: 0,
          avgConfidence: 0,
          successRate: 0,
          avgResponseTime: 0,
        },
    config: dbAgent.config
      ? {
          enabled: dbAgent.config.enabled,
          thresholds: dbAgent.config.thresholds as Record<string, number>,
          triggers: dbAgent.config.triggers || [],
          outputTargets: dbAgent.config.output_targets || [],
        }
      : {
          enabled: true,
          thresholds: {},
          triggers: [],
          outputTargets: [],
        },
  };
}

export default function AgentsPage() {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEditingConfig, setIsEditingConfig] = useState(false);

  // Enable real-time updates
  useRealtimeAgents();

  const { data: dbAgents, isLoading: agentsLoading } = useAgents();
  const { data: agentDetails, isLoading: detailsLoading } =
    useAgentWithDetails(selectedAgentId);
  const updateAgent = useUpdateAgent();
  const updateConfig = useUpdateAgentConfig();
  const deleteAgent = useDeleteAgent();
  const runAgent = useRunAgent();
  const runAllAgents = useRunAllAgents();

  // Select first pipeline agent when data loads
  useEffect(() => {
    if (dbAgents && dbAgents.length > 0 && !selectedAgentId) {
      const firstPipelineAgent = dbAgents.find(a => PIPELINE_AGENT_IDS.has(a.id));
      setSelectedAgentId(firstPipelineAgent?.id ?? dbAgents[0]?.id ?? null);
    }
  }, [dbAgents, selectedAgentId]);

  const handleDeleteAgent = async () => {
    if (!selectedAgent) return;
    if (
      !window.confirm(
        `Are you sure you want to delete the agent "${selectedAgent.name}"?`,
      )
    ) {
      return;
    }

    try {
      await deleteAgent.mutateAsync(selectedAgent.id);
      setSelectedAgentId(null);
      toast.success("Agent deleted successfully");
    } catch {
      toast.error("Failed to delete agent");
    }
  };

  const handleEditAgent = async (
    agentId: string,
    updates: {
      name: string;
      role: string;
      description: string;
      status: "active" | "idle" | "processing" | "error";
    },
  ) => {
    try {
      await updateAgent.mutateAsync({ id: agentId, updates });
      toast.success("Agent updated successfully");
    } catch {
      toast.error("Failed to update agent");
    }
  };

  const handleRunAgent = async () => {
    if (!selectedAgent) return;
    try {
      await runAgent.mutateAsync({
        agentId: selectedAgent.id,
        agentName: selectedAgent.name,
        agentRole: selectedAgent.role,
      });
      toast.success("Agent execution started");
    } catch {
      toast.error("Failed to run agent");
    }
  };

  const handleRunAllAgents = async () => {
    if (!dbAgents) return;
    try {
      await runAllAgents.mutateAsync(
        dbAgents.map((a) => ({ id: a.id, name: a.name, role: a.role })),
      );
      toast.success("Pipeline execution started");
    } catch {
      toast.error("Failed to run pipeline");
    }
  };

  const handleToggleAgent = async (agentId: string) => {
    if (!selectedAgentId || selectedAgentId !== agentId) {
      setSelectedAgentId(agentId);
    }

    const currentAgent = dbAgents?.find(a => a.id === agentId);
    if (!currentAgent) return;

    const dbConfig = (currentAgent as any).agent_configs?.[0];
    const newEnabled = !dbConfig?.enabled;
    const newStatus = newEnabled ? "active" : "idle";

    try {
      await Promise.all([
        updateAgent.mutateAsync({
          id: agentId,
          updates: { status: newStatus },
        }),
        updateConfig.mutateAsync({
          agentId,
          updates: { enabled: newEnabled },
        }),
      ]);
      toast.success(`Agent ${newEnabled ? "started" : "paused"}`);
    } catch {
      toast.error("Failed to toggle agent");
    }
  };

  const handleConfigChange = async (newConfig: AgentConfig) => {
    if (!selectedAgentId) return;

    try {
      await updateConfig.mutateAsync({
        agentId: selectedAgentId,
        updates: {
          enabled: newConfig.enabled,
          thresholds: newConfig.thresholds,
          triggers: newConfig.triggers,
          output_targets: newConfig.outputTargets,
        },
      });
      toast.success("Configuration updated");
    } catch {
      toast.error("Failed to update configuration");
    }
  };

  const handleCreateAgent = async (agentData: {
    name: string;
    role: string;
    description: string;
    status: string;
  }) => {
    const supabase = createClient();

    try {
      const agentId = agentData.name
        .toLowerCase()
        .replace(/\s+agent$/i, "")
        .replace(/\s+/g, "-");

      const { data: newAgent, error } = await supabase
        .from("agents")
        .insert({
          id: agentId,
          name: agentData.name,
          role: agentData.role,
          description: agentData.description,
          status: agentData.status,
          actions_today: 0,
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.from("agent_configs").insert({
        agent_id: newAgent.id,
        enabled: agentData.status === "active",
        thresholds: {},
        triggers: [],
        output_targets: [],
      });

      await supabase.from("agent_metrics").insert({
        agent_id: newAgent.id,
        total_decisions: 0,
        avg_confidence: 0,
        success_rate: 0,
        avg_response_time: 0,
      });

      toast.success("Agent created successfully");
      setSelectedAgentId(newAgent.id);
    } catch (error: any) {
      console.error("Failed to create agent:", error);
      if (error.code === "23505") {
        toast.error("An agent with this name already exists");
      } else {
        toast.error("Failed to create agent");
      }
      throw error;
    }
  };

  const agents: Pick<
    Agent,
    | "id"
    | "name"
    | "role"
    | "status"
    | "lastAction"
    | "actionsToday"
    | "metrics"
    | "config"
  >[] = (dbAgents || []).map((a) => {
    const dbMetrics = (a as any).agent_metrics?.[0];
    const dbConfig = (a as any).agent_configs?.[0];

    return {
      id: a.id,
      name: a.name,
      role: a.role,
      status: a.status as "active" | "idle" | "processing" | "error",
      lastAction: a.last_action || undefined,
      actionsToday: a.actions_today,
      metrics: dbMetrics
        ? {
            totalDecisions: dbMetrics.total_decisions,
            avgConfidence: Number(dbMetrics.avg_confidence),
            successRate: Number(dbMetrics.success_rate),
            avgResponseTime: Number(dbMetrics.avg_response_time),
          }
        : {
            totalDecisions: 0,
            avgConfidence: 0,
            successRate: 0,
            avgResponseTime: 0,
          },
      config: dbConfig
        ? {
            enabled: dbConfig.enabled,
            thresholds: dbConfig.thresholds as Record<string, number>,
            triggers: dbConfig.triggers || [],
            outputTargets: dbConfig.output_targets || [],
          }
        : {
            enabled: true,
            thresholds: {},
            triggers: [],
            outputTargets: [],
          },
    };
  });

  const selectedAgent: Agent | null = agentDetails
    ? transformDbAgent(agentDetails)
    : null;

  if (agentsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-1 space-y-4">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="xl:col-span-3">
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 border-b-2 border-border pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h1 className="text-2xl font-bold uppercase tracking-tight">
                Agent Observability
              </h1>
            </div>
            <p className="text-sm text-muted-foreground font-mono flex items-center gap-2">
              <Activity className="w-3.5 h-3.5" />
              Monitoring {agents.length} autonomous reasoning units
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] font-mono text-muted-foreground uppercase">System Pulse</span>
              <LiveDataFlowIndicator
                isConnected={true}
                packetsPerSecond={2.5}
                latency={42}
              />
            </div>
            <div className="flex gap-2">
              {/* New Agent button removed to focus on core pipeline */}
              <Button
                size="sm"
                className="font-mono uppercase text-xs bg-foreground text-background hover:bg-foreground/90"
                onClick={handleRunAllAgents}
                disabled={runAllAgents.isPending || agents.length === 0}
              >
                {runAllAgents.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 mr-2" />
                )}
                Trigger Pipeline
              </Button>
            </div>
          </div>
        </div>

        {agents.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No Agents Yet"
            description="Create your first decision agent to start automating your operations"
            action={{
              label: "Create Agent",
              onClick: () => setIsCreateDialogOpen(true),
            }}
          />
        ) : (
          <Tabs defaultValue="detail" className="w-full">
            <TabsList className="w-full justify-start border-2 border-border bg-card h-auto p-0 flex-wrap mb-6">
              <TabsTrigger
                value="detail"
                className="flex items-center gap-2 px-6 py-4 data-[state=active]:bg-secondary rounded-none border-r-2 border-border"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="font-mono uppercase text-xs font-bold">Diagnostics</span>
              </TabsTrigger>
              <TabsTrigger
                value="pipeline"
                className="flex items-center gap-2 px-6 py-4 data-[state=active]:bg-secondary rounded-none border-r-2 border-border"
              >
                <GitBranch className="w-4 h-4" />
                <span className="font-mono uppercase text-xs font-bold">Logic Mesh</span>
              </TabsTrigger>
              <TabsTrigger
                value="llm-agents"
                className="flex items-center gap-2 px-6 py-4 data-[state=active]:bg-secondary rounded-none"
              >
                <Cpu className="w-4 h-4" />
                <span className="font-mono uppercase text-xs font-bold">LLM Orchestrator</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="detail" className="mt-0 focus-visible:outline-none">
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                {/* Sidebar */}
                <div className="xl:col-span-1 space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h2 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-bold">
                      Fleet Overview
                    </h2>
                    <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 border border-emerald-500/20">
                      {agents.filter(a => PIPELINE_AGENT_IDS.has(a.id) && (a.status === 'active' || a.status === 'processing')).length} ONLINE
                    </span>
                  </div>
                  <div className="space-y-3">
                    {agents
                      .filter(agent => PIPELINE_AGENT_IDS.has(agent.id))
                      .map((agent) => (
                        <AgentDetailCard
                          key={agent.id}
                          agent={agent as Agent}
                          isSelected={selectedAgentId === agent.id}
                          onSelect={() => setSelectedAgentId(agent.id)}
                          onToggle={() => handleToggleAgent(agent.id)}
                        />
                      ))}
                  </div>
                </div>

                {/* Main Content */}
                <div className="xl:col-span-3">
                  {detailsLoading ? (
                    <div className="border-2 border-border bg-card p-8">
                      <div className="flex items-center gap-3 mb-6">
                        <Skeleton className="w-12 h-12" />
                        <div>
                          <Skeleton className="h-6 w-48 mb-2" />
                          <Skeleton className="h-4 w-64" />
                        </div>
                      </div>
                      <Skeleton className="h-[400px] w-full" />
                    </div>
                  ) : selectedAgent ? (
                    <div className="space-y-6">
                      {/* Agent Header Section */}
                      <div className="border-2 border-border bg-card overflow-hidden">
                        <div className="bg-muted/30 border-b-2 border-border p-6 flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 border-2 border-foreground bg-background flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]">
                              {selectedAgent.id.includes('analyst') && <Search className="w-8 h-8" />}
                              {selectedAgent.id.includes('forecaster') && <Target className="w-8 h-8" />}
                              {selectedAgent.id.includes('decision') && <Shield className="w-8 h-8" />}
                              {selectedAgent.id.includes('action') && <Zap className="w-8 h-8" />}
                              {!['analyst', 'forecaster', 'decision', 'action'].some(k => selectedAgent.id.includes(k)) && <Activity className="w-8 h-8" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h2 className="text-xl font-black uppercase tracking-tight">
                                  {selectedAgent.name}
                                </h2>
                                <span className={cn(
                                  "text-[10px] font-mono px-2 py-0.5 border-2 uppercase font-bold",
                                  selectedAgent.status === 'active' ? "border-emerald-500 text-emerald-400 bg-emerald-500/5" : 
                                  selectedAgent.status === 'processing' ? "border-blue-500 text-blue-400 bg-blue-500/5" :
                                  "border-muted-foreground text-muted-foreground bg-muted/5"
                                )}>
                                  {selectedAgent.status}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
                                {selectedAgent.role}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-3">
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-[10px] font-mono uppercase h-8 border-2"
                                onClick={() => setIsEditDialogOpen(true)}
                              >
                                <Edit className="w-3 h-3 mr-1.5" />
                                Modify
                              </Button>
                              {!PIPELINE_AGENT_IDS.has(selectedAgent.id) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-[10px] font-mono uppercase h-8 border-2 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-400"
                                  onClick={handleDeleteAgent}
                                  disabled={deleteAgent.isPending}
                                >
                                  <Trash2 className="w-3 h-3 mr-1.5" />
                                  Terminate
                                </Button>
                              )}
                            </div>
                            <div className="bg-background border-2 border-border px-3 py-1.5 flex items-center gap-3">
                              <div className="flex flex-col">
                                <span className="text-[8px] font-mono text-muted-foreground uppercase leading-none">Avg Latency</span>
                                <span className="text-[10px] font-mono font-bold">{selectedAgent.metrics.avgResponseTime}s</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="p-6">
                           <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                            {selectedAgent.description}
                          </p>
                        </div>
                      </div>

                      {/* Reasoning Flow Section */}
                      <AgentReasoningFlow agentId={selectedAgent.id} />

                      {/* Detail Tabs */}
                      <Tabs defaultValue="decisions" className="w-full">
                        <TabsList className="w-full justify-start border-b-2 border-border bg-transparent h-auto p-0 rounded-none mb-6">
                          <TabsTrigger
                            value="decisions"
                            className="flex items-center gap-2 px-6 py-3 data-[state=active]:bg-card data-[state=active]:border-2 data-[state=active]:border-b-0 border-border rounded-none -mb-[2px] transition-none"
                          >
                            <History className="w-4 h-4" />
                            <span className="font-mono uppercase text-xs font-bold">Activity Log</span>
                          </TabsTrigger>
                          <TabsTrigger
                            value="connections"
                            className="flex items-center gap-2 px-6 py-3 data-[state=active]:bg-card data-[state=active]:border-2 data-[state=active]:border-b-0 border-border rounded-none -mb-[2px] transition-none"
                          >
                            <Network className="w-4 h-4" />
                            <span className="font-mono uppercase text-xs font-bold">Mesh Map</span>
                          </TabsTrigger>
                          <TabsTrigger
                            value="metrics"
                            className="flex items-center gap-2 px-6 py-3 data-[state=active]:bg-card data-[state=active]:border-2 data-[state=active]:border-b-0 border-border rounded-none -mb-[2px] transition-none"
                          >
                            <Activity className="w-4 h-4" />
                            <span className="font-mono uppercase text-xs font-bold">Unit KPIs</span>
                          </TabsTrigger>
                          <TabsTrigger
                            value="config"
                            className="flex items-center gap-2 px-6 py-3 data-[state=active]:bg-card data-[state=active]:border-2 data-[state=active]:border-b-0 border-border rounded-none -mb-[2px] transition-none"
                          >
                            <Settings className="w-4 h-4" />
                            <span className="font-mono uppercase text-xs font-bold">Core Config</span>
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="decisions" className="mt-0 focus-visible:outline-none">
                          <AgentDecisionHistory
                            decisions={selectedAgent.decisions}
                          />
                        </TabsContent>

                        <TabsContent value="connections" className="mt-0 focus-visible:outline-none">
                          <AgentConnectionStatus />
                        </TabsContent>

                        <TabsContent value="metrics" className="mt-0 focus-visible:outline-none">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <AgentMetricsPanel
                              metrics={selectedAgent.metrics}
                              actionsToday={selectedAgent.actionsToday}
                            />
                            <div className="border-2 border-border bg-card overflow-hidden">
                               <div className="border-b border-border p-4 bg-muted/20">
                                  <h3 className="font-bold uppercase tracking-widest text-xs">Diagnostic Summary</h3>
                               </div>
                               <div className="p-6 space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                     <div className="border border-border p-3">
                                        <span className="text-[10px] font-mono text-muted-foreground uppercase block mb-1">Lifetime Ops</span>
                                        <span className="text-xl font-bold font-mono">{selectedAgent.metrics.totalDecisions.toLocaleString()}</span>
                                     </div>
                                     <div className="border border-border p-3">
                                        <span className="text-[10px] font-mono text-muted-foreground uppercase block mb-1">Response Time</span>
                                        <span className="text-xl font-bold font-mono">{selectedAgent.metrics.avgResponseTime}s</span>
                                     </div>
                                  </div>
                                  <div className="space-y-4 pt-2">
                                     <div className="space-y-1.5">
                                        <div className="flex justify-between text-xs font-mono">
                                           <span>Success Threshold</span>
                                           <span>{(selectedAgent.metrics.successRate * 100).toFixed(1)}%</span>
                                        </div>
                                        <div className="h-2 bg-muted border border-border">
                                           <div className="h-full bg-emerald-400" style={{ width: `${selectedAgent.metrics.successRate * 100}%` }} />
                                        </div>
                                     </div>
                                     <div className="space-y-1.5">
                                        <div className="flex justify-between text-xs font-mono">
                                           <span>Reasoning Confidence</span>
                                           <span>{(selectedAgent.metrics.avgConfidence * 100).toFixed(1)}%</span>
                                        </div>
                                        <div className="h-2 bg-muted border border-border">
                                           <div className="h-full bg-blue-400" style={{ width: `${selectedAgent.metrics.avgConfidence * 100}%` }} />
                                        </div>
                                     </div>
                                  </div>
                               </div>
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="config" className="mt-0 focus-visible:outline-none">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {isEditingConfig ? (
                              <AgentConfigEditor
                                config={selectedAgent.config}
                                onSave={handleConfigChange}
                                onCancel={() => setIsEditingConfig(false)}
                              />
                            ) : (
                              <div className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                  <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-bold">
                                    Parameters
                                  </h3>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsEditingConfig(true)}
                                    className="h-7 text-[10px] font-mono uppercase border-2"
                                  >
                                    <Edit className="w-3 h-3 mr-1.5" />
                                    Configure
                                  </Button>
                                </div>
                                <AgentConfigPanel
                                  config={selectedAgent.config}
                                  onConfigChange={handleConfigChange}
                                />
                              </div>
                            )}
                            <div className="border-2 border-border bg-card overflow-hidden">
                               <div className="border-b border-border p-4 bg-muted/20">
                                  <h3 className="font-bold uppercase tracking-widest text-xs">Node Dependencies</h3>
                               </div>
                               <div className="p-6 space-y-6">
                                  <div>
                                    <h4 className="text-[10px] font-mono text-muted-foreground uppercase mb-3 flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                                      Upstream Triggers
                                    </h4>
                                    <div className="space-y-2">
                                      {selectedAgent.config.triggers.length > 0 ? (
                                        selectedAgent.config.triggers.map((trigger) => (
                                          <div key={trigger} className="flex items-center gap-3 text-xs bg-muted/30 p-2 border border-border">
                                            <GitBranch className="w-3.5 h-3.5 text-muted-foreground" />
                                            <span className="font-mono font-bold uppercase">{trigger}</span>
                                          </div>
                                        ))
                                      ) : (
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground italic p-2 border border-dashed border-border">
                                          <Info className="w-3.5 h-3.5" />
                                          No active triggers
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="text-[10px] font-mono text-muted-foreground uppercase mb-3 flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                                      Downstream Targets
                                    </h4>
                                    <div className="space-y-2">
                                      {selectedAgent.config.outputTargets.length > 0 ? (
                                        selectedAgent.config.outputTargets.map((target) => (
                                          <div key={target} className="flex items-center gap-3 text-xs bg-muted/30 p-2 border border-border">
                                            <GitBranch className="w-3.5 h-3.5 text-muted-foreground" />
                                            <span className="font-mono font-bold uppercase">{target}</span>
                                          </div>
                                        ))
                                      ) : (
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground italic p-2 border border-dashed border-border">
                                          <Info className="w-3.5 h-3.5" />
                                          No active targets
                                        </div>
                                      )}
                                    </div>
                                  </div>
                               </div>
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  ) : (
                    <div className="border-2 border-border bg-card p-12 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 border-2 border-border flex items-center justify-center bg-muted/20">
                          <Search className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-muted-foreground font-mono uppercase tracking-widest text-sm font-bold">
                            Node Selection Required
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Select an agent from the fleet overview to access diagnostic data
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pipeline" className="mt-0 focus-visible:outline-none">
              <AgentCommunicationPipeline />
            </TabsContent>

            <TabsContent value="llm-agents" className="mt-0 focus-visible:outline-none">
              <LLMAgentStatus />
            </TabsContent>
          </Tabs>
        )}

        <CreateAgentDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onCreateAgent={handleCreateAgent}
        />
        <EditAgentDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          agent={selectedAgent ? (selectedAgent as Agent) : null}
          onEditAgent={handleEditAgent}
        />
      </div>
    </ErrorBoundary>
  );
}
