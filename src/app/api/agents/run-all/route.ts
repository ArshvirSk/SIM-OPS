import { AgentExecutor } from "@/lib/agents/executor";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // 1 minute timeout

/**
 * Simple pipeline endpoint that runs all 6 agents in sequence
 * Uses the AgentExecutor directly for consistent behavior
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agents } = body;

    if (!agents || !Array.isArray(agents)) {
      return NextResponse.json(
        { error: "Missing or invalid agents array" },
        { status: 400 },
      );
    }

    console.log(`🤖 Running pipeline with ${agents.length} agents...`);

    const supabase = await createClient();
    const results = [];

    // Run each agent in sequence
    for (const agent of agents) {
      try {
        console.log(`  → Running ${agent.name}...`);

        // Get agent config
        const { data: configData } = await supabase
          .from("agent_configs")
          .select("*")
          .eq("agent_id", agent.id)
          .single();

        const executionContext = {
          agentId: agent.id,
          agentName: agent.name,
          agentRole: agent.role,
          config: {
            enabled: configData?.enabled ?? true,
            thresholds: (configData?.thresholds as Record<string, number>) ?? {},
            triggers: configData?.triggers ?? [],
            outputTargets: configData?.output_targets ?? [],
          },
        };

        // Execute agent
        const result = await AgentExecutor.execute(executionContext);

        // Store result
        await AgentExecutor.storeResult(executionContext, result);

        results.push({
          agent: agent.name,
          success: result.success,
          result: {
            decision: result.decision,
            severity: result.severity,
            confidence: result.confidence,
          },
        });

        console.log(`  ✓ ${agent.name} completed`);
      } catch (error) {
        console.error(`  ✗ ${agent.name} failed:`, error);
        results.push({
          agent: agent.name,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    console.log(`✓ Pipeline completed: ${successCount}/${agents.length} agents succeeded`);

    return NextResponse.json({
      success: true,
      message: `Pipeline completed: ${successCount}/${agents.length} agents succeeded`,
      results,
    });
  } catch (error) {
    console.error("Pipeline execution error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
