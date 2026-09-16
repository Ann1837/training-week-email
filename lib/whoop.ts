import { randomBytes } from "crypto";

export type WhoopTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: "bearer";
};

export function getWhoopConfig(requestUrl: string) {
  const origin = new URL(requestUrl).origin;
  const apiHostname = (process.env.WHOOP_API_HOSTNAME ?? "https://api.prod.whoop.com").replace(
    /\/$/,
    ""
  );

  return {
    apiHostname,
    clientId: process.env.WHOOP_CLIENT_ID,
    clientSecret: process.env.WHOOP_CLIENT_SECRET,
    redirectUri: process.env.WHOOP_REDIRECT_URI ?? `${origin}/api/whoop/callback`,
    scopes: "read:recovery read:sleep read:workout offline"
  };
}

export function createWhoopState() {
  return randomBytes(6).toString("base64url");
}

export function buildWhoopAuthorizationUrl(requestUrl: string, state: string) {
  const config = getWhoopConfig(requestUrl);

  if (!config.clientId) {
    throw new Error("WHOOP_CLIENT_ID saknas.");
  }

  const url = new URL("/oauth/oauth2/auth", config.apiHostname);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("scope", config.scopes);
  url.searchParams.set("state", state);

  return url;
}

export async function exchangeWhoopCode(requestUrl: string, code: string) {
  const config = getWhoopConfig(requestUrl);

  if (!config.clientId) {
    throw new Error("WHOOP_CLIENT_ID saknas.");
  }

  if (!config.clientSecret) {
    throw new Error("WHOOP_CLIENT_SECRET saknas.");
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri
  });

  const response = await fetch(new URL("/oauth/oauth2/token", config.apiHostname), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  const data = await response.json().catch(async () => ({ error: await response.text() }));

  if (!response.ok) {
    const message =
      typeof data === "object" && data && "error" in data
        ? String(data.error)
        : "WHOOP token exchange failed.";
    throw new Error(`WHOOP: ${message}`);
  }

  return data as WhoopTokenResponse;
}
