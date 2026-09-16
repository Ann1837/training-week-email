import { NextResponse } from "next/server";
import { hasValidAdminSecret } from "@/lib/auth";
import { buildTodayEmail, sendTrainingEmail } from "@/lib/email";
import { readWeeklyPlan, validatePlan } from "@/lib/plan-store";
import { WeekdayKey, WeeklyPlan } from "@/lib/types";
import { getTodayInTimezone } from "@/lib/dates";
import { getLatestWhoopData } from "@/lib/whoop-data";
import { buildDailyRecommendation } from "@/lib/training-coach";
import { getMarathonBlockDay } from "@/lib/marathon-plan";

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

    const today = getTodayInTimezone(plan.timezone);
    const selectedDay = body.dayKey ?? today.weekdayKey;
    const planned = getMarathonBlockDay(selectedDay, plan.days[selectedDay]);
    plan.days[selectedDay] = planned;

    let recommendation;
    try {
      const whoop = await getLatestWhoopData(request.url);
      recommendation = buildDailyRecommendation({
        planned,
        recovery: whoop.recovery,
        sleep: whoop.sleep,
        yesterdayWorkouts: whoop.yesterdayWorkouts
      });
    } catch (error) {
      console.error("WHOOP kunde inte läsas; skickar grundplanen.", error);
    }

    const email = await sendTrainingEmail({ plan, dayKey: selectedDay, recommendation });
    return NextResponse.json({ ok: true, dryRun: false, email });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Kunde inte skicka mail." },
      { status: 500 }
    );
  }
}
  
