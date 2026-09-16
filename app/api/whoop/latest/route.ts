import { NextResponse } from "next/server";
import { hasValidAdminSecret } from "@/lib/auth";
import { getLatestWhoopData } from "@/lib/whoop-data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!hasValidAdminSecret(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    return NextResponse.json({ ok: true, data: await getLatestWhoopData(request.url) });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Kunde inte hämta WHOOP-data." },
      { status: 502 }
    );
  }
}
