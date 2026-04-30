"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Download,
  History,
  Loader2,
  Play,
  Redo,
  Save,
  Trash2,
  Undo,
  Upload,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

interface WorkflowToolbarProps {
  workflowName: string;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onRun: () => void;
  onClear: () => void;
  onShowHistory?: () => void;
  hasNodes: boolean;
  isSaving?: boolean;
  isExecuting?: boolean;
}

export function WorkflowToolbar({
  workflowName,
  onNameChange,
  onSave,
  onRun,
  onClear,
  onShowHistory,
  hasNodes,
  isSaving,
  isExecuting,
}: WorkflowToolbarProps) {
  return (
    <div className="border-b-2 border-border bg-card px-4 py-3 flex items-center gap-4">
      <Input
        value={workflowName}
        onChange={(e) => onNameChange(e.target.value)}
        className="w-64 border-2 font-bold uppercase tracking-wide"
        placeholder="Workflow Name"
      />

      <div className="h-6 w-px bg-border" />

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="border-2"
          onClick={onSave}
          disabled={!hasNodes || isSaving || isExecuting}
        >
          <Save className="w-4 h-4 mr-1" />
          {isSaving ? "Saving..." : "Save"}
        </Button>
        <Button
          size="sm"
          onClick={onRun}
          disabled={!hasNodes || isExecuting}
        >
          {isExecuting ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <Play className="w-4 h-4 mr-1" />
          )}
          {isExecuting ? "Running..." : "Run"}
        </Button>
        {onShowHistory && (
          <Button
            variant="outline"
            size="sm"
            className="border-2"
            onClick={onShowHistory}
          >
            <History className="w-4 h-4 mr-1" />
            History
          </Button>
        )}
      </div>

      <div className="h-6 w-px bg-border" />

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="w-8 h-8" disabled>
          <Undo className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="w-8 h-8" disabled>
          <Redo className="w-4 h-4" />
        </Button>
      </div>

      <div className="h-6 w-px bg-border" />

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="w-8 h-8">
          <ZoomOut className="w-4 h-4" />
        </Button>
        <span className="text-xs font-mono w-12 text-center">100%</span>
        <Button variant="ghost" size="icon" className="w-8 h-8">
          <ZoomIn className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="border-2">
          <Upload className="w-4 h-4 mr-1" />
          Import
        </Button>
        <Button variant="outline" size="sm" className="border-2">
          <Download className="w-4 h-4 mr-1" />
          Export
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="border-2 border-destructive text-destructive hover:bg-destructive/10"
          onClick={onClear}
          disabled={!hasNodes}
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Clear
        </Button>
      </div>
    </div>
  );
}
