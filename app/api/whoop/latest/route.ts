import { NextResponse } from "next/server";
import { hasValidAdminSecret } from "@/lib/auth";
import { getLatestWhoopData } from "@/lib/whoop-data";
import { readWeeklyPlan } from "@/lib/plan-store";
import { getTodayInTimezone } from "@/lib/dates";
import { buildDailyRecommendation } from "@/lib/training-coach";
import { getMarathonBlockDay } from "@/lib/marathon-plan";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!hasValidAdminSecret(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [data, plan] = await Promise.all([getLatestWhoopData(request.url), readWeeklyPlan()]);
    const today = getTodayInTimezone(plan.timezone);
    const planned = getMarathonBlockDay(today.weekdayKey, plan.days[today.weekdayKey]);
    const recommendation = buildDailyRecommendation({
      planned,
      recovery: data.recovery,
      sleep: data.sleep,
      yesterdayWorkouts: data.yesterdayWorkouts
    });

    return NextResponse.json({ ok: true, data: { ...data, recommendation } });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Kunde inte hämta WHOOP-data." },
      { status: 502 }
    );
  }
}
  
