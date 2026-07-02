import { NextResponse } from "next/server";
import { hasValidAdminSecret } from "@/lib/auth";
import { readWeeklyPlan, writeWeeklyPlan } from "@/lib/plan-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const plan = await readWeeklyPlan();
  return NextResponse.json(plan);
}

export async function PUT(request: Request) {
  if (!hasValidAdminSecret(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const plan = await request.json();
    await writeWeeklyPlan(plan);
    return NextResponse.json({ ok: true, plan });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kunde inte spara planen.";
    const isReadonlyFileSystem =
      message.includes("EROFS") ||
      message.includes("read-only") ||
      Boolean(process.env.VERCEL);

    return NextResponse.json(
      {
        ok: false,
        error: isReadonlyFileSystem
          ? "Vercel kan inte spara ändringar till JSON-filen. Ändra data/weekly-plan.json i GitHub och redeploya för permanenta ändringar."
          : message
      },
      { status: isReadonlyFileSystem ? 409 : 500 }
    );
  }
}
