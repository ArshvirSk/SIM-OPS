/**
 * Incidents API Route - SolarWinds-style Incident Response
 * GET  /api/incidents        - List incidents with optional filters
 * POST /api/incidents        - Create a new incident
 * PATCH /api/incidents       - Update incident status / assignment
 */

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/incidents
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const severity = searchParams.get("severity");
        const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 200);

        let query = supabase
            .from("incidents")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(limit);

        if (status && status !== "all") query = query.eq("status", status);
        if (severity && severity !== "all") query = query.eq("severity", severity);

        const { data, error } = await query;
        if (error) throw error;

        return NextResponse.json({ incidents: data ?? [] });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// POST /api/incidents
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await request.json();

        const { data, error } = await supabase
            .from("incidents")
            .insert({
                title: body.title,
                description: body.description ?? null,
                severity: body.severity ?? "P3",
                status: "open",
                source: body.source ?? "manual",
                source_id: body.source_id ?? null,
                customer_id: body.customer_id ?? null,
                assigned_to: body.assigned_to ?? null,
                runbook: body.runbook ?? null,
                tags: body.tags ?? [],
            })
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json({ incident: data }, { status: 201 });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// PATCH /api/incidents
export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: "id is required" }, { status: 400 });
        }

        // Auto-set timestamps on status transitions
        if (updates.status === "investigating" && !updates.acknowledged_at) {
            updates.acknowledged_at = new Date().toISOString();
        }
        if (
            (updates.status === "resolved" || updates.status === "closed") &&
            !updates.resolved_at
        ) {
            updates.resolved_at = new Date().toISOString();
        }

        updates.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from("incidents")
            .update(updates)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json({ incident: data });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
