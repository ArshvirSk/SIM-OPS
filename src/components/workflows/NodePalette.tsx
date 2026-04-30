"use client";

import { DraggableNode, NodeType } from "./DraggableNode";

const nodeCategories: { title: string; nodes: NodeType[] }[] = [
  { title: "Triggers", nodes: ["trigger"] },
  { title: "Data", nodes: ["data"] },
  { title: "AI & ML", nodes: ["ml", "decision"] },
  { title: "Logic", nodes: ["condition"] },
  { title: "Actions", nodes: ["action", "notify", "alert"] },
  { title: "Output", nodes: ["report"] },
];

export function NodePalette() {
  return (
    <div className="w-64 border-r-2 border-border bg-card h-full overflow-y-auto">
      <div className="p-4 border-b-2 border-border">
        <h3 className="font-bold uppercase tracking-wide">Node Palette</h3>
        <p className="text-xs text-muted-foreground font-mono mt-1">
          Drag nodes to canvas
        </p>
      </div>
      <div className="p-4 space-y-6">
        {nodeCategories.map((category) => (
          <div key={category.title}>
            <h4 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
              {category.title}
            </h4>
            <div className="space-y-2">
              {category.nodes.map((nodeType) => (
                <DraggableNode key={nodeType} type={nodeType} isTemplate />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
