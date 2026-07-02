import { NextResponse } from "next/server";
import { hasValidAdminSecret } from "@/lib/auth";
import { buildTodayEmail, sendTrainingEmail } from "@/lib/email";
import { readWeeklyPlan, validatePlan } from "@/lib/plan-store";
import { WeekdayKey, WeeklyPlan } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      dryRun?: boolean;
      dayKey?: WeekdayKey;
      plan?: WeeklyPlan;
    };
    const plan = body.plan ?? (await readWeeklyPlan());

    if (body.plan) {
      validatePlan(plan);
    }

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
