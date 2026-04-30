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
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";

interface CreateAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateAgent: (agent: {
    name: string;
    role: string;
    description: string;
    status: string;
  }) => Promise<void>;
}

export function CreateAgentDialog({
  open,
  onOpenChange,
  onCreateAgent,
}: CreateAgentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    role: string;
    description: string;
    status: "active" | "idle";
  }>({
    name: "",
    role: "",
    description: "",
    status: "idle",
  });

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

    setIsSubmitting(true);

    try {
      await onCreateAgent(formData);
      setFormData({ name: "", role: "", description: "", status: "idle" });
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
            Create New Agent
          </DialogTitle>
          <DialogDescription className="font-mono text-xs">
            Configure a new decision agent for your pipeline
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs uppercase">
              Agent Name
            </Label>
            <Input
              id="name"
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
            <Label htmlFor="role" className="text-xs uppercase">
              Role / Purpose
            </Label>
            <Input
              id="role"
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
            <Label htmlFor="description" className="text-xs uppercase">
              Description
            </Label>
            <textarea
              id="description"
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
            <Label htmlFor="status" className="text-xs uppercase">
              Initial Status
            </Label>
            <Select
              value={formData.status}
              onValueChange={(value: "idle" | "active") =>
                setFormData((prev) => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger className="font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="idle">Idle</SelectItem>
                <SelectItem value="active">Active</SelectItem>
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
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Agent
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
