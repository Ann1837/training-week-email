import { NextResponse } from "next/server";
import { hasValidAdminSecret } from "@/lib/auth";
import { buildHannaWeeklyEmail, sendHannaWeeklyEmail, shouldSendHannaWeeklyEmail } from "@/lib/hanna-plan";

export const dynamic = "force-dynamic";

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

    if (!shouldSendHannaWeeklyEmail()) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: "Hanna-mailet skickas bara söndag kl. 16 Europe/Stockholm."
      });
    }

    const email = await sendHannaWeeklyEmail();
    return NextResponse.json({ ok: true, subject: email.subject, to: email.to });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Kunde inte skicka Hanna-mail." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { dryRun?: boolean };

    if (body.dryRun) {
      const email = buildHannaWeeklyEmail();
      return NextResponse.json({ ok: true, dryRun: true, email });
    }

    if (!hasValidAdminSecret(request)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const email = await sendHannaWeeklyEmail();
    return NextResponse.json({ ok: true, dryRun: false, subject: email.subject, to: email.to });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Kunde inte skicka Hanna-mail." },
      { status: 500 }
    );
  }
}
