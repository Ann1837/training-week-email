import { WeekdayKey } from "./types";

const weekdayByIndex: WeekdayKey[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday"
];

export function getTodayInTimezone(timezone: string, now = new Date()) {
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: timezone,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short"
  }).formatToParts(now);
  const weekdayShort = parts.find((part) => part.type === "weekday")?.value;
  const lookup: Record<string, WeekdayKey> = {
    Sun: "sunday",
    Mon: "monday",
    Tue: "tuesday",
    Wed: "wednesday",
    Thu: "thursday",
    Fri: "friday",
    Sat: "saturday"
  };

  return {
    dateLabel: formatter.format(now),
    weekdayKey: lookup[weekdayShort ?? ""] ?? weekdayByIndex[now.getUTCDay()]
  };
}

export function getHourInTimezone(timezone: string, now = new Date()) {
  const hour = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    hour12: false
  }).format(now);

  return Number(hour);
}
