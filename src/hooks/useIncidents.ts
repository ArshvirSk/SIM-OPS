/**
 * useIncidents - React Query hooks for SolarWinds-style Incident Response
 */
import type { IncidentSeverity, IncidentSource, IncidentStatus } from "@/lib/database.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface Incident {
    id: string;
    title: string;
    description: string | null;
    severity: IncidentSeverity;
    status: IncidentStatus;
    source: IncidentSource;
    source_id: string | null;
    customer_id: string | null;
    assigned_to: string | null;
    acknowledged_at: string | null;
    resolved_at: string | null;
    runbook: string | null;
    tags: string[];
    created_at: string;
    updated_at: string;
}

export type CreateIncidentPayload = {
    title: string;
    description?: string;
    severity?: IncidentSeverity;
    source?: IncidentSource;
    source_id?: string;
    customer_id?: string;
    assigned_to?: string;
    runbook?: string;
    tags?: string[];
};

export type UpdateIncidentPayload = Partial<Omit<Incident, "id" | "created_at">> & {
    id: string;
};

// ─── Fetch Incidents ───────────────────────────────────────────────────────────
export function useIncidents(filters?: { status?: string; severity?: string }) {
    return useQuery({
        queryKey: ["incidents", filters],
        queryFn: async (): Promise<Incident[]> => {
            const params = new URLSearchParams();
            if (filters?.status && filters.status !== "all") params.set("status", filters.status);
            if (filters?.severity && filters.severity !== "all") params.set("severity", filters.severity);

            const res = await fetch(`/api/incidents?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch incidents");
            const data = await res.json();
            return data.incidents as Incident[];
        },
        refetchInterval: 30_000, // auto-refresh every 30s
        staleTime: 10_000,
    });
}

// ─── Active incident count (for nav badge) ────────────────────────────────────
export function useActiveIncidentCount() {
    return useQuery({
        queryKey: ["incidents-count"],
        queryFn: async (): Promise<number> => {
            const res = await fetch("/api/incidents?status=open&limit=200");
            if (!res.ok) return 0;
            const data = await res.json();
            const open = (data.incidents as Incident[]).filter(
                (i) => i.status === "open" || i.status === "investigating"
            );
            return open.length;
        },
        refetchInterval: 30_000,
        staleTime: 10_000,
    });
}

// ─── Create Incident ──────────────────────────────────────────────────────────
export function useCreateIncident() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (payload: CreateIncidentPayload) => {
            const res = await fetch("/api/incidents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error(await res.text());
            return res.json();
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["incidents"] });
            qc.invalidateQueries({ queryKey: ["incidents-count"] });
            toast.success("Incident created");
        },
        onError: (err: Error) => toast.error(`Failed to create incident: ${err.message}`),
    });
}

// ─── Update Incident ──────────────────────────────────────────────────────────
export function useUpdateIncident() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (payload: UpdateIncidentPayload) => {
            const res = await fetch("/api/incidents", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error(await res.text());
            return res.json();
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["incidents"] });
            qc.invalidateQueries({ queryKey: ["incidents-count"] });
        },
        onError: (err: Error) => toast.error(`Failed to update incident: ${err.message}`),
    });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Compute MTTA in minutes */
export function getMTTA(incident: Incident): number | null {
    if (!incident.acknowledged_at) return null;
    return Math.round(
        (new Date(incident.acknowledged_at).getTime() -
            new Date(incident.created_at).getTime()) /
        60_000
    );
}

/** Compute MTTR in minutes */
export function getMTTR(incident: Incident): number | null {
    if (!incident.resolved_at) return null;
    return Math.round(
        (new Date(incident.resolved_at).getTime() -
            new Date(incident.created_at).getTime()) /
        60_000
    );
}

/** Format minutes into a human-readable duration */
export function formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/** Time elapsed since a timestamp */
export function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}
