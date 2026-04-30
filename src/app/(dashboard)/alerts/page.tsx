"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  Filter,
  X,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AlertsPage() {
  const [statusFilter, setStatusFilter] = useState("active");
  const [severityFilter, setSeverityFilter] = useState("all");
  const queryClient = useQueryClient();

  const { data: alerts, isLoading } = useQuery({
    queryKey: ["risk-alerts", statusFilter, severityFilter],
    queryFn: async () => {
      const supabase = createClient();
      
      let query = supabase
        .from("risk_alerts")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (severityFilter !== "all") {
        query = query.eq("severity", severityFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const acknowledgeMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("risk_alerts")
        .update({
          status: "acknowledged",
          acknowledged_at: new Date().toISOString(),
        })
        .eq("id", alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["risk-alerts"] });
      toast.success("Alert acknowledged");
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("risk_alerts")
        .update({
          status: "resolved",
          resolved_at: new Date().toISOString(),
        })
        .eq("id", alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["risk-alerts"] });
      toast.success("Alert resolved");
    },
  });

  const dismissMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("risk_alerts")
        .update({ status: "dismissed" })
        .eq("id", alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["risk-alerts"] });
      toast.success("Alert dismissed");
    },
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/10 border-red-500 text-red-600";
      case "high":
        return "bg-orange-500/10 border-orange-500 text-orange-600";
      case "medium":
        return "bg-yellow-500/10 border-yellow-500 text-yellow-600";
      case "low":
        return "bg-blue-500/10 border-blue-500 text-blue-600";
      default:
        return "bg-gray-500/10 border-gray-500 text-gray-600";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
      case "high":
        return <AlertTriangle className="w-5 h-5" />;
      case "medium":
        return <Clock className="w-5 h-5" />;
      case "low":
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="text-xs font-mono px-2 py-1 border-2 bg-red-500/10 border-red-500 text-red-600">
            ACTIVE
          </span>
        );
      case "acknowledged":
        return (
          <span className="text-xs font-mono px-2 py-1 border-2 bg-yellow-500/10 border-yellow-500 text-yellow-600">
            ACKNOWLEDGED
          </span>
        );
      case "resolved":
        return (
          <span className="text-xs font-mono px-2 py-1 border-2 bg-green-500/10 border-green-500 text-green-600">
            RESOLVED
          </span>
        );
      case "dismissed":
        return (
          <span className="text-xs font-mono px-2 py-1 border-2 bg-gray-500/10 border-gray-500 text-gray-600">
            DISMISSED
          </span>
        );
      default:
        return null;
    }
  };

  const activeAlerts = alerts?.filter((a) => a.status === "active") || [];
  const acknowledgedAlerts =
    alerts?.filter((a) => a.status === "acknowledged") || [];
  const resolvedAlerts = alerts?.filter((a) => a.status === "resolved") || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-wide mb-2">
            Risk Alerts
          </h1>
          <p className="text-sm text-muted-foreground font-mono">
            Monitor and manage system alerts
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-40 border-2 font-mono text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severity</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 border-2 font-mono text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="acknowledged">Acknowledged</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="dismissed">Dismissed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border-2 border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase text-muted-foreground">
              Active Alerts
            </span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-3xl font-bold font-mono">{activeAlerts.length}</div>
          <div className="text-xs text-muted-foreground mt-1">
            Require attention
          </div>
        </div>

        <div className="border-2 border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase text-muted-foreground">
              Acknowledged
            </span>
            <Clock className="w-4 h-4 text-yellow-500" />
          </div>
          <div className="text-3xl font-bold font-mono">
            {acknowledgedAlerts.length}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Being addressed
          </div>
        </div>

        <div className="border-2 border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase text-muted-foreground">
              Resolved Today
            </span>
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-3xl font-bold font-mono">
            {resolvedAlerts.length}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Successfully handled
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="border-2 border-border bg-card">
          <TabsTrigger value="active" className="font-mono uppercase text-xs">
            Active ({activeAlerts.length})
          </TabsTrigger>
          <TabsTrigger
            value="acknowledged"
            className="font-mono uppercase text-xs"
          >
            Acknowledged ({acknowledgedAlerts.length})
          </TabsTrigger>
          <TabsTrigger value="resolved" className="font-mono uppercase text-xs">
            Resolved ({resolvedAlerts.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="font-mono uppercase text-xs">
            All ({alerts?.length || 0})
          </TabsTrigger>
        </TabsList>

        {["active", "acknowledged", "resolved", "all"].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4">
            <div className="border-2 border-border bg-card divide-y-2 divide-border">
              {(tab === "all"
                ? alerts
                : alerts?.filter((a) => a.status === tab)
              )?.map((alert) => (
                <div
                  key={alert.id}
                  className="p-4 hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div
                        className={`w-10 h-10 border-2 flex items-center justify-center ${getSeverityColor(alert.severity)}`}
                      >
                        {getSeverityIcon(alert.severity)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-sm">{alert.title}</h3>
                          {getStatusBadge(alert.status)}
                          <span
                            className={`text-xs font-mono px-2 py-0.5 border-2 ${getSeverityColor(alert.severity)}`}
                          >
                            {alert.severity.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {alert.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Source: {alert.source}</span>
                          <span>
                            Created: {new Date(alert.created_at).toLocaleString()}
                          </span>
                          {alert.acknowledged_at && (
                            <span>
                              Acknowledged:{" "}
                              {new Date(alert.acknowledged_at).toLocaleString()}
                            </span>
                          )}
                          {alert.resolved_at && (
                            <span>
                              Resolved:{" "}
                              {new Date(alert.resolved_at).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {alert.status === "active" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => acknowledgeMutation.mutate(alert.id)}
                            className="text-xs font-mono uppercase"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Acknowledge
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => resolveMutation.mutate(alert.id)}
                            className="text-xs font-mono uppercase"
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Resolve
                          </Button>
                        </>
                      )}
                      {alert.status === "acknowledged" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resolveMutation.mutate(alert.id)}
                          className="text-xs font-mono uppercase"
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Resolve
                        </Button>
                      )}
                      {alert.status !== "dismissed" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => dismissMutation.mutate(alert.id)}
                          className="text-xs font-mono uppercase"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Dismiss
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {(tab === "all" ? alerts : alerts?.filter((a) => a.status === tab))
                ?.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p className="font-mono text-sm">No alerts in this category</p>
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
