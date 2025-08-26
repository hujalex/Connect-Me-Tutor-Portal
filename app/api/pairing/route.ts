import { runPairingWorkflow } from "@/lib/pairing";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  await runPairingWorkflow();
  return NextResponse.json({
    message: "successfully completed pairing process",
  });
}
