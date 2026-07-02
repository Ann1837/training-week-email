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

  const plan = await request.json();
  await writeWeeklyPlan(plan);
  return NextResponse.json({ ok: true, plan });
}
