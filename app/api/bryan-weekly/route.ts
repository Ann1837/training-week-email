import { NextResponse } from "next/server";
import { hasValidAdminSecret } from "@/lib/auth";
import { buildBryanWeeklyDigest, sendBryanWeeklyDigest, shouldSendBryanDigest } from "@/lib/bryan-digest";

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

    if (!shouldSendBryanDigest()) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: "Bryan-svepet skickas bara söndag kväll Europe/Stockholm."
      });
    }

    const email = await sendBryanWeeklyDigest();
    return NextResponse.json({ ok: true, subject: email.subject, posts: email.posts.length });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Kunde inte skicka Bryan-svep." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { dryRun?: boolean };

    if (body.dryRun) {
      const email = await buildBryanWeeklyDigest();
      return NextResponse.json({ ok: true, dryRun: true, email });
    }

    if (!hasValidAdminSecret(request)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const email = await sendBryanWeeklyDigest();
    return NextResponse.json({ ok: true, dryRun: false, subject: email.subject, posts: email.posts.length });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Kunde inte skicka Bryan-svep." },
      { status: 500 }
    );
  }
}
