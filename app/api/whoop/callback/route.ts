import { NextResponse } from "next/server";
import { exchangeWhoopCode } from "@/lib/whoop";
import { saveWhoopRefreshToken } from "@/lib/whoop-token-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const oauthError = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");
  const savedState = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("whoop_oauth_state="))
    ?.slice("whoop_oauth_state=".length);

  try {
    if (oauthError) {
      throw new Error(`WHOOP login avbröts: ${oauthError}`);
    }

    if (!code) {
      throw new Error("WHOOP skickade ingen authorization code.");
    }

    if (!returnedState || !savedState || returnedState !== savedState) {
      throw new Error("WHOOP state matchade inte. Starta login igen från /whoop.");
    }

    const token = await exchangeWhoopCode(request.url, code);

    if (!token.refresh_token) {
      throw new Error("WHOOP skickade ingen refresh token. Kontrollera att offline-scope är tillåtet.");
    }

    await saveWhoopRefreshToken(token.refresh_token);
    const response = NextResponse.redirect(new URL("/whoop?connected=1", request.url));

    response.cookies.set("whoop_oauth_state", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0
    });

    return response;
  } catch (caughtError) {
    const message = caughtError instanceof Error ? caughtError.message : "WHOOP-kopplingen misslyckades.";
    return NextResponse.redirect(new URL(`/whoop?error=${encodeURIComponent(message)}`, request.url));
  }
}
