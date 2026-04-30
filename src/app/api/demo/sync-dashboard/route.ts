import { syncDashboardPredictions } from "@/lib/simulation/sync";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const result = await syncDashboardPredictions();
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (error: any) {
    console.error("[Sync Dashboard] Error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
