import { Resend } from "resend";
import { getHourInTimezone, getTodayInTimezone } from "./dates";

const TIMEZONE = "Europe/Stockholm";
const HANNA_EMAIL_TO = "hannapellk@gmail.com";

type HannaPayload = {
  now?: Date;
};

type HannaWeek = {
  title: string;
  days: string[];
};

const hannaPlan: HannaWeek[] = [
  {
    title: "Vecka 1 (4-10 augusti)",
    days: [
      "Måndag: Gym",
      "Tisdag: 6 km lugn distans (zon 2)",
      "Onsdag: Gym",
      "Torsdag: 5 x 3 min intervaller (2 min joggvila)",
      "Fredag: Vila eller lätt gym",
      "Lördag: 18 km lugnt långpass",
      "Söndag: 5 km mycket lugn återhämtning"
    ]
  },
  {
    title: "Vecka 2 (11-17 augusti)",
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
    title: "Vecka 3 (18-24 augusti)",
    days: [
      "Måndag: Gym",
      "Tisdag: 8 km lugn distans",
      "Onsdag: Gym",
      "Torsdag: 6 x 4 min intervaller (2-3 min joggvila)",
      "Fredag: Vila",
      "Lördag: 24 km lugnt långpass",
      "Söndag: 5 km återhämtning"
    ]
  },
  {
    title: "Vecka 4 (25-31 augusti)",
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
    title: "Vecka 5 (1-7 september)",
    days: [
      "Måndag: Lätt gym",
      "Tisdag: 6 km lugn distans",
      "Onsdag: Vila",
      "Torsdag: 4 x 3 min intervaller",
      "Fredag: Vila",
      "Lördag: 12-14 km lugnt",
      "Söndag: 5 km mycket lugnt"
    ]
  },
  {
    title: "Tävlingsvecka (8-13 september)",
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
  const subject = `Hannas marathonplan - ${dateLabel}`;
  const text = buildText(dateLabel);
  const html = buildHtml(dateLabel);

  return { subject, text, html, weeks: hannaPlan };
}

export async function sendHannaWeeklyEmail(payload: HannaPayload = {}) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.HANNA_EMAIL_TO ?? HANNA_EMAIL_TO;
  const from = process.env.TRAINING_EMAIL_FROM ?? "Training Briefing <onboarding@resend.dev>";

  if (!apiKey) {
    throw new Error("RESEND_API_KEY saknas.");
  }

  const email = buildHannaWeeklyEmail(payload);
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

  return { ...email, to, result };
}

export function shouldSendHannaWeeklyEmail(now = new Date()) {
  const today = getTodayInTimezone(TIMEZONE, now);
  const localHour = getHourInTimezone(TIMEZONE, now);

  return today.weekdayKey === "sunday" && localHour === 16;
}

function buildText(dateLabel: string) {
  return [
    "Hej Hanna!",
    "",
    `🏃 Marathonplan - ${dateLabel}`,
    "Här kommer planen fram till Tallinn Marathon.",
    "",
    ...hannaPlan.flatMap((week) => [
      week.title,
      ...week.days.map((day) => `• ${day}`),
      ""
    ]),
    "Lycka till med passen!"
  ].join("\n");
}

function buildHtml(dateLabel: string) {
  return `<!doctype html>
<html lang="sv">
  <body style="margin:0;background:#f5f2ed;color:#1e2422;font-family:Arial,Helvetica,sans-serif;">
    <main style="max-width:640px;margin:0 auto;padding:28px 18px;">
      <section style="background:#ffffff;border:1px solid #ddd6cb;border-radius:8px;padding:24px;">
        <p style="margin:0 0 12px;font-size:16px;">Hej Hanna!</p>
        <p style="margin:0;color:#66706b;font-size:14px;">📅 ${escapeHtml(dateLabel)}</p>
        <h1 style="margin:8px 0 10px;font-size:24px;line-height:1.25;">🏃 Marathonplan</h1>
        <p style="margin:0 0 16px;color:#38423e;">Här kommer planen fram till Tallinn Marathon.</p>
        ${hannaPlan
          .map(
            (week) => `<article style="padding:14px 0;border-top:1px solid #eee5dc;">
              <h2 style="margin:0 0 8px;font-size:18px;line-height:1.35;">${escapeHtml(week.title)}</h2>
              <ul style="margin:0;padding-left:20px;color:#38423e;">
                ${week.days.map((day) => `<li style="margin:5px 0;">${escapeHtml(day)}</li>`).join("")}
              </ul>
            </article>`
          )
          .join("")}
        <p style="margin:16px 0 0;padding-top:14px;border-top:1px solid #eee5dc;">Lycka till med passen!</p>
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
