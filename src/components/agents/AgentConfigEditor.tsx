"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { AgentConfig } from "@/data/agentsData";
import { Minus, Plus, Save, Send, Sliders, X, Zap } from "lucide-react";
import { useState } from "react";

interface AgentConfigEditorProps {
  config: AgentConfig;
  onSave: (config: AgentConfig) => void;
  onCancel: () => void;
}

const AVAILABLE_TRIGGERS = [
  "scheduled",
  "event-based",
  "monitoring-agent",
  "prediction-agent",
  "decision-agent",
  "action-agent",
  "manual",
  "realtime",
  "webhook",
];

const AVAILABLE_OUTPUT_TARGETS = [
  "Decision Agent",
  "Action Agent",
  "Reporting Agent",
  "Feedback Agent",
  "Monitoring Agent",
  "Prediction Agent",
  "Dashboard",
  "Email",
  "Slack",
  "Webhook",
  "Database",
];

export function AgentConfigEditor({
  config,
  onSave,
  onCancel,
}: AgentConfigEditorProps) {
  const [editedConfig, setEditedConfig] = useState<AgentConfig>(config);
  const [newTrigger, setNewTrigger] = useState("");
  const [newOutputTarget, setNewOutputTarget] = useState("");
  const [newThresholdKey, setNewThresholdKey] = useState("");
  const [newThresholdValue, setNewThresholdValue] = useState("");

  const handleAddTrigger = () => {
    if (newTrigger && !editedConfig.triggers.includes(newTrigger)) {
      setEditedConfig((prev) => ({
        ...prev,
        triggers: [...prev.triggers, newTrigger],
      }));
      setNewTrigger("");
    }
  };

  const handleRemoveTrigger = (trigger: string) => {
    setEditedConfig((prev) => ({
      ...prev,
      triggers: prev.triggers.filter((t) => t !== trigger),
    }));
  };

  const handleAddOutputTarget = () => {
    if (
      newOutputTarget &&
      !editedConfig.outputTargets.includes(newOutputTarget)
    ) {
      setEditedConfig((prev) => ({
        ...prev,
        outputTargets: [...prev.outputTargets, newOutputTarget],
      }));
      setNewOutputTarget("");
    }
  };

  const handleRemoveOutputTarget = (target: string) => {
    setEditedConfig((prev) => ({
      ...prev,
      outputTargets: prev.outputTargets.filter((t) => t !== target),
    }));
  };

  const handleUpdateThreshold = (key: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setEditedConfig((prev) => ({
        ...prev,
        thresholds: { ...prev.thresholds, [key]: numValue },
      }));
    }
  };

  const handleRemoveThreshold = (key: string) => {
    setEditedConfig((prev) => {
      const updated = { ...prev.thresholds };
      delete updated[key];
      return { ...prev, thresholds: updated };
    });
  };

  const handleAddThreshold = () => {
    if (newThresholdKey && newThresholdValue) {
      const numValue = parseFloat(newThresholdValue);
      if (!isNaN(numValue)) {
        setEditedConfig((prev) => ({
          ...prev,
          thresholds: { ...prev.thresholds, [newThresholdKey]: numValue },
        }));
        setNewThresholdKey("");
        setNewThresholdValue("");
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
          Edit Configuration
        </h3>
        <button
          onClick={onCancel}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* Agent Enabled */}
        <div className="flex items-center justify-between">
          <Label htmlFor="agent-enabled" className="font-mono text-sm">
            Agent Enabled
          </Label>
          <Switch
            id="agent-enabled"
            checked={editedConfig.enabled}
            onCheckedChange={(checked) => {
              setEditedConfig((prev) => ({ ...prev, enabled: checked }));
            }}
          />
        </div>

        {/* Thresholds */}
        <div className="border-t border-border pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Sliders className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground uppercase">
              Thresholds (Numeric values that control agent behavior)
            </span>
          </div>

          {/* Existing Thresholds */}
          <div className="space-y-2 mb-3">
            {editedConfig.thresholds &&
            Object.keys(editedConfig.thresholds).length > 0 ? (
              Object.entries(editedConfig.thresholds).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center gap-2 p-2 border border-border bg-background"
                >
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground mb-1 block">
                      {formatLabel(key)}
                    </Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={value}
                      onChange={(e) => handleUpdateThreshold(key, e.target.value)}
                      className="h-7 font-mono text-xs"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveThreshold(key)}
                    className="h-7 w-7 p-0 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">
                No thresholds configured
              </p>
            )}
          </div>

          {/* Add New Threshold */}
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Input
                placeholder="Threshold name (e.g., maxRetries)"
                value={newThresholdKey}
                onChange={(e) => setNewThresholdKey(e.target.value)}
                className="h-8 font-mono text-xs"
              />
            </div>
            <div className="w-24">
              <Input
                type="number"
                step="0.1"
                placeholder="Value"
                value={newThresholdValue}
                onChange={(e) => setNewThresholdValue(e.target.value)}
                className="h-8 font-mono text-xs"
              />
            </div>
            <Button
              size="sm"
              onClick={handleAddThreshold}
              disabled={!newThresholdKey || !newThresholdValue}
              className="h-8 px-3"
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Triggers */}
        <div className="border-t border-border pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground uppercase">
              Triggers (What activates this agent)
            </span>
          </div>

          {/* Add Trigger */}
          <div className="flex gap-2 mb-3">
            <Select value={newTrigger} onValueChange={setNewTrigger}>
              <SelectTrigger className="flex-1 h-8 text-xs">
                <SelectValue placeholder="Select trigger..." />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_TRIGGERS.map((trigger) => (
                  <SelectItem key={trigger} value={trigger} className="text-xs">
                    {trigger}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={handleAddTrigger}
              disabled={!newTrigger}
              className="h-8 px-3"
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>

          {/* Trigger List */}
          <div className="flex flex-wrap gap-2">
            {editedConfig.triggers.length > 0 ? (
              editedConfig.triggers.map((trigger) => (
                <Badge
                  key={trigger}
                  variant="outline"
                  className="font-mono text-xs pr-1"
                >
                  {trigger}
                  <button
                    onClick={() => handleRemoveTrigger(trigger)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">
                No triggers configured
              </p>
            )}
          </div>
        </div>

        {/* Output Targets */}
        <div className="border-t border-border pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Send className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground uppercase">
              Output Targets (Where results go)
            </span>
          </div>

          {/* Add Output Target */}
          <div className="flex gap-2 mb-3">
            <Select
              value={newOutputTarget}
              onValueChange={setNewOutputTarget}
            >
              <SelectTrigger className="flex-1 h-8 text-xs">
                <SelectValue placeholder="Select output target..." />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_OUTPUT_TARGETS.map((target) => (
                  <SelectItem key={target} value={target} className="text-xs">
                    {target}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={handleAddOutputTarget}
              disabled={!newOutputTarget}
              className="h-8 px-3"
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>

          {/* Output Target List */}
          <div className="flex flex-wrap gap-2">
            {editedConfig.outputTargets.length > 0 ? (
              editedConfig.outputTargets.map((target) => (
                <Badge
                  key={target}
                  variant="secondary"
                  className="font-mono text-xs pr-1"
                >
                  {target}
                  <button
                    onClick={() => handleRemoveOutputTarget(target)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">
                No output targets configured
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t-2 border-border">
          <Button
            onClick={() => onSave(editedConfig)}
            className="flex-1 font-mono uppercase text-xs"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Configuration
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
