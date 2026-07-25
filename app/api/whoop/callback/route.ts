import { NextResponse } from "next/server";
import { exchangeWhoopCode } from "@/lib/whoop";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const error = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");
  const savedState = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("whoop_oauth_state="))
    ?.replace("whoop_oauth_state=", "");

  try {
    if (error) {
      throw new Error(`WHOOP login avbröts: ${error}`);
    }

    if (!code) {
      throw new Error("WHOOP skickade ingen authorization code.");
    }

    if (!returnedState || !savedState || returnedState !== savedState) {
      throw new Error("WHOOP state matchade inte. Starta login igen från /whoop.");
    }

    const token = await exchangeWhoopCode(request.url, code);
    const response = new NextResponse(buildSuccessHtml(token), {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });

    response.cookies.set("whoop_oauth_state", "", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0
    });

    return response;
  } catch (caughtError) {
    return new NextResponse(
      buildErrorHtml(caughtError instanceof Error ? caughtError.message : "WHOOP-kopplingen misslyckades."),
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}

function buildSuccessHtml(token: { refresh_token?: string; expires_in?: number; scope?: string }) {
  const refreshToken = token.refresh_token ?? "";

  return pageShell(`
    <p class="kicker">WHOOP kopplad</p>
    <h1>Login fungerade</h1>
    <p>WHOOP skickade tillbaka en token. För att appen ska kunna hämta data senare behöver du lägga refresh token som environment variable i Vercel.</p>
    ${
      refreshToken
        ? `<label>WHOOP_REFRESH_TOKEN</label><textarea readonly>${escapeHtml(refreshToken)}</textarea>`
        : `<div class="warning">Ingen refresh token kom tillbaka. Kontrollera att scope <strong>offline</strong> finns med i WHOOP-login.</div>`
    }
    <dl>
      <div><dt>Expires in</dt><dd>${escapeHtml(String(token.expires_in ?? "okänt"))} sekunder</dd></div>
      <div><dt>Scope</dt><dd>${escapeHtml(token.scope ?? "okänt")}</dd></div>
    </dl>
    <ol>
      <li>Kopiera värdet ovan.</li>
      <li>Gå till Vercel → Project → Settings → Environment Variables.</li>
      <li>Lägg till <code>WHOOP_REFRESH_TOKEN</code> i Production.</li>
      <li>Redeploya projektet.</li>
    </ol>
  `);
}

function buildErrorHtml(message: string) {
  return pageShell(`
    <p class="kicker">WHOOP koppling</p>
    <h1>Något gick fel</h1>
    <div class="warning">${escapeHtml(message)}</div>
    <p>Gå tillbaka till <a href="/whoop">/whoop</a> och starta login igen.</p>
  `);
}

function pageShell(content: string) {
  return `<!doctype html>
<html lang="sv">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>WHOOP | Training Week Briefing</title>
    <style>
      body { margin:0; min-height:100vh; background:#070b0a; color:#f4fff8; font-family:Arial,Helvetica,sans-serif; display:grid; place-items:start center; padding:28px 18px; }
      main { width:min(720px,100%); background:#0f1513; border:1px solid #22312c; border-top:4px solid #38ff7a; border-radius:8px; padding:28px; line-height:1.55; }
      h1 { margin:6px 0 12px; color:#38ff7a; line-height:1.15; }
      p, li, dd { color:#c9d8d1; }
      a, code { color:#38ff7a; }
      label, dt { display:block; color:#f4fff8; font-weight:700; margin-top:18px; }
      textarea { width:100%; min-height:140px; margin-top:8px; border:1px solid #2f6f62; border-radius:8px; background:#070b0a; color:#f4fff8; padding:12px; font:13px ui-monospace,SFMono-Regular,Menlo,monospace; }
      .kicker { margin:0; color:#8fa39b; font-size:13px; font-weight:800; text-transform:uppercase; }
      .warning { margin:16px 0; padding:12px; border-radius:8px; background:#261b10; border:1px solid #ffb84d; color:#ffe2b8; }
      dl { display:grid; gap:8px; margin:18px 0; }
      dl div { border-top:1px solid #22312c; padding-top:8px; }
      dd { margin:2px 0 0; }
    </style>
  </head>
  <body><main>${content}</main></body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
