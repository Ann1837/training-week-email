import { Resend } from "resend";
import { getHourInTimezone, getTodayInTimezone } from "./dates";
import {
  buildConfidenceHtmlFooter,
  buildConfidenceTextFooter,
  buildSafetyHtmlFooter,
  buildSafetyTextFooter
} from "./email-footer";

const TIMEZONE = "Europe/Stockholm";
const YOUTUBE_FEED_URL = "https://www.youtube.com/feeds/videos.xml?channel_id=UCnRVL1-HJnXWB_Xi2dAoTcg";
const POSTS_URL = "https://posts.bryanjohnson.com/";
const WEEK_MS = 8 * 24 * 60 * 60 * 1000;

type BryanPost = {
  source: string;
  title: string;
  url: string;
  published: string;
  summary?: string;
};

type DigestPayload = {
  now?: Date;
};

export async function sendBryanWeeklyDigest(payload: DigestPayload = {}) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.TRAINING_EMAIL_TO;
  const from = process.env.TRAINING_EMAIL_FROM ?? "Training Briefing <onboarding@resend.dev>";

  if (!apiKey) {
    throw new Error("RESEND_API_KEY saknas.");
  }
  if (!to) {
    throw new Error("TRAINING_EMAIL_TO saknas.");
  }

  const email = await buildBryanWeeklyDigest(payload);
  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from,
    to,
    subject: email.subject,
    html: email.html,
    text: email.text
  });

  if (result.error) {
    throw new Error(`Resend: ${result.error.message}`);
  }

  return { ...email, result };
}

export async function buildBryanWeeklyDigest({ now = new Date() }: DigestPayload = {}) {
  const dateLabel = getTodayInTimezone(TIMEZONE, now).dateLabel;
  const posts = await fetchBryanPosts(now);
  const subject = `🟢 Bryan Johnson veckosvep - ${dateLabel}`;
  const text = buildText(posts, dateLabel);
  const html = buildHtml(posts, dateLabel);

  return { subject, text, html, posts };
}

export function shouldSendBryanDigest(now = new Date()) {
  const today = getTodayInTimezone(TIMEZONE, now);
  const localHour = getHourInTimezone(TIMEZONE, now);

  return today.weekdayKey === "sunday" && localHour === 19;
}

async function fetchBryanPosts(now: Date) {
  const results = await Promise.allSettled([fetchYouTubePosts(now), fetchBryanPostsPage(now)]);
  const posts = results.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
  const seen = new Set<string>();

  return posts
    .filter((post) => {
      const key = `${post.source}:${post.url}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime())
    .slice(0, 8);
}

async function fetchYouTubePosts(now: Date): Promise<BryanPost[]> {
  const xml = await fetchText(YOUTUBE_FEED_URL);
  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? [];

  return entries
    .map((entry) => {
      const title = readTag(entry, "title");
      const published = readTag(entry, "published");
      const url = readLink(entry);
      const description = readTag(entry, "media:description") || readTag(entry, "summary");

      return {
        source: "YouTube",
        title,
        url,
        published,
        summary: cleanDescription(description)
      };
    })
    .filter((post) => post.title && post.url && isRecent(post.published, now));
}

async function fetchBryanPostsPage(now: Date): Promise<BryanPost[]> {
  const html = await fetchText(POSTS_URL, 6000);
  const matches = [...html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];

  return matches
    .map((match) => {
      const href = match[1];
      const title = stripHtml(match[2]);
      const url = href.startsWith("http") ? href : new URL(href, POSTS_URL).toString();

      return {
        source: "Bryan posts",
        title,
        url,
        published: now.toISOString()
      };
    })
    .filter((post) => post.title.length > 12 && post.url.includes("bryanjohnson"))
    .slice(0, 4);
}

async function fetchText(url: string, timeoutMs = 9000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "AnnTrainingWeekEmail/1.0" },
      signal: controller.signal,
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`${url} svarade ${response.status}`);
    }

    return response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function readTag(xml: string, tag: string) {
  const escapedTag = tag.replace(":", "\\:");
  const match = xml.match(new RegExp(`<${escapedTag}[^>]*>([\\s\\S]*?)<\\/${escapedTag}>`));
  return decodeEntities(stripHtml(match?.[1] ?? "").trim());
}

function readLink(xml: string) {
  const match = xml.match(/<link[^>]+rel=["']alternate["'][^>]+href=["']([^"']+)["']/);
  return decodeEntities(match?.[1] ?? "");
}

function isRecent(value: string, now: Date) {
  const published = new Date(value).getTime();
  return Number.isFinite(published) && now.getTime() - published <= WEEK_MS;
}

function cleanDescription(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.includes("blueprint.bryanjohnson.com") && !line.includes("x.com/"))
    .slice(0, 2)
    .join(" ");
}

function buildText(posts: BryanPost[], dateLabel: string) {
  const intro = posts.length
    ? `Jag hittade ${posts.length} nya/lämpligt aktuella Bryan Johnson-poster att kika på.`
    : "Jag hittade inga nya Bryan Johnson-poster från de öppna källorna den här veckan.";

  return [
    "Hej Ann!",
    "",
    `🧬 Bryan Johnson veckosvep - ${dateLabel}`,
    intro,
    "",
    ...posts.map((post) =>
      [`• ${formatDate(post.published)} - ${post.source}: ${post.title}`, post.summary ? `  ${post.summary}` : "", `  ${post.url}`]
        .filter(Boolean)
        .join("\n")
    ),
    "",
    "Kort notis: det här är en automatisk sammanställning från öppna källor, inte medicinska råd.",
    "",
    buildConfidenceTextFooter(),
    "",
    buildSafetyTextFooter()
  ]
    .filter(Boolean)
    .join("\n");
}

function buildHtml(posts: BryanPost[], dateLabel: string) {
  return `<!doctype html>
<html lang="sv">
  <body style="margin:0;background:#070b0a;color:#f4fff8;font-family:Arial,Helvetica,sans-serif;">
    <main style="max-width:640px;margin:0 auto;padding:28px 18px;">
      <section style="background:#0f1513;border:1px solid #22312c;border-radius:8px;padding:24px;border-top:4px solid #38ff7a;">
        <p style="margin:0 0 12px;font-size:16px;color:#f4fff8;">Hej Ann!</p>
        <p style="margin:0;color:#8fa39b;font-size:14px;">📅 ${escapeHtml(dateLabel)}</p>
        <h1 style="margin:8px 0 10px;font-size:24px;line-height:1.25;color:#38ff7a;">🧬 Bryan Johnson veckosvep</h1>
        <p style="margin:0 0 16px;color:#c9d8d1;">${
          posts.length
            ? `Jag hittade ${posts.length} nya/lämpligt aktuella poster från öppna källor.`
            : "Jag hittade inga nya poster från de öppna källorna den här veckan."
        }</p>
        ${posts
          .map(
            (post) => `<article style="padding:12px 0;border-top:1px solid #22312c;">
              <p style="margin:0 0 4px;color:#8fa39b;font-size:13px;">${escapeHtml(formatDate(post.published))} · ${escapeHtml(post.source)}</p>
              <h2 style="margin:0 0 6px;font-size:17px;line-height:1.35;color:#f4fff8;">${escapeHtml(post.title)}</h2>
              ${post.summary ? `<p style="margin:0 0 8px;color:#c9d8d1;">${escapeHtml(post.summary)}</p>` : ""}
              <a href="${escapeHtml(post.url)}" style="color:#38ff7a;">Öppna inlägg</a>
            </article>`
          )
          .join("")}
        <p style="margin:16px 0 0;padding-top:14px;border-top:1px solid #22312c;color:#8fa39b;font-size:13px;">Automatisk sammanställning från öppna källor, inte medicinska råd.</p>
        ${buildConfidenceHtmlFooter()}
        ${buildSafetyHtmlFooter()}
      </section>
    </main>
  </body>
</html>`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: TIMEZONE,
    weekday: "short",
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function decodeEntities(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
