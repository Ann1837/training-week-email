import { Resend } from "resend";
import { getTodayInTimezone } from "./dates";
import { DayPlan, WeekdayKey, WeeklyPlan, weekdayLabels } from "./types";

type EmailPayload = {
  plan: WeeklyPlan;
  dayKey?: WeekdayKey;
  now?: Date;
};

export function buildTodayEmail({ plan, dayKey, now = new Date() }: EmailPayload) {
  const today = getTodayInTimezone(plan.timezone, now);
  const selectedDayKey = dayKey ?? today.weekdayKey;
  const day = plan.days[selectedDayKey];
  const weekday = weekdayLabels[selectedDayKey];
  const dateLabel = dayKey ? `${weekday} enligt valt testläge` : today.dateLabel;
  const warnings = [
    day.heavyLegs ? "⚠️ Heavy legs idag: håll koll på total belastning." : "",
    day.intervals ? "⚡ Intervaller idag: värm upp extra noggrant och maxa inte i onödan." : ""
  ].filter(Boolean);

  const subject = `Dagens träning: ${weekday} - ${day.headline}`;
  const text = buildText({ owner: plan.owner, day, weekday, dateLabel, warnings });
  const html = buildHtml({ owner: plan.owner, day, weekday, dateLabel, warnings });

  return { subject, text, html, dayKey: selectedDayKey };
}

export async function sendTrainingEmail(payload: EmailPayload) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.TRAINING_EMAIL_TO;
  const from = process.env.TRAINING_EMAIL_FROM ?? "Training Briefing <onboarding@resend.dev>";

  if (!apiKey) {
    throw new Error("RESEND_API_KEY saknas.");
  }
  if (!to) {
    throw new Error("TRAINING_EMAIL_TO saknas.");
  }

  const email = buildTodayEmail(payload);
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

function buildText({
  owner,
  day,
  weekday,
  dateLabel,
  warnings
}: {
  owner: string;
  day: DayPlan;
  weekday: string;
  dateLabel: string;
  warnings: string[];
}) {
  return [
    `Hej ${owner}!`,
    "",
    `📅 ${dateLabel}`,
    `🎯 ${weekday}: ${day.headline}`,
    "",
    day.running ? `✅ Löpning: ${day.running}` : "",
    day.gym ? `🏋️ Gym: ${day.gym}` : "",
    day.suggestedOrder ? `🔁 Ordning: ${day.suggestedOrder}` : "",
    day.intensity ? `📈 Intensitet: ${day.intensity}` : "",
    day.recovery ? `🧘 Återhämtning: ${day.recovery}` : "",
    day.heatSun ? `☀️ Värme/sol: ${day.heatSun}` : "",
    day.surpriseExercise ? `🎁 Dagens extra övning: ${day.surpriseExercise}` : "",
    day.reminders ? `🔔 Påminnelse: ${day.reminders}` : "",
    ...warnings,
    "🌙 Undvik sen hård benträning - det kan försämra sömn och återhämtning."
  ]
    .filter(Boolean)
    .join("\n");
}

function buildHtml({
  owner,
  day,
  weekday,
  dateLabel,
  warnings
}: {
  owner: string;
  day: DayPlan;
  weekday: string;
  dateLabel: string;
  warnings: string[];
}) {
  const rows = [
    ["✅", "Löpning", day.running],
    ["🏋️", "Gym", day.gym],
    ["🔁", "Ordning", day.suggestedOrder],
    ["📈", "Intensitet", day.intensity],
    ["🧘", "Återhämtning", day.recovery],
    ["☀️", "Värme/sol", day.heatSun],
    ["🎁", "Dagens extra övning", day.surpriseExercise],
    ["🔔", "Påminnelse", day.reminders]
  ].filter(([, , value]) => value);

  return `<!doctype html>
<html lang="sv">
  <body style="margin:0;background:#f5f2ed;color:#1e2422;font-family:Arial,Helvetica,sans-serif;">
    <main style="max-width:640px;margin:0 auto;padding:28px 18px;">
      <section style="background:#ffffff;border:1px solid #ddd6cb;border-radius:8px;padding:24px;">
        <p style="margin:0 0 12px;font-size:16px;">Hej ${escapeHtml(owner)}!</p>
        <p style="margin:0;color:#66706b;font-size:14px;">📅 ${escapeHtml(dateLabel)}</p>
        <h1 style="margin:8px 0 18px;font-size:24px;line-height:1.25;">🎯 ${escapeHtml(weekday)}: ${escapeHtml(day.headline)}</h1>
        <table style="width:100%;border-collapse:collapse;">
          ${rows
            .map(
              ([icon, label, value]) => `<tr>
                <td style="width:34px;padding:10px 0;border-top:1px solid #eee5dc;vertical-align:top;font-size:20px;">${icon}</td>
                <td style="padding:10px 0;border-top:1px solid #eee5dc;vertical-align:top;">
                  <strong>${escapeHtml(label)}</strong><br />
                  <span style="color:#38423e;">${escapeHtml(value)}</span>
                </td>
              </tr>`
            )
            .join("")}
        </table>
        ${
          warnings.length
            ? `<div style="margin-top:16px;padding:12px;border-radius:8px;background:#fff2d9;border:1px solid #f2c46d;">
                ${warnings.map((warning) => `<p style="margin:4px 0;">${escapeHtml(warning)}</p>`).join("")}
              </div>`
            : ""
        }
        <p style="margin:16px 0 0;padding-top:14px;border-top:1px solid #eee5dc;">🌙 Undvik sen hård benträning - det kan försämra sömn och återhämtning.</p>
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
