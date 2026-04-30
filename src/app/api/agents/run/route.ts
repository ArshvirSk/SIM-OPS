import { AgentExecutor } from "@/lib/agents/executor";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agentId, agentName, agentRole } = body;

    if (!agentId || !agentName || !agentRole) {
      return NextResponse.json(
        { error: "Missing required fields (agentId, agentName, agentRole)" },
        { status: 400 },
      );
    }

    console.log(
      `🤖 Running agent execution via API: ${agentName} (${agentRole})`,
    );

    const supabase = await createClient();

    // Get agent config
    const { data: configData } = await supabase
      .from("agent_configs")
      .select("*")
      .eq("agent_id", agentId)
      .single();

    const executionContext = {
      agentId,
      agentName,
      agentRole,
      config: {
        enabled: configData?.enabled ?? true,
        thresholds: (configData?.thresholds as Record<string, number>) ?? {},
        triggers: configData?.triggers ?? [],
        outputTargets: configData?.output_targets ?? [],
      },
    };

    // Execute agent with real logic
    const result = await AgentExecutor.execute(executionContext);

    // Store result in database
    await AgentExecutor.storeResult(executionContext, result);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Agent execution run error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
