import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const TOKEN_KEY = "whoop:refresh-token";

function getRedisConfig() {
  const url =
    process.env.UPSTASH_KV_REST_API_URL ??
    process.env.KV_REST_API_URL ??
    process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.UPSTASH_KV_REST_API_TOKEN ??
    process.env.KV_REST_API_TOKEN ??
    process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error(
      "Tokenlagring saknas. Anslut Upstash Redis till projektet i Vercel."
    );
  }

  return { url: url.replace(/\/$/, ""), token };
}

function encryptionKey() {
  const secret = process.env.WHOOP_CLIENT_SECRET;

  if (!secret) {
    throw new Error("WHOOP_CLIENT_SECRET saknas.");
  }

  return createHash("sha256").update(secret).digest();
}

function encrypt(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [iv, tag, encrypted].map((part) => part.toString("base64url")).join(".");
}

function decrypt(value: string) {
  const [ivValue, tagValue, encryptedValue] = value.split(".");

  if (!ivValue || !tagValue || !encryptedValue) {
    throw new Error("Den sparade WHOOP-tokenen har ett ogiltigt format.");
  }

  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivValue, "base64url"));
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final()
  ]).toString("utf8");
}

async function redis(command: unknown[]) {
  const config = getRedisConfig();
  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(command),
    cache: "no-store"
  });

  const data = (await response.json().catch(() => null)) as { result?: unknown; error?: string } | null;

  if (!response.ok || data?.error) {
    throw new Error(`Kunde inte nå tokenlagringen: ${data?.error ?? response.statusText}`);
  }

  return data?.result;
}

export async function saveWhoopRefreshToken(refreshToken: string) {
  await redis(["SET", TOKEN_KEY, encrypt(refreshToken)]);
}

export async function getWhoopRefreshToken() {
  try {
    const stored = await redis(["GET", TOKEN_KEY]);
    if (typeof stored === "string") return decrypt(stored);
  } catch (error) {
    if (!process.env.WHOOP_REFRESH_TOKEN) throw error;
  }

  return process.env.WHOOP_REFRESH_TOKEN ?? null;
}

export async function isWhoopConnected() {
  try {
    return Boolean(await getWhoopRefreshToken());
  } catch {
    return false;
  }
}
