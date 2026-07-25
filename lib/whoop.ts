import { randomBytes } from "crypto";

const WHOOP_AUTH_URL = "https://api.prod.whoop.com/oauth/oauth2/auth";
const WHOOP_TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token";

export type WhoopTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: "bearer";
};

export function getWhoopConfig(requestUrl: string) {
  const origin = new URL(requestUrl).origin;

  return {
    clientId: process.env.WHOOP_CLIENT_ID,
    clientSecret: process.env.WHOOP_CLIENT_SECRET,
    redirectUri: process.env.WHOOP_REDIRECT_URI ?? `${origin}/api/whoop/callback`,
    scopes:
      process.env.WHOOP_SCOPES ??
      "offline read:profile read:recovery read:sleep read:cycles read:workout"
  };
}

export function createWhoopState() {
  return randomBytes(8).toString("base64url").slice(0, 8);
}

export function buildWhoopAuthorizationUrl(requestUrl: string, state: string) {
  const config = getWhoopConfig(requestUrl);

  if (!config.clientId) {
    throw new Error("WHOOP_CLIENT_ID saknas.");
  }

  const url = new URL(WHOOP_AUTH_URL);
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

  const response = await fetch(WHOOP_TOKEN_URL, {
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
