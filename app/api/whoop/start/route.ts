import { NextResponse } from "next/server";
import { hasValidAdminSecret } from "@/lib/auth";
import { buildWhoopAuthorizationUrl, createWhoopState } from "@/lib/whoop";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    if (!hasValidAdminSecret(request)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const state = createWhoopState();
    const authorizationUrl = buildWhoopAuthorizationUrl(request.url, state);
    const response = NextResponse.redirect(authorizationUrl);

    response.cookies.set("whoop_oauth_state", state, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 10 * 60
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Kunde inte starta WHOOP-login." },
      { status: 500 }
    );
  }
}
