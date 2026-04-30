"use client";

/**
 * IncidentDashboard - SolarWinds-inspired Incident Response UI
 *
 * Features:
 * - Summary bar: Active incidents, P1/P2 critical count, avg MTTA, avg MTTR
 * - Severity + status filters
 * - Incident cards with priority badges, lifecycle actions
 * - Create incident dialog with runbook templates
 * - Per-incident runbook step view
 * - Auto-refresh every 30s
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  formatDuration,
  getMTTA,
  getMTTR,
  timeAgo,
  useCreateIncident,
  useIncidents,
  useUpdateIncident,
  type Incident,
} from "@/hooks/useIncidents";
import type { IncidentSeverity, IncidentSource } from "@/lib/database.types";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Bot,
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDot,
  Clock,
  FileText,
  Info,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Timer,
  User,
  XCircle,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// ─── Priority Config (SolarWinds P1/P2/P3/P4) ────────────────────────────────
const PRIORITY = {
  P1: {
    label: "P1 CRITICAL",
    color: "bg-red-500/15 text-red-400 border-red-500/30",
    dot: "bg-red-500",
    border: "border-l-red-500",
    ring: "ring-red-500/20",
    pulse: true,
  },
  P2: {
    label: "P2 HIGH",
    color: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    dot: "bg-orange-500",
    border: "border-l-orange-500",
    ring: "ring-orange-500/20",
    pulse: false,
  },
  P3: {
    label: "P3 MEDIUM",
    color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    dot: "bg-yellow-500",
    border: "border-l-yellow-500",
    ring: "ring-yellow-500/20",
    pulse: false,
  },
  P4: {
    label: "P4 LOW",
    color: "bg-muted/50 text-muted-foreground border-border",
    dot: "bg-muted-foreground",
    border: "border-l-muted-foreground/40",
    ring: "ring-muted/20",
    pulse: false,
  },
};

const STATUS = {
  open: {
    label: "OPEN",
    color: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    icon: CircleDot,
  },
  investigating: {
    label: "INVESTIGATING",
    color: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    icon: Search,
  },
  resolved: {
    label: "RESOLVED",
    color: "bg-green-500/15 text-green-400 border-green-500/30",
    icon: CheckCircle2,
  },
  closed: {
    label: "CLOSED",
    color: "bg-muted/50 text-muted-foreground border-border",
    icon: XCircle,
  },
};

const SOURCE_ICON: Record<IncidentSource, React.ElementType> = {
  agent: Bot,
  ml: Brain,
  manual: User,
  alert: AlertCircle,
};

// ─── Runbook Templates ────────────────────────────────────────────────────────
const RUNBOOK_TEMPLATES: Record<string, { title: string; runbook: string }> = {
  "churn-critical": {
    title: "Critical Churn Risk",
    runbook:
      "1. Schedule executive call within 24h\n2. Prepare custom retention offer (up to 30% discount)\n3. Review contract renewal options\n4. Loop in customer success director\n5. Document all touchpoints in CRM",
  },
  "churn-high": {
    title: "High Churn Risk",
    runbook:
      "1. Send personalized re-engagement email within 4h\n2. Offer 1-month extension or credit\n3. Schedule product demo call\n4. Identify usage drop-off reason",
  },
  "revenue-anomaly": {
    title: "Revenue Anomaly",
    runbook:
      "1. Review flagged transactions in billing system\n2. Cross-reference with CRM records\n3. Contact affected accounts for verification\n4. Engage fraud detection if confirmed",
  },
  "system-degradation": {
    title: "System Degradation",
    runbook:
      "1. Check service health endpoints\n2. Review error logs and queue depth\n3. Scale up if needed\n4. Monitor for 1h post-fix\n5. Write post-mortem",
  },
  custom: { title: "", runbook: "" },
};

// ─── Incident Card ────────────────────────────────────────────────────────────
function IncidentCard({
  incident,
  onUpdate,
}: {
  incident: Incident;
  onUpdate: (id: string, updates: Partial<Incident>) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const priority = PRIORITY[incident.severity];
  const status = STATUS[incident.status];
  const StatusIcon = status.icon;
  const SourceIcon = SOURCE_ICON[incident.source];
  const mtta = getMTTA(incident);
  const mttr = getMTTR(incident);
  const isActive =
    incident.status === "open" || incident.status === "investigating";

  return (
    <div
      className={`border-2 border-border border-l-4 ${priority.border} bg-card rounded-none transition-all ${priority.ring && isActive ? `ring-1 ${priority.ring}` : ""}`}
    >
      {/* Main row */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Priority dot */}
          <div className="shrink-0 pt-0.5">
            <div
              className={`w-2.5 h-2.5 rounded-full ${priority.dot} ${priority.pulse && isActive ? "animate-pulse" : ""}`}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className={`text-[10px] font-mono font-bold ${priority.color}`}
                >
                  {priority.label}
                </Badge>
                <Badge
                  variant="outline"
                  className={`text-[10px] font-mono ${status.color}`}
                >
                  <StatusIcon className="w-2.5 h-2.5 mr-1" />
                  {status.label}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[10px] font-mono text-muted-foreground border-border"
                >
                  <SourceIcon className="w-2.5 h-2.5 mr-1" />
                  {incident.source.toUpperCase()}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground font-mono shrink-0">
                {timeAgo(incident.created_at)}
              </span>
            </div>

            <h3 className="text-sm font-bold mb-1 leading-snug">
              {incident.title}
            </h3>

            {incident.description && (
              <div className="mb-2">
                <p className={`text-xs text-muted-foreground ${expanded ? "whitespace-pre-line" : "line-clamp-2"}`}>
                  {incident.description}
                </p>
              </div>
            )}

            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
              {incident.customer_id && (
                <span className="font-mono">
                  Customer: {incident.customer_id}
                </span>
              )}
              {incident.assigned_to ? (
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {incident.assigned_to}
                </span>
              ) : (
                <span className="text-orange-400">⚠ Unassigned</span>
              )}
              {mtta !== null && (
                <span className="flex items-center gap-1">
                  <Timer className="w-3 h-3" />
                  MTTA: {formatDuration(mtta)}
                </span>
              )}
              {mttr !== null && (
                <span className="flex items-center gap-1 text-green-400">
                  <CheckCircle2 className="w-3 h-3" />
                  MTTR: {formatDuration(mttr)}
                </span>
              )}
            </div>

            {/* Tags */}
            {incident.tags.length > 0 && (
              <div className="flex gap-1 mt-2 flex-wrap">
                {incident.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-mono bg-muted/40 border border-border px-1.5 py-0.5 rounded-sm text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-3 ml-5 flex-wrap">
          {incident.status === "open" && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[11px] font-mono uppercase border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
              onClick={() => onUpdate(incident.id, { status: "investigating" })}
            >
              <Search className="w-3 h-3 mr-1" />
              Investigate
            </Button>
          )}
          {(incident.status === "open" ||
            incident.status === "investigating") && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[11px] font-mono uppercase border-green-500/30 text-green-400 hover:bg-green-500/10"
              onClick={() => onUpdate(incident.id, { status: "resolved" })}
            >
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Resolve
            </Button>
          )}
          {incident.status === "resolved" && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[11px] font-mono uppercase"
              onClick={() => onUpdate(incident.id, { status: "closed" })}
            >
              <XCircle className="w-3 h-3 mr-1" />
              Close
            </Button>
          )}
          {incident.runbook && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-[11px] font-mono uppercase text-muted-foreground"
              onClick={() => setExpanded(!expanded)}
            >
              <FileText className="w-3 h-3 mr-1" />
              Runbook & Details
              {expanded ? (
                <ChevronUp className="w-3 h-3 ml-1" />
              ) : (
                <ChevronDown className="w-3 h-3 ml-1" />
              )}
            </Button>
          )}
          {!incident.runbook && incident.description && incident.description.length > 120 && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-[11px] font-mono uppercase text-muted-foreground"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? "Show Less" : "Show More"}
              {expanded ? (
                <ChevronUp className="w-3 h-3 ml-1" />
              ) : (
                <ChevronDown className="w-3 h-3 ml-1" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Runbook expansion */}
      {expanded && incident.runbook && (
        <div className="border-t-2 border-border bg-muted/20 px-4 py-3 ml-5">
          <p className="text-[10px] font-mono uppercase text-muted-foreground mb-2 flex items-center gap-1">
            <FileText className="w-3 h-3" />
            Response Runbook
          </p>
          <div className="space-y-1.5">
            {incident.runbook.split("\n").map((step, i) => {
              const trimmed = step.trim();
              if (!trimmed) return null;
              // Highlight SUCCESS CRITERIA header
              if (trimmed.startsWith("SUCCESS CRITERIA")) {
                return (
                  <div key={i} className="mt-3 pt-2 border-t border-border">
                    <p className="text-[10px] font-mono uppercase text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {trimmed}
                    </p>
                  </div>
                );
              }
              // Highlight time constraints like [Within 2h]
              const timeMatch = trimmed.match(/\[([^\]]+)\]/);
              return (
                <div
                  key={i}
                  className="flex items-start gap-2 text-xs text-foreground"
                >
                  {trimmed.match(/^\d+\./) ? (
                    <span className="text-muted-foreground font-mono shrink-0 w-5">
                      {trimmed.match(/^(\d+)\./)?.[1]}.
                    </span>
                  ) : trimmed.startsWith("-") ? (
                    <span className="text-muted-foreground shrink-0 w-5">•</span>
                  ) : (
                    <span className="shrink-0 w-5" />
                  )}
                  <span>
                    {timeMatch ? (
                      <>
                        <span className="inline-flex items-center gap-0.5 px-1 py-0 rounded bg-amber-500/15 text-amber-400 text-[10px] font-mono mr-1">
                          <Clock className="w-2.5 h-2.5" />
                          {timeMatch[1]}
                        </span>
                        {trimmed.replace(/^\d+\.\s*/, "").replace(/\[[^\]]+\]\s*/, "")}
                      </>
                    ) : (
                      trimmed.replace(/^\d+\.\s*/, "").replace(/^-\s*/, "")
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Create Incident Dialog ───────────────────────────────────────────────────
function CreateIncidentDialog() {
  const [open, setOpen] = useState(false);
  const [template, setTemplate] = useState("custom");
  const [form, setForm] = useState({
    title: "",
    description: "",
    severity: "P3" as IncidentSeverity,
    source: "manual" as IncidentSource,
    customer_id: "",
    assigned_to: "",
    runbook: "",
  });

  const create = useCreateIncident();

  const applyTemplate = (key: string) => {
    setTemplate(key);
    const t = RUNBOOK_TEMPLATES[key];
    if (!t) return;
    setForm((f) => ({
      ...f,
      title: t.title || f.title,
      runbook: t.runbook,
    }));
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    await create.mutateAsync({
      title: form.title,
      description: form.description || undefined,
      severity: form.severity,
      source: form.source,
      customer_id: form.customer_id || undefined,
      assigned_to: form.assigned_to || undefined,
      runbook: form.runbook || undefined,
    });
    setOpen(false);
    setForm({
      title: "",
      description: "",
      severity: "P3",
      source: "manual",
      customer_id: "",
      assigned_to: "",
      runbook: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="font-mono uppercase text-xs">
          <Plus className="w-4 h-4 mr-2" />
          New Incident
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-mono uppercase tracking-wide text-sm flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Create Incident
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Template picker */}
          <div className="space-y-1">
            <Label className="text-xs font-mono uppercase text-muted-foreground">
              Runbook Template
            </Label>
            <Select value={template} onValueChange={applyTemplate}>
              <SelectTrigger className="h-8 text-xs font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom" className="text-xs font-mono">
                  Custom (blank)
                </SelectItem>
                <SelectItem
                  value="churn-critical"
                  className="text-xs font-mono"
                >
                  Critical Churn Risk
                </SelectItem>
                <SelectItem value="churn-high" className="text-xs font-mono">
                  High Churn Risk
                </SelectItem>
                <SelectItem
                  value="revenue-anomaly"
                  className="text-xs font-mono"
                >
                  Revenue Anomaly
                </SelectItem>
                <SelectItem
                  value="system-degradation"
                  className="text-xs font-mono"
                >
                  System Degradation
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-mono uppercase text-muted-foreground">
                Priority
              </Label>
              <Select
                value={form.severity}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, severity: v as IncidentSeverity }))
                }
              >
                <SelectTrigger className="h-8 text-xs font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    value="P1"
                    className="text-xs font-mono text-red-400"
                  >
                    P1 — Critical
                  </SelectItem>
                  <SelectItem
                    value="P2"
                    className="text-xs font-mono text-orange-400"
                  >
                    P2 — High
                  </SelectItem>
                  <SelectItem
                    value="P3"
                    className="text-xs font-mono text-yellow-400"
                  >
                    P3 — Medium
                  </SelectItem>
                  <SelectItem value="P4" className="text-xs font-mono">
                    P4 — Low
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-mono uppercase text-muted-foreground">
                Source
              </Label>
              <Select
                value={form.source}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, source: v as IncidentSource }))
                }
              >
                <SelectTrigger className="h-8 text-xs font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual" className="text-xs font-mono">
                    Manual
                  </SelectItem>
                  <SelectItem value="agent" className="text-xs font-mono">
                    Agent
                  </SelectItem>
                  <SelectItem value="ml" className="text-xs font-mono">
                    ML Model
                  </SelectItem>
                  <SelectItem value="alert" className="text-xs font-mono">
                    Alert
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-mono uppercase text-muted-foreground">
              Title *
            </Label>
            <Input
              className="h-8 text-xs font-mono"
              placeholder="Brief incident description..."
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-mono uppercase text-muted-foreground">
              Description
            </Label>
            <Textarea
              className="text-xs font-mono resize-none"
              rows={2}
              placeholder="Detailed context..."
              value={form.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-mono uppercase text-muted-foreground">
                Customer ID
              </Label>
              <Input
                className="h-8 text-xs font-mono"
                placeholder="cust_xxx"
                value={form.customer_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, customer_id: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-mono uppercase text-muted-foreground">
                Assign To
              </Label>
              <Input
                className="h-8 text-xs font-mono"
                placeholder="email@company.com"
                value={form.assigned_to}
                onChange={(e) =>
                  setForm((f) => ({ ...f, assigned_to: e.target.value }))
                }
              />
            </div>
          </div>

          {form.runbook && (
            <div className="space-y-1">
              <Label className="text-xs font-mono uppercase text-muted-foreground">
                Runbook
              </Label>
              <Textarea
                className="text-xs font-mono resize-none"
                rows={4}
                value={form.runbook}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setForm((f) => ({ ...f, runbook: e.target.value }))
                }
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="font-mono uppercase text-xs"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="font-mono uppercase text-xs"
              onClick={handleSubmit}
              disabled={create.isPending}
            >
              {create.isPending ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <Plus className="w-3 h-3 mr-1" />
              )}
              Create
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export function IncidentDashboard() {
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const {
    data: incidents = [],
    isLoading,
    refetch,
    isFetching,
  } = useIncidents({
    severity: severityFilter !== "all" ? severityFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const update = useUpdateIncident();

  const handleUpdate = (id: string, updates: Partial<Incident>) => {
    update.mutate({ id, ...updates });
  };

  // Client-side text search
  const filtered = incidents.filter((i) =>
    search
      ? i.title.toLowerCase().includes(search.toLowerCase()) ||
        (i.description ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (i.customer_id ?? "").toLowerCase().includes(search.toLowerCase())
      : true,
  );

  // Sort: P1 → P2 → P3 → P4, then newest first
  const sorted = [...filtered].sort((a, b) => {
    const order = { P1: 0, P2: 1, P3: 2, P4: 3 };
    const diff = order[a.severity] - order[b.severity];
    if (diff !== 0) return diff;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // ── Summary metrics ──────────────────────────────────────────────────────
  const active = incidents.filter(
    (i) => i.status === "open" || i.status === "investigating",
  );
  const p1Count = incidents.filter(
    (i) => i.severity === "P1" && i.status !== "closed",
  ).length;
  const p2Count = incidents.filter(
    (i) => i.severity === "P2" && i.status !== "closed",
  ).length;

  const resolvedWithMTTA = incidents.filter((i) => i.acknowledged_at);
  const avgMTTA =
    resolvedWithMTTA.length > 0
      ? Math.round(
          resolvedWithMTTA.reduce((s, i) => s + (getMTTA(i) ?? 0), 0) /
            resolvedWithMTTA.length,
        )
      : null;

  const resolvedWithMTTR = incidents.filter((i) => i.resolved_at);
  const avgMTTR =
    resolvedWithMTTR.length > 0
      ? Math.round(
          resolvedWithMTTR.reduce((s, i) => s + (getMTTR(i) ?? 0), 0) /
            resolvedWithMTTR.length,
        )
      : null;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold uppercase tracking-wide">
              Incident Response
            </h2>
            <Badge
              variant="outline"
              className="text-[10px] font-mono border-primary/30 text-primary"
            >
              SolarWinds-style
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground font-mono">
            AI-powered incident detection, routing, and resolution tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="font-mono uppercase text-xs"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={`w-3 h-3 mr-1 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <CreateIncidentDialog />
        </div>
      </div>

      {/* ── Summary Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border-2 border-border bg-card p-4 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Activity className="w-4 h-4" />
            <span className="text-xs font-mono uppercase">
              Active Incidents
            </span>
          </div>
          <p className="text-3xl font-bold font-mono">{active.length}</p>
          <p className="text-xs text-muted-foreground">
            {incidents.filter((i) => i.status === "open").length} open ·{" "}
            {incidents.filter((i) => i.status === "investigating").length}{" "}
            investigating
          </p>
        </div>

        <div
          className={`border-2 p-4 space-y-1 ${p1Count > 0 ? "border-red-500/50 bg-red-500/5" : "border-border bg-card"}`}
        >
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertTriangle
              className={`w-4 h-4 ${p1Count > 0 ? "text-red-400" : ""}`}
            />
            <span className="text-xs font-mono uppercase">P1/P2 Critical</span>
          </div>
          <p
            className={`text-3xl font-bold font-mono ${p1Count > 0 ? "text-red-400" : ""}`}
          >
            {p1Count + p2Count}
          </p>
          <p className="text-xs text-muted-foreground">
            {p1Count} critical · {p2Count} high
          </p>
        </div>

        <div className="border-2 border-border bg-card p-4 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-mono uppercase">Avg MTTA</span>
          </div>
          <p className="text-3xl font-bold font-mono">
            {avgMTTA !== null ? formatDuration(avgMTTA) : "—"}
          </p>
          <p className="text-xs text-muted-foreground">
            Mean time to acknowledge
          </p>
        </div>

        <div className="border-2 border-border bg-card p-4 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Zap className="w-4 h-4" />
            <span className="text-xs font-mono uppercase">Avg MTTR</span>
          </div>
          <p className="text-3xl font-bold font-mono">
            {avgMTTR !== null ? formatDuration(avgMTTR) : "—"}
          </p>
          <p className="text-xs text-muted-foreground">Mean time to resolve</p>
        </div>
      </div>

      {/* ── Source breakdown ───────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-2">
        {(["agent", "ml", "manual", "alert"] as IncidentSource[]).map((src) => {
          const count = incidents.filter((i) => i.source === src).length;
          const Icon = SOURCE_ICON[src];
          return (
            <div
              key={src}
              className="border border-border bg-muted/20 px-3 py-2 flex items-center gap-2"
            >
              <Icon className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-mono text-muted-foreground uppercase">
                {src}
              </span>
              <span className="ml-auto text-xs font-bold font-mono">
                {count}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Filters ────────────────────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            className="h-8 pl-8 text-xs font-mono"
            placeholder="Search incidents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="h-8 w-36 text-xs font-mono">
            <SelectValue placeholder="All severities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs font-mono">
              All Priorities
            </SelectItem>
            <SelectItem value="P1" className="text-xs font-mono text-red-400">
              P1 — Critical
            </SelectItem>
            <SelectItem
              value="P2"
              className="text-xs font-mono text-orange-400"
            >
              P2 — High
            </SelectItem>
            <SelectItem
              value="P3"
              className="text-xs font-mono text-yellow-400"
            >
              P3 — Medium
            </SelectItem>
            <SelectItem value="P4" className="text-xs font-mono">
              P4 — Low
            </SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-40 text-xs font-mono">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs font-mono">
              All Statuses
            </SelectItem>
            <SelectItem value="open" className="text-xs font-mono">
              Open
            </SelectItem>
            <SelectItem value="investigating" className="text-xs font-mono">
              Investigating
            </SelectItem>
            <SelectItem value="resolved" className="text-xs font-mono">
              Resolved
            </SelectItem>
            <SelectItem value="closed" className="text-xs font-mono">
              Closed
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── Incident List ──────────────────────────────────────────────── */}
      {sorted.length === 0 ? (
        <div className="border-2 border-border bg-card p-12 text-center">
          <Shield className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="text-sm font-mono text-muted-foreground">
            {search || severityFilter !== "all" || statusFilter !== "all"
              ? "No incidents match the current filters"
              : "No incidents found — all systems operational"}
          </p>
          {!search && (
            <p className="text-xs text-muted-foreground mt-1">
              Run the migration SQL to populate demo incidents
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-mono">
              Showing {sorted.length} incident{sorted.length !== 1 ? "s" : ""}
              {search ? ` matching "${search}"` : ""}
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              Sorted by priority · newest first
            </span>
          </div>
          {sorted.map((incident) => (
            <IncidentCard
              key={incident.id}
              incident={incident}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      )}

      {/* ── SolarWinds Attribution Footer ─────────────────────────────── */}
      <div className="border border-border bg-muted/10 px-4 py-3 flex items-center gap-3">
        <Info className="w-4 h-4 text-muted-foreground shrink-0" />
        <p className="text-xs text-muted-foreground">
          Incident response lifecycle inspired by{" "}
          <span className="font-bold text-foreground">
            SolarWinds Incident Response
          </span>{" "}
          — featuring P1/P2/P3/P4 priority classification, MTTA/MTTR tracking,
          runbooks, and on-call routing. Auto-creates incidents from AI agent
          detections.
        </p>
      </div>
    </div>
  );
}
