"use client";

import { getErrorMessage } from "@/types/errors";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import type { Agent } from "@/data/agentsData";
import { Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";

interface EditAgentDialogProps {
  open: boolean;
  agent: Agent | null;
  onOpenChange: (open: boolean) => void;
  onEditAgent: (
    id: string,
    updates: {
      name: string;
      role: string;
      description: string;
      status: "active" | "idle" | "processing" | "error";
    },
  ) => Promise<void>;
}

export function EditAgentDialog({
  open,
  agent,
  onOpenChange,
  onEditAgent,
}: EditAgentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    role: string;
    description: string;
    status: "active" | "idle" | "processing" | "error";
  }>({
    name: "",
    role: "",
    description: "",
    status: "idle",
  });

  // Keep form data synced when the dialog opens or agent changes
  useEffect(() => {
    if (agent && open) {
      setFormData({
        name: agent.name,
        role: agent.role,
        description: agent.description || "",
        status: agent.status,
      });
      setError(null);
    }
  }, [agent, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (formData.name.length < 3) {
      setError("Agent name must be at least 3 characters");
      return;
    }
    if (formData.role.length < 5) {
      setError("Role description must be at least 5 characters");
      return;
    }
    if (formData.description.length < 10) {
      setError("Description must be at least 10 characters");
      return;
    }

    if (!agent?.id) return;

    setIsSubmitting(true);

    try {
      await onEditAgent(agent.id, formData);
      setError(null);
      onOpenChange(false);
    } catch (error: unknown) {
      setError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid =
    formData.name.length >= 3 &&
    formData.role.length >= 5 &&
    formData.description.length >= 10;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-bold uppercase tracking-wide">
            Edit Agent
          </DialogTitle>
          <DialogDescription className="font-mono text-xs">
            Modify the details and status of this agent.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name" className="text-xs uppercase">
              Agent Name
            </Label>
            <Input
              id="edit-name"
              placeholder="e.g., Monitoring Agent"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              className="font-mono"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-role" className="text-xs uppercase">
              Role / Purpose
            </Label>
            <Input
              id="edit-role"
              placeholder="e.g., KPI deviation detection & threshold monitoring"
              value={formData.role}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, role: e.target.value }))
              }
              className="font-mono"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description" className="text-xs uppercase">
              Description
            </Label>
            <textarea
              id="edit-description"
              placeholder="Detailed description of agent capabilities..."
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className="w-full min-h-[100px] px-3 py-2 text-sm border-2 border-border bg-background font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-status" className="text-xs uppercase">
              Status
            </Label>
            <Select
              value={formData.status}
              onValueChange={(
                value: "active" | "idle" | "processing" | "error",
              ) => setFormData((prev) => ({ ...prev, status: value }))}
            >
              <SelectTrigger className="font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="idle">Idle</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="bg-destructive/10 border-2 border-destructive text-destructive px-3 py-2 text-sm font-mono">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="flex-1 font-mono uppercase text-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setError(null);
              }}
              disabled={isSubmitting}
              className="font-mono uppercase text-xs"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
