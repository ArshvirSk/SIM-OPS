"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GripVertical, Settings, X } from "lucide-react";
import { useRef, useState } from "react";
import { nodeConfigs, NodeType } from "./DraggableNode";

export interface CanvasNodeData {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  config?: Record<string, unknown>;
}

interface CanvasNodeProps {
  node: CanvasNodeData;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onMove: (x: number, y: number) => void;
  onConfigure: () => void;
  onStartConnection?: (
    nodeId: string,
    side: "left" | "right",
    x: number,
    y: number,
  ) => void;
  onEndConnection?: (nodeId: string) => void;
  isConnecting?: boolean;
}

export function CanvasNode({
  node,
  isSelected,
  onSelect,
  onDelete,
  onMove,
  onConfigure,
  onStartConnection,
  onEndConnection,
  isConnecting,
}: CanvasNodeProps) {
  const config = nodeConfigs[node.type];
  const Icon = config.icon;
  const [isDragging, setIsDragging] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startNodeX = node.x;
    const startNodeY = node.y;

    setIsDragging(true);
    onSelect();

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      onMove(startNodeX + deltaX, startNodeY + deltaY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleConnectionPointMouseDown = (
    e: React.MouseEvent,
    side: "left" | "right",
  ) => {
    e.stopPropagation();
    if (!onStartConnection || !nodeRef.current) return;

    const rect = nodeRef.current.getBoundingClientRect();
    const canvasRect = nodeRef.current.parentElement?.getBoundingClientRect();

    if (canvasRect) {
      const x =
        side === "right"
          ? rect.right - canvasRect.left
          : rect.left - canvasRect.left;
      const y = rect.top + rect.height / 2 - canvasRect.top;
      onStartConnection(node.id, side, x, y);
    }
  };

  const handleConnectionPointMouseUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEndConnection && isConnecting) {
      onEndConnection(node.id);
    }
  };

  return (
    <div
      ref={nodeRef}
      className={cn(
        "absolute flex flex-col border-2 bg-card shadow-xs transition-shadow min-w-[180px] select-none",
        isSelected ? "border-foreground shadow-sm z-10" : "border-border",
        isDragging && "shadow-md cursor-grabbing",
        isConnecting && "z-20",
      )}
      style={{ left: node.x, top: node.y }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 border-b-2 border-border cursor-grab",
          config.color,
        )}
        onMouseDown={handleMouseDown}
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
        <Icon className="w-4 h-4" />
        <span className="font-mono text-sm font-medium uppercase tracking-wide flex-1">
          {config.label}
        </span>
        {isSelected && (
          <Button
            variant="ghost"
            size="icon"
            className="w-5 h-5 p-0 hover:bg-destructive/20"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      {/* Body */}
      <div className="p-3">
        <p className="text-xs text-muted-foreground mb-2">
          {config.description}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs border-2"
          onClick={(e) => {
            e.stopPropagation();
            onConfigure();
          }}
        >
          <Settings className="w-3 h-3 mr-1" />
          Configure
        </Button>
      </div>

      {/* Connection points */}
      {node.type !== "trigger" && (
        <div
          className={cn(
            "absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-border bg-background cursor-crosshair transition-colors hover:border-foreground hover:bg-secondary",
            isConnecting && "border-foreground bg-secondary animate-pulse",
          )}
          onMouseDown={(e) => handleConnectionPointMouseDown(e, "left")}
          onMouseUp={handleConnectionPointMouseUp}
        />
      )}
      {node.type !== "report" && (
        <div
          className={cn(
            "absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-border bg-background cursor-crosshair transition-colors hover:border-foreground hover:bg-secondary",
            isConnecting && "border-foreground bg-secondary animate-pulse",
          )}
          onMouseDown={(e) => handleConnectionPointMouseDown(e, "right")}
          onMouseUp={handleConnectionPointMouseUp}
        />
      )}
    </div>
  );
}
