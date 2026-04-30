"use client";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { AgentConfig } from "@/data/agentsData";
import { Send, Settings, Sliders, Zap } from "lucide-react";

interface AgentConfigPanelProps {
  config: AgentConfig;
  onConfigChange?: (config: AgentConfig) => void;
}

export function AgentConfigPanel({
  config,
  onConfigChange,
}: AgentConfigPanelProps) {
  return (
    <div className="border-2 border-border bg-card">
      <div className="border-b-2 border-border p-4">
        <h3 className="font-bold uppercase tracking-wide text-sm flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Configuration
        </h3>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="agent-enabled" className="font-mono text-sm">
            Agent Enabled
          </Label>
          <Switch
            id="agent-enabled"
            checked={config.enabled}
            onCheckedChange={(checked) => {
              onConfigChange?.({ ...config, enabled: checked });
            }}
          />
        </div>

        <div className="border-t border-border pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Sliders className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground uppercase">
              Thresholds
            </span>
          </div>
          <div className="space-y-2">
            {config.thresholds && Object.keys(config.thresholds).length > 0 ? (
              Object.entries(config.thresholds).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="font-mono text-muted-foreground">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                  <span className="font-mono font-bold">{value}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">No thresholds configured</p>
            )}
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground uppercase">
              Triggers
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {config.triggers && config.triggers.length > 0 ? (
              config.triggers.map((trigger) => (
                <Badge
                  key={trigger}
                  variant="outline"
                  className="font-mono text-xs"
                >
                  {trigger}
                </Badge>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">No triggers configured</p>
            )}
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Send className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground uppercase">
              Output Targets
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {config.outputTargets && config.outputTargets.length > 0 ? (
              config.outputTargets.map((target) => (
                <Badge
                  key={target}
                  variant="secondary"
                  className="font-mono text-xs"
                >
                  {target}
                </Badge>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">No output targets configured</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
