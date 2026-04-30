import { agentOrchestrator } from "@/lib/agents/orchestrator";
import { langChainOrchestrator } from "@/lib/ai/orchestrator";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes timeout

// ── Global run lock ───────────────────────────────────────────────────────────
// Prevents multiple concurrent pipeline invocations from stacking up.
// If a run is already in progress, we return 409 immediately so the UI
// doesn't stack requests that make it look like an infinite loop.
let pipelineRunning = false;

export async function POST(req: NextRequest) {
  // ── Concurrency guard ────────────────────────────────────────────────────
  if (pipelineRunning) {
    console.log("⏳ Pipeline already running — rejecting duplicate request.");
    return NextResponse.json(
      {
        success: false,
        message: "Pipeline is already running. Please wait for it to finish.",
        busy: true,
      },
      { status: 409 },
    );
  }

  pipelineRunning = true;

  try {
    console.log(
      "🤖 Starting autonomous prediction run pipeline initiated by UI...",
    );

    const supabase = await createClient();

    // Check if user is authenticated (Optional but recommended for UI calls)
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) {
      console.warn(
        "Unauthenticated attempt to run pipeline from UI, proceeding anyway for demo purposes",
      );
    }

    // Fetch customers — limit to 5 for interactive runs to keep response times under 2min
    const { data: customers, error: fetchError } = await supabase
      .from("customers")
      .select("*")
      .order("last_activity", { ascending: false })
      .limit(5);

    if (fetchError) {
      console.error("Failed to fetch customers:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch customers" },
        { status: 500 },
      );
    }

    if (!customers || customers.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No customers to process",
        count: 0,
      });
    }

    console.log(`📊 Processing pipeline for ${customers.length} customers...`);

    const results = [];

    for (const customer of customers) {
      try {
        const success = await langChainOrchestrator.executeAgentChain(
          customer.id,
        );
        if (success) {
          results.push({
            customer: customer.id,
            success: true,
            agent: "LangChainOrchestrator",
          });
        } else {
          // Fallback to rule-based
          const fallbackSuccess = await agentOrchestrator.executeAgentChain(
            customer.id,
          );
          results.push({
            customer: customer.id,
            success: fallbackSuccess,
            agent: "RuleBasedOrchestrator",
          });
        }
      } catch (error) {
        console.error(`Pipeline failed for ${customer.id}:`, error);
        results.push({
          customer: customer.id,
          success: false,
          error: String(error),
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Pipeline execution completed",
      results,
    });
  } catch (error) {
    console.error("Pipeline run error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  } finally {
    // Ensure all agents are reset to active/idle so UI doesn't stay stuck on "Processing"
    try {
      await langChainOrchestrator.resetAllAgents("active");
    } catch (e) {
      console.error("Failed to reset agents in finally block:", e);
    }
    // Always release the lock
    pipelineRunning = false;
  }
}
