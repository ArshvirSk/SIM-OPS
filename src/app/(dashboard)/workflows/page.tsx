"use client";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { CanvasNodeData } from "@/components/workflows/CanvasNode";
import { Connection } from "@/components/workflows/NodeConnection";
import { NodePalette } from "@/components/workflows/NodePalette";
import { WorkflowCanvas } from "@/components/workflows/WorkflowCanvas";
import { Workflow, WorkflowList } from "@/components/workflows/WorkflowList";
import { WorkflowToolbar } from "@/components/workflows/WorkflowToolbar";
import { useRealtimeWorkflows } from "@/hooks/useRealtimeWorkflows";
import {
  useCreateWorkflow,
  useCreateWorkflowRun,
  useDeleteWorkflow,
  useExecuteWorkflow,
  useUpdateWorkflow,
  useWorkflowRuns,
  useWorkflows,
} from "@/hooks/useWorkflows";
import type { Json } from "@/integrations/supabase/types";
import { getErrorMessage } from "@/types/errors";
import { GitBranch } from "lucide-react";
import { useEffect, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { toast } from "sonner";

export default function WorkflowsPage() {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(
    null,
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [workflowName, setWorkflowName] = useState("");
  const [localNodes, setLocalNodes] = useState<CanvasNodeData[]>([]);
  const [localConnections, setLocalConnections] = useState<Connection[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Enable real-time updates
  useRealtimeWorkflows();

  const { data: dbWorkflows, isLoading } = useWorkflows();
  const { data: workflowRuns } = useWorkflowRuns(selectedWorkflowId);
  const createWorkflow = useCreateWorkflow();
  const updateWorkflow = useUpdateWorkflow();
  const deleteWorkflow = useDeleteWorkflow();
  const createWorkflowRun = useCreateWorkflowRun();
  const executeWorkflow = useExecuteWorkflow();

  // Map DB workflows to UI format
  const workflows: Workflow[] = (dbWorkflows || []).map((w) => {
    // Handle both old format (array) and new format (object with nodes property)
    let nodeCount = 0;
    if (Array.isArray(w.nodes)) {
      nodeCount = w.nodes.length;
    } else if (
      w.nodes &&
      typeof w.nodes === "object" &&
      "nodes" in (w.nodes as any)
    ) {
      const nodesArray = (w.nodes as any).nodes;
      if (Array.isArray(nodesArray)) {
        nodeCount = nodesArray.length;
      }
    }

    return {
      id: w.id,
      name: w.name,
      status: w.status as "active" | "paused" | "draft",
      lastRun: w.last_run
        ? new Date(w.last_run).toLocaleDateString()
        : undefined,
      nodeCount,
      runsToday: w.run_count,
    };
  });

  // Select first workflow if none selected
  useEffect(() => {
    if (workflows.length > 0 && !selectedWorkflowId) {
      const first = workflows[0];
      if (first) {
        setSelectedWorkflowId(first.id);
        setWorkflowName(first.name);
        const dbWf = dbWorkflows?.find((w) => w.id === first.id);

        let nodesArray: CanvasNodeData[] = [];
        if (Array.isArray(dbWf?.nodes)) {
          nodesArray = dbWf?.nodes as unknown as CanvasNodeData[];
        } else if (
          dbWf?.nodes &&
          typeof dbWf.nodes === "object" &&
          "nodes" in (dbWf.nodes as any)
        ) {
          nodesArray = (dbWf.nodes as any).nodes as CanvasNodeData[];
        }
        setLocalNodes(nodesArray);

        // Load connections if stored
        const wfData = dbWf?.nodes as unknown as {
          _connections?: Connection[];
        };
        if (wfData?._connections) {
          setLocalConnections(wfData._connections);
        }
      }
    }
  }, [workflows, selectedWorkflowId, dbWorkflows]);

  const handleNodesChange = (nodes: CanvasNodeData[]) => {
    setLocalNodes(nodes);
  };

  const handleConnectionsChange = (connections: Connection[]) => {
    setLocalConnections(connections);
  };

  const handleSelectWorkflow = (id: string) => {
    setSelectedWorkflowId(id);
    setSelectedNodeId(null);
    const workflow = dbWorkflows?.find((w) => w.id === id);
    if (workflow) {
      setWorkflowName(workflow.name);

      let nodesArray: CanvasNodeData[] = [];
      if (Array.isArray(workflow.nodes)) {
        nodesArray = workflow.nodes as unknown as CanvasNodeData[];
      } else if (
        workflow.nodes &&
        typeof workflow.nodes === "object" &&
        "nodes" in (workflow.nodes as any)
      ) {
        nodesArray = (workflow.nodes as any).nodes as CanvasNodeData[];
      }
      setLocalNodes(nodesArray);

      // Load connections
      const wfData = workflow.nodes as unknown as {
        _connections?: Connection[];
      };
      if (wfData?._connections) {
        setLocalConnections(wfData._connections);
      } else {
        setLocalConnections([]);
      }
    }
  };

  const handleNewWorkflow = async () => {
    try {
      const result = await createWorkflow.mutateAsync({
        name: "New Workflow",
        status: "draft",
        nodes: [] as unknown as Json,
      });
      setSelectedWorkflowId(result.id);
      setWorkflowName("New Workflow");
      setLocalNodes([]);
      setLocalConnections([]);
      setSelectedNodeId(null);
      toast.success(
        "Workflow created. Start building by dragging nodes to the canvas.",
      );
    } catch {
      toast.error("Failed to create workflow");
    }
  };

  const handleDeleteWorkflow = async (id: string) => {
    try {
      await deleteWorkflow.mutateAsync(id);
      if (selectedWorkflowId === id) {
        setSelectedWorkflowId(null);
        setLocalNodes([]);
        setLocalConnections([]);
      }
      toast.success("Workflow deleted");
    } catch {
      toast.error("Failed to delete workflow");
    }
  };

  const handleToggleStatus = async (id: string) => {
    const workflow = dbWorkflows?.find((w) => w.id === id);
    if (!workflow) return;

    const newStatus = workflow.status === "active" ? "paused" : "active";
    try {
      await updateWorkflow.mutateAsync({
        id,
        updates: { status: newStatus },
      });
      toast.success(
        `Workflow ${newStatus === "active" ? "activated" : "paused"}`,
      );
    } catch {
      toast.error("Failed to update workflow status");
    }
  };

  const handleSave = async () => {
    if (!selectedWorkflowId) return;

    setIsSaving(true);
    try {
      // Store connections alongside nodes
      const nodesData = {
        nodes: localNodes,
        _connections: localConnections,
      };
      await updateWorkflow.mutateAsync({
        id: selectedWorkflowId,
        updates: {
          name: workflowName,
          nodes: nodesData as unknown as Json,
        },
      });
      toast.success(`"${workflowName}" saved successfully`);
    } catch {
      toast.error("Failed to save workflow");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRun = async () => {
    if (!selectedWorkflowId || localNodes.length === 0) {
      toast.error("Add nodes to the workflow before running");
      return;
    }

    setIsExecuting(true);
    try {
      // Convert nodes to executor format
      const executorNodes = localNodes.map((node) => ({
        id: node.id,
        type: node.type,
        x: node.x,
        y: node.y,
        config: node.config as
          | import("@/types/workflow").NodeConfig
          | undefined,
      }));

      const executorConnections = localConnections.map((conn) => ({
        from: (conn as any).source || (conn as any).from,
        to: (conn as any).target || (conn as any).to,
      }));

      toast.info(`Executing "${workflowName}"...`);

      const result = await executeWorkflow.mutateAsync({
        workflowId: selectedWorkflowId,
        nodes: executorNodes,
        connections: executorConnections,
      });

      if (result.status === "success") {
        toast.success(
          `Workflow completed successfully! ${result.successfulNodes}/${result.totalNodes} nodes executed.`,
        );
      } else if (result.status === "partial") {
        toast.warning(
          `Workflow completed with errors. ${result.successfulNodes}/${result.totalNodes} nodes succeeded.`,
        );
      } else {
        toast.error(`Workflow failed. ${result.failedNodes} nodes failed.`);
      }
    } catch (error: unknown) {
      toast.error(`Workflow execution failed: ${getErrorMessage(error)}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleClear = () => {
    setLocalNodes([]);
    setLocalConnections([]);
    setSelectedNodeId(null);
    toast.info("Canvas cleared");
  };

  if (isLoading) {
    return (
      <DndProvider backend={HTML5Backend}>
        <div className="flex h-[calc(100vh-8rem)] gap-0 -m-6">
          <div className="w-80 space-y-4 p-4 border-r-2 border-border">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="flex-1">
            <Skeleton className="h-full w-full" />
          </div>
        </div>
      </DndProvider>
    );
  }

  return (
    <ErrorBoundary>
      <DndProvider backend={HTML5Backend}>
        {workflows.length === 0 ? (
          <EmptyState
            icon={GitBranch}
            title="No Workflows Yet"
            description="Create your first workflow to start automating your processes"
            action={{
              label: "Create Workflow",
              onClick: handleNewWorkflow,
            }}
          />
        ) : (
          <div className="flex h-[calc(100vh-8rem)] gap-0 -m-6">
            <WorkflowList
              workflows={workflows}
              selectedId={selectedWorkflowId}
              onSelect={handleSelectWorkflow}
              onNew={handleNewWorkflow}
              onDelete={handleDeleteWorkflow}
              onToggleStatus={handleToggleStatus}
            />

            <div className="flex-1 flex flex-col overflow-hidden">
              <WorkflowToolbar
                workflowName={workflowName}
                onNameChange={setWorkflowName}
                onSave={handleSave}
                onRun={handleRun}
                onClear={handleClear}
                onShowHistory={() => setShowHistory(!showHistory)}
                hasNodes={localNodes.length > 0}
                isSaving={isSaving}
                isExecuting={isExecuting}
              />

              <div className="flex-1 flex overflow-hidden">
                <NodePalette />

                <WorkflowCanvas
                  nodes={localNodes}
                  onNodesChange={handleNodesChange}
                  selectedNodeId={selectedNodeId}
                  onSelectNode={setSelectedNodeId}
                  connections={localConnections}
                  onConnectionsChange={handleConnectionsChange}
                />

                {showHistory && (
                  <div className="w-80 border-l-2 border-border bg-card overflow-y-auto">
                    <div className="p-4 border-b-2 border-border">
                      <h3 className="font-bold uppercase tracking-wide">
                        Execution History
                      </h3>
                    </div>
                    <div className="p-4 space-y-3">
                      {!workflowRuns || workflowRuns.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No execution history yet. Run the workflow to see
                          results.
                        </p>
                      ) : (
                        workflowRuns.map((run) => (
                          <div
                            key={run.id}
                            className="border-2 border-border rounded-lg p-3 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                                  run.status === "completed"
                                    ? "bg-green-500/20 text-green-500"
                                    : run.status === "failed"
                                      ? "bg-red-500/20 text-red-500"
                                      : "bg-yellow-500/20 text-yellow-500"
                                }`}
                              >
                                {run.status}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(run.started_at).toLocaleString()}
                              </span>
                            </div>
                            <div className="text-sm space-y-1">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  Steps:
                                </span>
                                <span className="font-mono">
                                  {run.steps_completed}/{run.total_steps}
                                </span>
                              </div>
                              {run.completed_at && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">
                                    Duration:
                                  </span>
                                  <span className="font-mono">
                                    {Math.round(
                                      (new Date(run.completed_at).getTime() -
                                        new Date(run.started_at).getTime()) /
                                        1000,
                                    )}
                                    s
                                  </span>
                                </div>
                              )}
                              {run.error_message && (
                                <div className="text-xs text-red-500 mt-2">
                                  {run.error_message}
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </DndProvider>
    </ErrorBoundary>
  );
}
