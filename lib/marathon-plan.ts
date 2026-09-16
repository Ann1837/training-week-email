import type { DayPlan, WeekdayKey, WeeklyPlan } from "./types";
import { weekdayKeys, weekdayLabels } from "./types";

const blockStart = new Date("2026-09-14T00:00:00+02:00");
const longRuns = [
  "Ingen lång löpning denna vecka – aktiv återhämtning efter Tallinn.",
  "10–12 km mycket lätt.",
  "14–16 km lätt.",
  "18–20 km lugnt.",
  "22–24 km lugnt med tränad energi under passet.",
  "26–28 km lugnt. Repetera tävlingsfrukost, vätska och energi exakt.",
  "12–14 km mycket lätt som nedtrappning.",
  "Höstrusket Marathon 42,2 km."
];

export function getMarathonBlockDay(dayKey: WeekdayKey, fallback: DayPlan, now = new Date()): DayPlan {
  const templates: Partial<Record<WeekdayKey, Partial<DayPlan>>> = {
    monday: {
      headline: "Glute/ben #1 + överkropp #1",
      running: "Valfritt 4–6 km mycket lätt för cirkulation och sömn.",
      gym: "Glute/hypertrofi med hip thrust, kickback, abduction och leg curl. Kombinera med överkropp #1.",
      intensity: "Medel. Lämna marginal inför tisdagens 4×4.",
      heavyLegs: true,
      intervals: false
    },
    tuesday: {
      headline: "4×4 VO₂max #1",
      running: "2 km uppvärmning, 4×4 min hårt med 3 min aktiv vila, därefter nedjogg.",
      gym: "Ingen tung benstyrka. Kort rörlighet eller core går bra.",
      intensity: "Veckans primära VO₂-pass. Hårt men kontrollerat.",
      heavyLegs: false,
      intervals: true
    },
    wednesday: {
      headline: "Tungt ben/glute + överkropp #2",
      running: "Ingen löpning krävs; en mycket lätt kort jogg är valfri om den hjälper sömnen.",
      gym: "Tung hip thrust, squat/leg press, leg curl, leg extension och abduction. Kombinera med överkropp #2.",
      intensity: "Veckans tyngsta styrkepass, med god teknik och utan failure.",
      heavyLegs: true,
      intervals: false
    },
    thursday: {
      headline: "Lätt löpning + valfri lugn cykel",
      running: "5–7 km mycket lätt i prattempo.",
      gym: "Valfritt 45–60 min lätt cykel eller kort rörlighet.",
      intensity: "Låg – detta är återhämtning genom rörelse.",
      heavyLegs: false,
      intervals: false
    },
    friday: {
      headline: "Kontrollerat 4×4 #2 + överkropp #3",
      running: "4×4 med något lägre fart än tisdagens huvudpass. Korta till 3×4 när belastningen är hög.",
      gym: "Överkropp #3, gärna efter löpningen eller separat.",
      intensity: "Hög men kontrollerad; jaga inte tisdagens siffror.",
      heavyLegs: false,
      intervals: true
    },
    saturday: {
      headline: "Kort glute/ben #3 + lätt löpning",
      running: "4–5 km mycket lätt om benen känns bra.",
      gym: "30–40 min glute/komplettering: kickback, abduction, back extension, leg curl/extension och lätt hip thrust.",
      intensity: "Låg till medel. Passet får inte sabotera långpasset.",
      heavyLegs: true,
      intervals: false
    },
    sunday: {
      headline: "Veckans långpass",
      running: longRuns[getBlockWeek(now)] ?? "Långpass enligt aktuell veckoplan.",
      gym: "Ingen tung benstyrka. Kort överkropp eller rörlighet är valfritt.",
      intensity: "Lugn uthållighet. Energiintag och ett jämnt genomförande är viktigare än fart.",
      heavyLegs: false,
      intervals: false
    }
  };

  return { ...fallback, ...templates[dayKey] };
}

export function getNextWeekOverview(plan: WeeklyPlan, now = new Date()) {
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  return weekdayKeys.map((dayKey) => {
    const day = getMarathonBlockDay(dayKey, plan.days[dayKey], nextWeek);
    return `${weekdayLabels[dayKey]}: ${day.headline}${dayKey === "sunday" ? ` – ${day.running}` : ""}`;
  });
}

function getBlockWeek(now: Date) {
  const elapsed = now.getTime() - blockStart.getTime();
  return Math.max(0, Math.min(longRuns.length - 1, Math.floor(elapsed / (7 * 24 * 60 * 60 * 1000))));
}
  
