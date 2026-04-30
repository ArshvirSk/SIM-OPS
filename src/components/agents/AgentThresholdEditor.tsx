"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Minus, Plus, Save, X } from "lucide-react";
import { useState } from "react";

interface AgentThresholdEditorProps {
  thresholds: Record<string, number>;
  onSave: (thresholds: Record<string, number>) => void;
  onCancel: () => void;
}

export function AgentThresholdEditor({
  thresholds,
  onSave,
  onCancel,
}: AgentThresholdEditorProps) {
  const [editedThresholds, setEditedThresholds] =
    useState<Record<string, number>>(thresholds);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  const handleUpdate = (key: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setEditedThresholds((prev) => ({ ...prev, [key]: numValue }));
    }
  };

  const handleRemove = (key: string) => {
    setEditedThresholds((prev) => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  };

  const handleAdd = () => {
    if (newKey && newValue) {
      const numValue = parseFloat(newValue);
      if (!isNaN(numValue)) {
        setEditedThresholds((prev) => ({ ...prev, [newKey]: numValue }));
        setNewKey("");
        setNewValue("");
      }
    }
  };

  const formatLabel = (key: string) => {
    return key
      .replace(/([A-Z])/g, " $1")
      .trim()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="border-2 border-border bg-card">
      <div className="border-b-2 border-border p-4 flex items-center justify-between">
        <h3 className="font-bold uppercase tracking-wide text-sm">
          Edit Thresholds
        </h3>
        <button
          onClick={onCancel}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Existing Thresholds */}
        <div className="space-y-3">
          {Object.entries(editedThresholds).map(([key, value]) => (
            <div
              key={key}
              className="flex items-center gap-3 p-3 border border-border bg-background"
            >
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground uppercase mb-1 block">
                  {formatLabel(key)}
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  value={value}
                  onChange={(e) => handleUpdate(key, e.target.value)}
                  className="h-8 font-mono"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRemove(key)}
                className="h-8 w-8 p-0 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <Minus className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Add New Threshold */}
        <div className="border-t-2 border-border pt-4">
          <h4 className="text-xs font-mono uppercase tracking-wide text-muted-foreground mb-3">
            Add New Threshold
          </h4>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label className="text-xs mb-1 block">Name</Label>
              <Input
                placeholder="e.g., maxRetries"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                className="h-8 font-mono"
              />
            </div>
            <div className="w-32">
              <Label className="text-xs mb-1 block">Value</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="0"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="h-8 font-mono"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAdd}
              disabled={!newKey || !newValue}
              className="h-8 w-8 p-0"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t-2 border-border">
          <Button
            onClick={() => onSave(editedThresholds)}
            className="flex-1 font-mono uppercase text-xs"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
            className="font-mono uppercase text-xs"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
