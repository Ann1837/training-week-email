import { promises as fs } from "fs";
import path from "path";
import { WeeklyPlan, weekdayKeys } from "./types";

const planPath = path.join(process.cwd(), "data", "weekly-plan.json");

export async function readWeeklyPlan(): Promise<WeeklyPlan> {
  const raw = await fs.readFile(planPath, "utf8");
  return JSON.parse(raw) as WeeklyPlan;
}

export async function writeWeeklyPlan(plan: WeeklyPlan) {
  validatePlan(plan);
  await fs.mkdir(path.dirname(planPath), { recursive: true });
  await fs.writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`, "utf8");
}

function validatePlan(plan: WeeklyPlan) {
  if (!plan.owner || !plan.timezone || !plan.days) {
    throw new Error("Planen saknar owner, timezone eller days.");
  }

  for (const day of weekdayKeys) {
    if (!plan.days[day]) {
      throw new Error(`Planen saknar ${day}.`);
    }
  }
}
