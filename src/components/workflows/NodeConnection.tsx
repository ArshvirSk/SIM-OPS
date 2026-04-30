"use client";

import { cn } from "@/lib/utils";

export interface Connection {
  id: string;
  fromNodeId: string;
  toNodeId: string;
}

interface NodeConnectionProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  isSelected?: boolean;
  onClick?: () => void;
}

export function NodeConnection({
  fromX,
  fromY,
  toX,
  toY,
  isSelected,
  onClick,
}: NodeConnectionProps) {
  // Calculate control points for a smooth bezier curve
  const deltaX = Math.abs(toX - fromX);
  const controlOffset = Math.min(deltaX * 0.5, 100);

  const path = `M ${fromX} ${fromY} C ${fromX + controlOffset} ${fromY}, ${toX - controlOffset} ${toY}, ${toX} ${toY}`;

  return (
    <g onClick={onClick} className="cursor-pointer">
      {/* Invisible wider path for easier clicking */}
      <path d={path} fill="none" stroke="transparent" strokeWidth="16" />
      {/* Visible connection line */}
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className={cn(
          "transition-colors",
          isSelected ? "text-foreground" : "text-muted-foreground",
        )}
      />
      {/* Arrow head */}
      <polygon
        points={`${toX},${toY} ${toX - 8},${toY - 4} ${toX - 8},${toY + 4}`}
        fill="currentColor"
        className={cn(
          "transition-colors",
          isSelected ? "text-foreground" : "text-muted-foreground",
        )}
      />
    </g>
  );
}

interface DraggingConnectionProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

export function DraggingConnection({
  fromX,
  fromY,
  toX,
  toY,
}: DraggingConnectionProps) {
  const controlOffset = Math.min(Math.abs(toX - fromX) * 0.5, 100);
  const path = `M ${fromX} ${fromY} C ${fromX + controlOffset} ${fromY}, ${toX - controlOffset} ${toY}, ${toX} ${toY}`;

  return (
    <path
      d={path}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeDasharray="6 4"
      className="text-foreground animate-pulse"
    />
  );
}
