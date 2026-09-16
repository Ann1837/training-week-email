import type { DayPlan, WeekdayKey, WeeklyPlan } from "./types";
import { weekdayKeys, weekdayLabels } from "./types";

type MasterDay = Pick<DayPlan, "headline" | "running" | "gym" | "intensity" | "heavyLegs" | "intervals">;

const explosive = "Explosivitet först efter uppvärmning: pogo hops 2×10 och box jumps 3×3 (alternativt kontrollerade countermovement jumps 3×3). Full vila mellan set; avbryt om hopphöjd eller landningskontroll försämras.";

const plan: Record<string, MasterDay> = {
  "2026-09-16": day("Upper body #1 + valfri lätt Glute C", "INGEN löpning på grund av fransar.", "Upper body #1. Eventuellt mycket lätt glute C: hip thrust 3×10–15, kickback 2–3×12–15 och abduction 3×15–25.", "Lätt återstart efter Tallinn.", false),
  "2026-09-17": day("5 km lugnt + lätt/medel Glute B", "5 km mycket lugnt.", "Glute B lätt/medel: hip thrust, kickback, glute-biased back extension, abduction och leg curl. Ingen tung styrka ännu.", "Låg till medel.", true),
  "2026-09-18": day("Lugn löpning + Upper #2", "5–6 km lugnt.", "Upper body #2.", "Låg löpintensitet.", false),
  "2026-09-19": day("Glute B/C + valfri recoveryjogg", "Eventuellt 3–4 km mycket lugnt.", "Glute B/C, fortfarande inte riktigt tungt.", "Lätt till medel.", true),
  "2026-09-20": day("Återhämtningslångpass", "8–10 km lugnt. Ingen fartträning.", "Ingen tung benstyrka.", "Mycket lugnt.", false),
  "2026-09-21": day("Resdag – träningsfri", "INGEN löpning.", "HELT TRÄNINGSFRI resdag.", "Vila.", false),
  "2026-09-22": day("5 km lugnt + Upper #3", "5 km lugnt.", "Upper body #3.", "Låg.", false),
  "2026-09-23": intervals("4×4 #1", "4×4 med lugn uppvärmning och nedjogg."),
  "2026-09-24": strength("Explosivitet + Ben/glute A tungt + Upper #1", `${explosive} Därefter Ben/glute A: hip thrust 4×6–8, squat/leg press 3–4×6–10, leg curl 3×8–12, leg extension 3×8–12, abduction 3×12–20. Upper #1.`),
  "2026-09-25": easy("5–6 km lugnt"),
  "2026-09-26": day("Glute B + Upper #2", "Ingen löpning krävs.", "Glute B hypertrofi + Upper #2.", "Medel.", true),
  "2026-09-27": longRun("12–14 km + fuelingtest", "12–14 km lugnt. Träna cirka 30–40 g kolhydrater/timme."),
  "2026-09-28": day("Recovery + Glute C + Upper #3", "4–5 km recovery.", "Glute C mini 20–30 min + Upper #3.", "Låg.", true),
  "2026-09-29": intervals("4×4 #2", "4×4, veckans andra och mer kontrollerade VO₂-pass."),
  "2026-09-30": strength("Explosivitet + Ben/glute A tungt + Upper #1", `${explosive} Därefter Ben/glute A tungt + Upper #1.`),
  "2026-10-01": day("Lugn löpning + crawlteknik", "5–7 km lugnt.", "Crawlteknik 20–40 min med många pauser.", "Låg.", false),
  "2026-10-02": intervals("4×4 #1 + Upper #2", "4×4 med uppvärmning/nedjogg. Upper #2 och eventuellt lätt crawl."),
  "2026-10-03": longRun("16 km + fueling", "16 km lugnt. Cirka 40–50 g kolhydrater/timme; registrera intag, vätska, mage, energi och benkänsla."),
  "2026-10-04": day("Resdag – träningsfri", "INGEN löpning.", "HELT TRÄNINGSFRI resdag.", "Vila.", false),
  "2026-10-05": day("Glute B + Upper #3 + crawl", "Ingen löpning krävs.", "Glute B, Upper #3 och lätt crawlteknik.", "Medel.", true),
  "2026-10-06": day("Lugn löpning + Glute C + crawl", "4–5 km lugnt.", "Glute C mini + lätt crawlteknik.", "Låg till medel.", true),
  "2026-10-07": intervals("4×4 #1 + Upper #1", "4×4 med uppvärmning/nedjogg + Upper #1."),
  "2026-10-08": strength("Explosivitet + Ben/glute A tungt + crawl", `${explosive} Därefter Ben/glute A tungt + lätt crawlteknik.`),
  "2026-10-09": day("Lugn löpning + Upper #2 + crawl", "5–6 km lugnt.", "Upper #2 + lätt crawlteknik.", "Låg till medel.", false),
  "2026-10-10": day("Glute B + valfri recoveryjogg", "Eventuellt 3–4 km mycket lugnt.", "Glute B hypertrofi.", "Medel.", true),
  "2026-10-11": longRun("20 km + fueling", "20 km lugnt. Cirka 50 g kolhydrater/timme; upp mot 55–60 endast om tidigare test var problemfritt."),
  "2026-10-12": day("Recovery + Upper #3 + Glute C", "4–5 km recovery.", "Upper #3 + Glute C mini, eventuellt lätt crawl.", "Låg.", true),
  "2026-10-13": intervals("4×4 #2", "Kontrollerat 4×4."),
  "2026-10-14": strength("Explosivitet + Ben/glute A tungt + Upper #1", `${explosive} Därefter Ben/glute A tungt + Upper #1.`),
  "2026-10-15": easy("5–7 km lugnt"),
  "2026-10-16": intervals("4×4 #1 + Upper #2", "4×4 + Upper #2."),
  "2026-10-17": day("Glute B + valfri recoveryjogg", "Eventuellt en kort, mycket lugn recoveryjogg.", "Glute B hypertrofi.", "Medel.", true),
  "2026-10-18": longRun("24 km + fueling", "24 km lugnt. Cirka 50–60 g kolhydrater/timme; börja tidigt och kontinuerligt."),
  "2026-10-19": day("Recovery + Upper #3 + Glute C", "4–5 km recovery.", "Upper #3 + Glute C mini.", "Låg.", true),
  "2026-10-20": intervals("4×4 #2", "Kontrollerat 4×4."),
  "2026-10-21": strength("Explosivitet + Ben/glute A tungt + Upper #1", `${explosive} Därefter Ben/glute A tungt + Upper #1.`),
  "2026-10-22": easy("5–6 km lugnt"),
  "2026-10-23": intervals("4×4 #1 + Upper #2", "4×4 + Upper #2."),
  "2026-10-24": day("Mycket lätt Glute C eller Upper #3", "Ingen löpning krävs.", "Glute C MYCKET lätt eller endast Upper #3. Inget som sliter på benen.", "Låg.", false),
  "2026-10-25": longRun("26–28 km generalrepetition", "26–28 km lugnt. Repetera middag, frukost, kaffe, starttid, kläder, vätska och cirka 55–60 g kolhydrater/timme om progressionen fungerat."),
  "2026-10-26": easy("3–5 km extremt lugn recovery om kroppen mår bra av det"),
  "2026-10-27": intervals("3×4 kontrollerat eller lugn löpning", "3×4 min kontrollerat om återhämtad, annars lugn löpning."),
  "2026-10-28": day("Lätt explosivitet + Ben/glute A medel + Upper #1", "Ingen löpning krävs.", "Lätt explosivitet: pogo hops 2×8 och box jumps 2×3 med full vila. Därefter Ben/glute A på medelnivå, inte failure, + Upper #1.", "Medel; låg hoppvolym eftersom benen ska börja bli fräscha.", true),
  "2026-10-29": easy("5–6 km lugnt"),
  "2026-10-30": intervals("Sista riktiga 4×4 + Upper #2", "Sista riktiga 4×4-passet + Upper #2."),
  "2026-10-31": day("Glute B lätt/medel", "Ingen löpning krävs.", "Glute B med låg volym.", "Lätt till medel.", true),
  "2026-11-01": longRun("12–14 km bekvämt + racefueling", "12–14 km mycket bekvämt. Använd planerad racefueling."),
  "2026-11-02": day("Recovery + Upper #3", "4–5 km recovery.", "Upper #3.", "Låg.", false),
  "2026-11-03": day("Lugn löpning + strides", "4–5 km lugnt, eventuellt 4–6 korta strides.", "Ingen tung benstyrka.", "Låg.", false),
  "2026-11-04": day("Lugn löpning + strides", "5 km lugnt + 4–6×cirka 20 sek strides.", "Ingen benstyrka.", "Låg.", false),
  "2026-11-05": day("Lätt upper + valfri superlugn jogg", "Eventuellt 3 km mycket lugnt.", "Upper lätt. INGEN benstyrka.", "Låg.", false),
  "2026-11-06": day("Kort superlugn jogg eller vila", "2–3 km superlugnt om kroppen mår bra av det; annars promenad/vila.", "Ingen styrka.", "Mycket låg.", false),
  "2026-11-07": longRun("Höstrusket Marathon", "HÖSTRUSKET MARATHON 42,195 km. Genomför den fuelingstrategi som fungerat bäst i träningen.")
};

export function getMarathonBlockDay(_dayKey: WeekdayKey, fallback: DayPlan, now = new Date()): DayPlan {
  return { ...fallback, ...(plan[dateKey(now)] ?? {}) };
}

export function getNextWeekOverview(weeklyPlan: WeeklyPlan, now = new Date()) {
  const weekdayName = new Intl.DateTimeFormat("en-US", { timeZone: weeklyPlan.timezone, weekday: "short" }).format(now);
  const weekdayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekdayName);
  const nextMonday = new Date(now);
  nextMonday.setDate(nextMonday.getDate() + ((8 - weekdayIndex) % 7 || 7));

  return weekdayKeys.map((dayKey, index) => {
    const date = new Date(nextMonday);
    date.setDate(nextMonday.getDate() + index);
    const master = getMarathonBlockDay(dayKey, weeklyPlan.days[dayKey], date);
    return `${weekdayLabels[dayKey]}: ${master.headline} – ${master.running}`;
  });
}

export function getCurrentMasterPlanWeek(weeklyPlan: WeeklyPlan, now = new Date()): WeeklyPlan {
  const weekdayName = new Intl.DateTimeFormat("en-US", { timeZone: weeklyPlan.timezone, weekday: "short" }).format(now);
  const weekdayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekdayName);
  const monday = new Date(`${dateKey(now)}T12:00:00Z`);
  monday.setUTCDate(monday.getUTCDate() - ((weekdayIndex + 6) % 7));

  const days = { ...weeklyPlan.days };
  weekdayKeys.forEach((dayKey, index) => {
    const date = new Date(monday);
    date.setUTCDate(monday.getUTCDate() + index);
    days[dayKey] = getMarathonBlockDay(dayKey, weeklyPlan.days[dayKey], date);
  });

  return { ...weeklyPlan, days };
}

function dateKey(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Stockholm", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function day(headline: string, running: string, gym: string, intensity: string, heavyLegs: boolean, intervals = false): MasterDay {
  return { headline, running, gym, intensity, heavyLegs, intervals };
}

function easy(headline: string): MasterDay {
  return day(headline, `${headline}.`, "Ingen tung benstyrka.", "Låg.", false);
}

function intervals(headline: string, details: string): MasterDay {
  return day(headline, details, details.includes("Upper") ? "Upper body enligt rubriken." : "Ingen tung benstyrka.", "Hög men kontrollerad VO₂-belastning.", false, true);
}

function strength(headline: string, gym: string): MasterDay {
  return day(headline, "Ingen löpning krävs; mycket lätt jogg är valfri endast om den hjälper återhämtningen.", gym, "Veckans tyngsta styrkepass, utan failure.", true);
}

function longRun(headline: string, running: string): MasterDay {
  return day(headline, running, "Ingen tung benstyrka.", "Lugn uthållighet; jämnt genomförande och fueling prioriteras före fart.", false);
}
  
