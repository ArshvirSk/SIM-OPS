import { generateHistoricalData } from "@/lib/simulation/sync";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const result = await generateHistoricalData(6);
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (error: any) {
    console.error("[Generate History] Error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
