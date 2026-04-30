"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useRef, useState } from "react";
import { useDrop } from "react-dnd";
import { CanvasNode, CanvasNodeData } from "./CanvasNode";
import { NodeType } from "./DraggableNode";
import {
  Connection,
  DraggingConnection,
  NodeConnection,
} from "./NodeConnection";

interface WorkflowCanvasProps {
  nodes: CanvasNodeData[];
  onNodesChange: (nodes: CanvasNodeData[]) => void;
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
  connections?: Connection[];
  onConnectionsChange?: (connections: Connection[]) => void;
}

export function WorkflowCanvas({
  nodes,
  onNodesChange,
  selectedNodeId,
  onSelectNode,
  connections = [],
  onConnectionsChange,
}: WorkflowCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [configureNode, setConfigureNode] = useState<CanvasNodeData | null>(
    null,
  );
  const [selectedConnectionId, setSelectedConnectionId] = useState<
    string | null
  >(null);
  const [draggingConnection, setDraggingConnection] = useState<{
    fromNodeId: string;
    fromSide: "left" | "right";
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: "workflow-node",
      drop: (item: { type: NodeType }, monitor) => {
        const offset = monitor.getClientOffset();
        const canvasRect = canvasRef.current?.getBoundingClientRect();

        if (offset && canvasRect) {
          const x = offset.x - canvasRect.left - 90;
          const y = offset.y - canvasRect.top - 40;

          const newNode: CanvasNodeData = {
            id: `node-${Date.now()}`,
            type: item.type,
            x: Math.max(0, x),
            y: Math.max(0, y),
            config: {},
          };

          onNodesChange([...nodes, newNode]);
          onSelectNode(newNode.id);
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
    }),
    [nodes, onNodesChange, onSelectNode],
  );

  const handleMoveNode = (id: string, x: number, y: number) => {
    onNodesChange(
      nodes.map((n) =>
        n.id === id ? { ...n, x: Math.max(0, x), y: Math.max(0, y) } : n,
      ),
    );
  };

  const handleDeleteNode = (id: string) => {
    onNodesChange(nodes.filter((n) => n.id !== id));
    // Also remove any connections involving this node
    if (onConnectionsChange) {
      onConnectionsChange(
        connections.filter((c) => c.fromNodeId !== id && c.toNodeId !== id),
      );
    }
    if (selectedNodeId === id) {
      onSelectNode(null);
    }
  };

  const handleConfigureNode = (node: CanvasNodeData) => {
    setConfigureNode(node);
  };

  const handleSaveConfig = (config: Record<string, unknown>) => {
    if (configureNode) {
      onNodesChange(
        nodes.map((n) => (n.id === configureNode.id ? { ...n, config } : n)),
      );
      setConfigureNode(null);
    }
  };

  const handleStartConnection = (
    nodeId: string,
    side: "left" | "right",
    x: number,
    y: number,
  ) => {
    setDraggingConnection({
      fromNodeId: nodeId,
      fromSide: side,
      startX: x,
      startY: y,
      currentX: x,
      currentY: y,
    });

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      setDraggingConnection((prev) =>
        prev
          ? {
              ...prev,
              currentX: e.clientX - rect.left + canvasRef.current!.scrollLeft,
              currentY: e.clientY - rect.top + canvasRef.current!.scrollTop,
            }
          : null,
      );
    };

    const handleMouseUp = () => {
      setDraggingConnection(null);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleEndConnection = (targetNodeId: string) => {
    if (!draggingConnection || !onConnectionsChange) return;

    const fromId = draggingConnection.fromNodeId;
    const toId = targetNodeId;

    // Don't connect to self
    if (fromId === toId) return;

    // Check if connection already exists
    const exists = connections.some(
      (c) =>
        (c.fromNodeId === fromId && c.toNodeId === toId) ||
        (c.fromNodeId === toId && c.toNodeId === fromId),
    );

    if (!exists) {
      const newConnection: Connection = {
        id: `conn-${Date.now()}`,
        fromNodeId: fromId,
        toNodeId: toId,
      };
      onConnectionsChange([...connections, newConnection]);
    }

    setDraggingConnection(null);
  };

  const handleDeleteConnection = (connectionId: string) => {
    if (onConnectionsChange) {
      onConnectionsChange(connections.filter((c) => c.id !== connectionId));
    }
    setSelectedConnectionId(null);
  };

  const getNodeConnectionPoint = (nodeId: string, side: "left" | "right") => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };

    // Node width is approximately 180px, height ~120px
    const nodeWidth = 180;
    const nodeHeight = 120;

    return {
      x: side === "right" ? node.x + nodeWidth + 8 : node.x - 8,
      y: node.y + nodeHeight / 2,
    };
  };

  drop(canvasRef);

  const handleCanvasClick = () => {
    onSelectNode(null);
    setSelectedConnectionId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Delete" || e.key === "Backspace") {
      if (selectedConnectionId) {
        handleDeleteConnection(selectedConnectionId);
      }
    }
  };

  return (
    <>
      <div
        ref={canvasRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex-1 relative overflow-auto outline-none bg-muted/20",
          isOver && "bg-accent/30",
        )}
        style={{
          minHeight: "600px",
          backgroundImage: `
            linear-gradient(to right, hsl(var(--border) / 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--border) / 0.1) 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px",
        }}
        onClick={handleCanvasClick}
      >
        {/* SVG layer for connections */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ minHeight: "600px", minWidth: "100%" }}
        >
          <g className="pointer-events-auto">
            {connections.map((conn) => {
              const fromPoint = getNodeConnectionPoint(
                conn.fromNodeId,
                "right",
              );
              const toPoint = getNodeConnectionPoint(conn.toNodeId, "left");

              return (
                <NodeConnection
                  key={conn.id}
                  fromX={fromPoint.x}
                  fromY={fromPoint.y}
                  toX={toPoint.x}
                  toY={toPoint.y}
                  isSelected={selectedConnectionId === conn.id}
                  onClick={() => {
                    setSelectedConnectionId(conn.id);
                    onSelectNode(null);
                  }}
                />
              );
            })}

            {draggingConnection && (
              <DraggingConnection
                fromX={draggingConnection.startX}
                fromY={draggingConnection.startY}
                toX={draggingConnection.currentX}
                toY={draggingConnection.currentY}
              />
            )}
          </g>
        </svg>

        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center p-8 border-2 border-dashed border-border bg-card/80">
              <p className="font-mono text-lg uppercase tracking-wide mb-2">
                Drop Nodes Here
              </p>
              <p className="text-sm text-muted-foreground">
                Drag nodes from the palette to build your workflow
              </p>
            </div>
          </div>
        )}

        {nodes.map((node) => (
          <CanvasNode
            key={node.id}
            node={node}
            isSelected={selectedNodeId === node.id}
            onSelect={() => onSelectNode(node.id)}
            onDelete={() => handleDeleteNode(node.id)}
            onMove={(x, y) => handleMoveNode(node.id, x, y)}
            onConfigure={() => handleConfigureNode(node)}
            onStartConnection={handleStartConnection}
            onEndConnection={handleEndConnection}
            isConnecting={!!draggingConnection}
          />
        ))}
      </div>

      {/* Node Configuration Dialog */}
      <Dialog
        open={!!configureNode}
        onOpenChange={() => setConfigureNode(null)}
      >
        <DialogContent className="border-2">
          <DialogHeader>
            <DialogTitle className="uppercase tracking-wide">
              Configure {configureNode?.type} Node
            </DialogTitle>
          </DialogHeader>
          <NodeConfigForm
            node={configureNode}
            onSave={handleSaveConfig}
            onCancel={() => setConfigureNode(null)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

interface NodeConfigFormProps {
  node: CanvasNodeData | null;
  onSave: (config: Record<string, unknown>) => void;
  onCancel: () => void;
}

function NodeConfigForm({ node, onSave, onCancel }: NodeConfigFormProps) {
  const [config, setConfig] = useState<Record<string, unknown>>(
    node?.config || {},
  );

  if (!node) return null;

  const renderFields = () => {
    switch (node.type) {
      case "trigger":
        return (
          <>
            <div className="space-y-2">
              <Label className="uppercase text-xs tracking-wide">
                Schedule
              </Label>
              <Select
                value={(config.schedule as string) || "daily"}
                onValueChange={(v) => setConfig({ ...config, schedule: v })}
              >
                <SelectTrigger className="border-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-2 bg-card">
                  <SelectItem value="hourly">Every Hour</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="uppercase text-xs tracking-wide">Time</Label>
              <Input
                type="time"
                className="border-2"
                value={(config.time as string) || "09:00"}
                onChange={(e) => setConfig({ ...config, time: e.target.value })}
              />
            </div>
          </>
        );
      case "data":
        return (
          <>
            <div className="space-y-2">
              <Label className="uppercase text-xs tracking-wide">
                Data Source
              </Label>
              <Select
                value={(config.source as string) || "database"}
                onValueChange={(v) => setConfig({ ...config, source: v })}
              >
                <SelectTrigger className="border-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-2 bg-card">
                  <SelectItem value="database">Database</SelectItem>
                  <SelectItem value="api">REST API</SelectItem>
                  <SelectItem value="csv">CSV Import</SelectItem>
                  <SelectItem value="crm">CRM</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="uppercase text-xs tracking-wide">
                Query/Endpoint
              </Label>
              <Input
                className="border-2 font-mono"
                placeholder="e.g., /api/customers"
                value={(config.query as string) || ""}
                onChange={(e) =>
                  setConfig({ ...config, query: e.target.value })
                }
              />
            </div>
          </>
        );
      case "ml":
        return (
          <>
            <div className="space-y-2">
              <Label className="uppercase text-xs tracking-wide">Model</Label>
              <Select
                value={(config.model as string) || "churn"}
                onValueChange={(v) => setConfig({ ...config, model: v })}
              >
                <SelectTrigger className="border-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-2 bg-card">
                  <SelectItem value="churn">Churn Prediction</SelectItem>
                  <SelectItem value="forecast">Sales Forecast</SelectItem>
                  <SelectItem value="anomaly">Anomaly Detection</SelectItem>
                  <SelectItem value="sentiment">Sentiment Analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="uppercase text-xs tracking-wide">
                Confidence Threshold
              </Label>
              <Input
                type="number"
                min="0"
                max="100"
                className="border-2"
                value={(config.threshold as string) || "80"}
                onChange={(e) =>
                  setConfig({ ...config, threshold: e.target.value })
                }
              />
            </div>
          </>
        );
      case "notify":
        return (
          <>
            <div className="space-y-2">
              <Label className="uppercase text-xs tracking-wide">Channel</Label>
              <Select
                value={(config.channel as string) || "email"}
                onValueChange={(v) => setConfig({ ...config, channel: v })}
              >
                <SelectTrigger className="border-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-2 bg-card">
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="slack">Slack</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="webhook">Webhook</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="uppercase text-xs tracking-wide">
                Recipients
              </Label>
              <Input
                className="border-2"
                placeholder="team@example.com"
                value={(config.recipients as string) || ""}
                onChange={(e) =>
                  setConfig({ ...config, recipients: e.target.value })
                }
              />
            </div>
          </>
        );
      default:
        return (
          <div className="space-y-2">
            <Label className="uppercase text-xs tracking-wide">Name</Label>
            <Input
              className="border-2"
              placeholder="Node name"
              value={(config.name as string) || ""}
              onChange={(e) => setConfig({ ...config, name: e.target.value })}
            />
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {renderFields()}
      <div className="flex gap-2 pt-4">
        <Button
          variant="outline"
          className="flex-1 border-2"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button className="flex-1" onClick={() => onSave(config)}>
          Save
        </Button>
      </div>
    </div>
  );
}
