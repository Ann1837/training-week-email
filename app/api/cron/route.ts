import { NextResponse } from "next/server";
import { sendTrainingEmail } from "@/lib/email";
import { getHourInTimezone } from "@/lib/dates";
import { readWeeklyPlan } from "@/lib/plan-store";
import { getTodayInTimezone } from "@/lib/dates";
import { getLatestWhoopData } from "@/lib/whoop-data";
import { buildDailyRecommendation } from "@/lib/training-coach";
import { getMarathonBlockDay, getNextWeekOverview } from "@/lib/marathon-plan";

export async function GET(request: Request) {
  try {
    const expectedSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get("authorization");
    const providedSecret = new URL(request.url).searchParams.get("secret");

    if (
      expectedSecret &&
      authHeader !== `Bearer ${expectedSecret}` &&
      providedSecret !== expectedSecret
    ) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const plan = await readWeeklyPlan();
    const localHour = getHourInTimezone(plan.timezone);

    if (localHour !== 10) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: `Local hour in ${plan.timezone} is ${localHour}, not 10.`
      });
    }

    let recommendation;
    try {
      const whoop = await getLatestWhoopData(request.url);
      const today = getTodayInTimezone(plan.timezone);
      const planned = getMarathonBlockDay(today.weekdayKey, plan.days[today.weekdayKey]);
      plan.days[today.weekdayKey] = planned;
      recommendation = buildDailyRecommendation({
        planned,
        recovery: whoop.recovery,
        sleep: whoop.sleep,
        yesterdayWorkouts: whoop.yesterdayWorkouts
      });
    } catch (error) {
      console.error("WHOOP kunde inte läsas; skickar grundplanen.", error);
    }

    const today = getTodayInTimezone(plan.timezone);
    const weeklyOverview = today.weekdayKey === "sunday" ? getNextWeekOverview(plan) : undefined;
    const email = await sendTrainingEmail({ plan, recommendation, weeklyOverview });
    return NextResponse.json({ ok: true, dayKey: email.dayKey, subject: email.subject });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Kunde inte skicka cron-mail." },
      { status: 500 }
    );
  }
}
  
