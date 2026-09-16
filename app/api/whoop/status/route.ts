import { NextResponse } from "next/server";
import { hasValidAdminSecret } from "@/lib/auth";
import { isWhoopConnected } from "@/lib/whoop-token-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!hasValidAdminSecret(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const connected = await isWhoopConnected();
  return NextResponse.json({ ok: true, connected, status: connected ? "WHOOP connected" : "WHOOP not connected" });
}
