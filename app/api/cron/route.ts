import { NextResponse } from "next/server";
import { sendTrainingEmail } from "@/lib/email";
import { getHourInTimezone } from "@/lib/dates";
import { readWeeklyPlan } from "@/lib/plan-store";

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

    if (localHour !== 7) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: `Local hour in ${plan.timezone} is ${localHour}, not 7.`
      });
    }

    const email = await sendTrainingEmail({ plan });
    return NextResponse.json({ ok: true, dayKey: email.dayKey, subject: email.subject });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Kunde inte skicka cron-mail." },
      { status: 500 }
    );
  }
}
