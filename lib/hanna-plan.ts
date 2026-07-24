import { Resend } from "resend";
import { getHourInTimezone, getTodayInTimezone } from "./dates";

const TIMEZONE = "Europe/Stockholm";
const HANNA_EMAIL_TO = "hannapellk@gmail.com";
const HANNA_EMAIL_CC = "ann@pjano.se";

type HannaPayload = {
  now?: Date;
};

type HannaWeek = {
  title: string;
  sendOn: string;
  days: string[];
};

const hannaPlan: HannaWeek[] = [
  {
    title: "Vecka 1 (4–10 augusti)",
    sendOn: "2026-08-03",
    days: [
      "Måndag: Gym",
      "Tisdag: 6 km lugn distans (zon 2)",
      "Onsdag: Gym",
      "Torsdag: 5 × 3 min intervaller (2 min joggvila)",
      "Fredag: Vila eller lätt gym",
      "Lördag: 18 km lugnt långpass",
      "Söndag: 5 km mycket lugn återhämtning"
    ]
  },
  {
    title: "Vecka 2 (11–17 augusti)",
    sendOn: "2026-08-10",
    days: [
      "Måndag: Gym",
      "Tisdag: 7 km lugn distans",
      "Onsdag: Gym",
      "Torsdag: 8 km där 4 km går i planerad marafart (ca 6:40-6:50/km)",
      "Fredag: Vila",
      "Lördag: 22 km lugnt långpass",
      "Söndag: 5 km återhämtning"
    ]
  },
  {
    title: "Vecka 3 (18–24 augusti)",
    sendOn: "2026-08-17",
    days: [
      "Måndag: Gym",
      "Tisdag: 8 km lugn distans",
      "Onsdag: Gym",
      "Torsdag: 6 × 4 min intervaller (2–3 min joggvila)",
      "Fredag: Vila",
      "Lördag: 24 km lugnt långpass",
      "Söndag: 5 km återhämtning"
    ]
  },
  {
    title: "Vecka 4 (25–31 augusti)",
    sendOn: "2026-08-24",
    days: [
      "Måndag: Gym",
      "Tisdag: 6 km lugn distans",
      "Onsdag: Gym",
      "Torsdag: 10 km där sista 5 km går i marafart",
      "Fredag: Vila",
      "Lördag: 18 km lugnt långpass",
      "Söndag: 5 km återhämtning"
    ]
  },
  {
    title: "Vecka 5 (1–7 september)",
    sendOn: "2026-08-31",
    days: [
      "Måndag: Lätt gym",
      "Tisdag: 6 km lugn distans",
      "Onsdag: Vila",
      "Torsdag: 4 × 3 min intervaller",
      "Fredag: Vila",
      "Lördag: 12-14 km lugnt",
      "Söndag: 5 km mycket lugnt"
    ]
  },
  {
    title: "Tävlingsvecka (8–13 september)",
    sendOn: "2026-09-07",
    days: [
      "Måndag: Vila eller promenad",
      "Tisdag: 5 km lugnt + 4 strides",
      "Onsdag: Vila",
      "Torsdag: 4 km mycket lugnt",
      "Fredag: Vila",
      "Lördag: Kort promenad och lätt rörlighet",
      "Söndag: Tallinn Marathon 🏅"
    ]
  }
];

export function buildHannaWeeklyEmail({ now = new Date() }: HannaPayload = {}) {
  const dateLabel = getTodayInTimezone(TIMEZONE, now).dateLabel;
  const week = getHannaWeekForSendDate(now) ?? getNextHannaWeek(now);
  const subject = week
    ? `Hannas marathonplan: ${week.title}`
    : `Hannas marathonplan - ingen plan denna vecka`;
  const text = buildText(dateLabel, week);
  const html = buildHtml(dateLabel, week);

  return { subject, text, html, week };
}

export async function sendHannaWeeklyEmail(payload: HannaPayload = {}) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.HANNA_EMAIL_TO ?? HANNA_EMAIL_TO;
  const cc = process.env.HANNA_EMAIL_CC ?? HANNA_EMAIL_CC;
  const from = process.env.TRAINING_EMAIL_FROM ?? "Training Briefing <onboarding@resend.dev>";

  if (!apiKey) {
    throw new Error("RESEND_API_KEY saknas.");
  }

  const email = buildHannaWeeklyEmail(payload);
  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from,
    to,
    cc,
    subject: email.subject,
    html: email.html,
    text: email.text
  });

  if (result.error) {
    throw new Error(`Resend: ${result.error.message}`);
  }

  return { ...email, to, cc, result };
}

export function shouldSendHannaWeeklyEmail(now = new Date()) {
  const today = getTodayInTimezone(TIMEZONE, now);
  const localHour = getHourInTimezone(TIMEZONE, now);

  return today.weekdayKey === "monday" && localHour === 16 && Boolean(getHannaWeekForSendDate(now));
}

function getHannaWeekForSendDate(now: Date) {
  const sendDate = getDateKeyInTimezone(now);
  return hannaPlan.find((week) => week.sendOn === sendDate);
}

function getNextHannaWeek(now: Date) {
  const today = getDateKeyInTimezone(now);
  return hannaPlan.find((week) => week.sendOn >= today);
}

function getDateKeyInTimezone(now: Date) {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}

function buildText(dateLabel: string, week?: HannaWeek) {
  if (!week) {
    return [
      "Hej Hanna!",
      "",
      `🏃 Marathonplan - ${dateLabel}`,
      "Det finns ingen plan schemalagd för kommande vecka."
    ].join("\n");
  }

  return [
    "Hej Hanna!",
    "",
    `🏃 Marathonplan - ${week.title}`,
    `Datum: ${dateLabel}. Här kommer kommande veckas plan.`,
    "",
    ...week.days.map((day) => `• ${day}`),
    "",
    "Lycka till med passen!"
  ].join("\n");
}

function buildHtml(dateLabel: string, week?: HannaWeek) {
  return `<!doctype html>
<html lang="sv">
  <body style="margin:0;background:#f5f2ed;color:#1e2422;font-family:Arial,Helvetica,sans-serif;">
    <main style="max-width:640px;margin:0 auto;padding:28px 18px;">
      <section style="background:#ffffff;border:1px solid #ddd6cb;border-radius:8px;padding:24px;">
        <p style="margin:0 0 12px;font-size:16px;">Hej Hanna!</p>
        <p style="margin:0;color:#66706b;font-size:14px;">📅 ${escapeHtml(dateLabel)}</p>
        <h1 style="margin:8px 0 10px;font-size:24px;line-height:1.25;">🏃 ${escapeHtml(week?.title ?? "Marathonplan")}</h1>
        ${
          week
            ? `<p style="margin:0 0 16px;color:#38423e;">Här kommer kommande veckas plan.</p>
              <article style="padding:14px 0;border-top:1px solid #eee5dc;">
                <ul style="margin:0;padding-left:20px;color:#38423e;">
                  ${week.days.map((day) => `<li style="margin:5px 0;">${formatDayHtml(day)}</li>`).join("")}
                </ul>
              </article>
              <p style="margin:16px 0 0;padding-top:14px;border-top:1px solid #eee5dc;">Lycka till med passen!</p>`
            : `<p style="margin:0;color:#38423e;">Det finns ingen plan schemalagd för kommande vecka.</p>`
        }
      </section>
    </main>
  </body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatDayHtml(value: string) {
  const colonIndex = value.indexOf(":");

  if (colonIndex === -1) {
    return escapeHtml(value);
  }

  const label = value.slice(0, colonIndex + 1);
  const rest = value.slice(colonIndex + 1);

  return `<strong>${escapeHtml(label)}</strong>${escapeHtml(rest)}`;
}
