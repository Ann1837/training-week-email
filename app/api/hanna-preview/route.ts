import { NextResponse } from "next/server";
import { hasValidAdminSecret } from "@/lib/auth";
import { sendHannaWeeklyEmail } from "@/lib/hanna-plan";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    if (!hasValidAdminSecret(request)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const email = await sendHannaWeeklyEmail({ previewTo: "ann@pjano.se" });
    return NextResponse.json({ ok: true, subject: email.subject, to: email.to, cc: email.cc ?? null });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Kunde inte skicka Hanna-preview." },
      { status: 500 }
    );
  }
}
