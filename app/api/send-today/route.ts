import { NextResponse } from "next/server";
import { hasValidAdminSecret } from "@/lib/auth";
import { buildTodayEmail, sendTrainingEmail } from "@/lib/email";
import { readWeeklyPlan } from "@/lib/plan-store";
import { WeekdayKey } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const plan = await readWeeklyPlan();
    const body = (await request.json().catch(() => ({}))) as {
      dryRun?: boolean;
      dayKey?: WeekdayKey;
    };

    if (body.dryRun) {
      const email = buildTodayEmail({ plan, dayKey: body.dayKey });
      return NextResponse.json({ ok: true, dryRun: true, email });
    }

    if (!hasValidAdminSecret(request)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const email = await sendTrainingEmail({ plan, dayKey: body.dayKey });
    return NextResponse.json({ ok: true, dryRun: false, email });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Kunde inte skicka mail." },
      { status: 500 }
    );
  }
}
