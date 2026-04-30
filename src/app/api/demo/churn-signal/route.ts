import { SimulatorEngine } from "@/lib/simulation/engine";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const result = await SimulatorEngine.injectChurnSignal();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Churn injection error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
