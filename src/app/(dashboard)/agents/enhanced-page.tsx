"use client";

import { AgentCommunicationPipeline } from "@/components/agents/AgentCommunicationPipeline";
import { AgentConfigPanel } from "@/components/agents/AgentConfigPanel";
import { AgentConnectionStatus } from "@/components/agents/AgentConnectionStatus";
import { AgentDecisionHistory } from "@/components/agents/AgentDecisionHistory";
import { AgentDetailCard } from "@/components/agents/AgentDetailCard";
import { AgentMetricsPanel } from "@/components/agents/AgentMetricsPanel";
import { AgentPerformanceTrends } from "@/components/agents/AgentPerformanceTrends";
import { AgentReasoningFlow } from "@/components/agents/AgentReasoningFlow";
import { AgentSearchFilter } from "@/components/agents/AgentSearchFilter";
import { AgentThresholdEditor } from "@/components/agents/AgentThresholdEditor";
import { CreateAgentDialog } from "@/components/agents/CreateAgentDialog";
import { LiveDataFlowIndicator } from "@/components/agents/LiveDataFlowIndicator";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Agent, AgentConfig, AgentStatus } from "@/data/agentsData";
import {
  useAgents,
  useAgentWithDetails,
  useRunAgent,
  useRunAllAgents,
  useUpdateAgent,
  useUpdateAgentConfig,
} from "@/hooks/useAgents";
import type { Tables } from "@/integrations/supabase/types";
import { createClient } from "@/lib/supabase/client";
import {
  Activity,
  BarChart3,
  Edit,
  GitBranch,
  History,
  Loader2,
  Network,
  Play,
  Plus,
  Settings,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type DbAgent = Tables<"agents">;
type DbAgentConfig = Tables<"agent_configs">;
type DbAgentDecision = Tables<"agent_decisions">;
type DbAgentMetrics = Tables<"agent_metrics">;

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
    decisions: dbAgent.decisions.map((d) => ({
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

export default function EnhancedAgentsPage() {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [isEditingThresholds, setIsEditingThresholds] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AgentStatus | "all">("all");
  const [severityFilter, setSeverityFilter] = useState<string | "all">("all");

  const { data: dbAgents, isLoading: agentsLoading } = useAgents();
  const { data: agentDetails, isLoading: detailsLoading } =
    useAgentWithDetails(selectedAgentId);
  const updateAgent = useUpdateAgent();
  const updateConfig = useUpdateAgentConfig();
  const runAgent = useRunAgent();
  const runAllAgents = useRunAllAgents();

  // Select first agent when data loads
  useEffect(() => {
    if (dbAgents && dbAgents.length > 0 && !selectedAgentId) {
      setSelectedAgentId(dbAgents[0]?.id ?? null);
    }
  }, [dbAgents, selectedAgentId]);

  // Filter agents based on search and filters
  const filteredAgents = useMemo(() => {
    if (!dbAgents) return [];

    return dbAgents.filter((agent) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          agent.name.toLowerCase().includes(query) ||
          agent.role.toLowerCase().includes(query) ||
          (agent.description || "").toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter !== "all" && agent.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [dbAgents, searchQuery, statusFilter]);

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
    if (!agentDetails || agentDetails.id !== agentId) return;

    const newEnabled = !agentDetails.config?.enabled;
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

  const handleThresholdSave = async (thresholds: Record<string, number>) => {
    if (!selectedAgentId) return;

    try {
      await updateConfig.mutateAsync({
        agentId: selectedAgentId,
        updates: { thresholds },
      });
      toast.success("Thresholds updated");
      setIsEditingThresholds(false);
    } catch {
      toast.error("Failed to update thresholds");
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
      const { data: newAgent, error } = await supabase
        .from("agents")
        .insert({
          name: agentData.name,
          role: agentData.role,
          description: agentData.description,
          status: agentData.status,
          actions_today: 0,
        })
        .select()
        .single();

      if (error) throw error;

      // Create default config
      await supabase.from("agent_configs").insert({
        agent_id: newAgent.id,
        enabled: agentData.status === "active",
        thresholds: {},
        triggers: [],
        output_targets: [],
      });

      toast.success("Agent created successfully");
      setSelectedAgentId(newAgent.id);
    } catch (error) {
      console.error("Failed to create agent:", error);
      throw error;
    }
  };

  // Transform DB agents to UI format for the list
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
  >[] = filteredAgents.map((a) => ({
    id: a.id,
    name: a.name,
    role: a.role,
    status: a.status as "active" | "idle" | "processing" | "error",
    lastAction: a.last_action || undefined,
    actionsToday: a.actions_today,
    metrics: {
      totalDecisions: 0,
      avgConfidence: 0,
      successRate: 0,
      avgResponseTime: 0,
    },
    config: { enabled: true, thresholds: {}, triggers: [], outputTargets: [] },
  }));

  // Get the full selected agent with details
  const selectedAgent: Agent | null = agentDetails
    ? transformDbAgent(agentDetails)
    : null;

  // Filter decisions by severity
  const filteredDecisions = useMemo(() => {
    if (!selectedAgent) return [];
    if (severityFilter === "all") return selectedAgent.decisions;
    return selectedAgent.decisions.filter((d) => d.severity === severityFilter);
  }, [selectedAgent, severityFilter]);

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
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-wide mb-2">
            Decision Agents
          </h1>
          <p className="text-sm text-muted-foreground font-mono">
            Monitor and configure autonomous reasoning agents
          </p>
        </div>
        <div className="flex items-center gap-4">
          <LiveDataFlowIndicator
            isConnected={true}
            packetsPerSecond={2.5}
            latency={42}
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-2 font-mono uppercase text-xs"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Agent
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-2 font-mono uppercase text-xs"
              onClick={handleRunAgent}
              disabled={!selectedAgent || runAgent.isPending}
            >
              {runAgent.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Run Agent
            </Button>
            <Button
              size="sm"
              className="font-mono uppercase text-xs"
              onClick={handleRunAllAgents}
              disabled={runAllAgents.isPending}
            >
              {runAllAgents.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              Run Pipeline
            </Button>
          </div>
        </div>
      </div>

      <AgentCommunicationPipeline />

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground">
              Active Agents
            </h2>
            <span className="text-xs font-mono text-muted-foreground">
              {agents.length} / {dbAgents?.length || 0}
            </span>
          </div>

          <AgentSearchFilter
            onSearchChange={setSearchQuery}
            onStatusFilter={setStatusFilter}
            onSeverityFilter={setSeverityFilter}
          />

          <div className="space-y-3">
            {agents.length === 0 ? (
              <div className="border-2 border-border bg-card p-6 text-center">
                <p className="text-sm text-muted-foreground font-mono">
                  No agents match filters
                </p>
              </div>
            ) : (
              agents.map((agent) => (
                <AgentDetailCard
                  key={agent.id}
                  agent={agent as Agent}
                  isSelected={selectedAgentId === agent.id}
                  onSelect={() => setSelectedAgentId(agent.id)}
                  onToggle={() => handleToggleAgent(agent.id)}
                />
              ))
            )}
          </div>
        </div>

        <div className="xl:col-span-3">
          {detailsLoading ? (
            <div className="border-2 border-border bg-card p-6">
              <Skeleton className="h-8 w-48 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : selectedAgent ? (
            <div className="space-y-6">
              <div className="border-2 border-border bg-card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold uppercase tracking-wide mb-1">
                      {selectedAgent.name}
                    </h2>
                    <p className="text-sm text-muted-foreground font-mono">
                      {selectedAgent.role}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground block mb-1">
                      Status
                    </span>
                    <span className="font-mono font-bold uppercase">
                      {selectedAgent.status}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedAgent.description}
                </p>
              </div>

              <AgentReasoningFlow agentId={selectedAgent.id} />

              <Tabs defaultValue="decisions" className="w-full">
                <TabsList className="w-full justify-start border-2 border-border bg-card h-auto p-0 flex-wrap">
                  <TabsTrigger
                    value="decisions"
                    className="flex items-center gap-2 px-4 py-3 data-[state=active]:bg-secondary"
                  >
                    <History className="w-4 h-4" />
                    <span className="font-mono uppercase text-xs">
                      Decision History
                    </span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="trends"
                    className="flex items-center gap-2 px-4 py-3 data-[state=active]:bg-secondary"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span className="font-mono uppercase text-xs">Trends</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="connections"
                    className="flex items-center gap-2 px-4 py-3 data-[state=active]:bg-secondary"
                  >
                    <Network className="w-4 h-4" />
                    <span className="font-mono uppercase text-xs">
                      Connections
                    </span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="metrics"
                    className="flex items-center gap-2 px-4 py-3 data-[state=active]:bg-secondary"
                  >
                    <Activity className="w-4 h-4" />
                    <span className="font-mono uppercase text-xs">Metrics</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="config"
                    className="flex items-center gap-2 px-4 py-3 data-[state=active]:bg-secondary"
                  >
                    <Settings className="w-4 h-4" />
                    <span className="font-mono uppercase text-xs">
                      Configuration
                    </span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="decisions" className="mt-4">
                  <AgentDecisionHistory decisions={filteredDecisions} />
                </TabsContent>

                <TabsContent value="trends" className="mt-4">
                  <AgentPerformanceTrends agentName={selectedAgent.name} />
                </TabsContent>

                <TabsContent value="connections" className="mt-4">
                  <AgentConnectionStatus />
                </TabsContent>

                <TabsContent value="metrics" className="mt-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <AgentMetricsPanel
                      metrics={selectedAgent.metrics}
                      actionsToday={selectedAgent.actionsToday}
                    />
                    <div className="border-2 border-border bg-card p-4">
                      <h3 className="font-bold uppercase tracking-wide text-sm mb-4">
                        Performance Summary
                      </h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Total Lifetime Decisions
                          </span>
                          <span className="font-mono font-bold">
                            {selectedAgent.metrics.totalDecisions.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Avg Processing Time
                          </span>
                          <span className="font-mono font-bold">
                            {selectedAgent.metrics.avgResponseTime}s
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Success Rate
                          </span>
                          <span className="font-mono font-bold">
                            {(selectedAgent.metrics.successRate * 100).toFixed(
                              1,
                            )}
                            %
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Confidence Level
                          </span>
                          <span className="font-mono font-bold">
                            {(
                              selectedAgent.metrics.avgConfidence * 100
                            ).toFixed(1)}
                            %
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Actions Today
                          </span>
                          <span className="font-mono font-bold">
                            {selectedAgent.actionsToday}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="config" className="mt-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {isEditingThresholds ? (
                      <AgentThresholdEditor
                        thresholds={selectedAgent.config.thresholds}
                        onSave={handleThresholdSave}
                        onCancel={() => setIsEditingThresholds(false)}
                      />
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-mono uppercase tracking-widest text-muted-foreground">
                            Configuration
                          </h3>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditingThresholds(true)}
                            className="h-7 text-xs font-mono uppercase"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                        </div>
                        <AgentConfigPanel
                          config={selectedAgent.config}
                          onConfigChange={handleConfigChange}
                        />
                      </div>
                    )}
                    <div className="border-2 border-border bg-card p-4">
                      <h3 className="font-bold uppercase tracking-wide text-sm mb-4">
                        Agent Dependencies
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-xs text-muted-foreground uppercase mb-2">
                            Receives Input From
                          </h4>
                          <div className="space-y-1">
                            {selectedAgent.config.triggers.length > 0 ? (
                              selectedAgent.config.triggers.map((trigger) => (
                                <div
                                  key={trigger}
                                  className="flex items-center gap-2 text-sm"
                                >
                                  <GitBranch className="w-3 h-3 text-muted-foreground" />
                                  <span className="font-mono">{trigger}</span>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-muted-foreground">
                                No triggers configured
                              </p>
                            )}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-xs text-muted-foreground uppercase mb-2">
                            Sends Output To
                          </h4>
                          <div className="space-y-1">
                            {selectedAgent.config.outputTargets.length > 0 ? (
                              selectedAgent.config.outputTargets.map(
                                (target) => (
                                  <div
                                    key={target}
                                    className="flex items-center gap-2 text-sm"
                                  >
                                    <GitBranch className="w-3 h-3 text-muted-foreground" />
                                    <span className="font-mono">{target}</span>
                                  </div>
                                ),
                              )
                            ) : (
                              <p className="text-xs text-muted-foreground">
                                No output targets configured
                              </p>
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
            <div className="border-2 border-border bg-card p-8 text-center">
              <p className="text-muted-foreground font-mono">
                Select an agent to view details
              </p>
            </div>
          )}
        </div>
      </div>

      <CreateAgentDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreateAgent={handleCreateAgent}
      />
    </div>
  );
}
