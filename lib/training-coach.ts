import type { DayPlan } from "./types";
import type { WhoopRecovery, WhoopSleep, WhoopWorkout } from "./whoop-data";

export type DailyRecommendation = {
  level: "green" | "yellow" | "red" | "unknown";
  title: string;
  training: string;
  reason: string;
  yesterdaySummary: string;
  originalPlan: string;
  wasAdjusted: boolean;
};

type CoachInput = {
  planned: DayPlan;
  recovery: WhoopRecovery | null;
  sleep: WhoopSleep | null;
  yesterdayWorkouts: WhoopWorkout[];
};

export function buildDailyRecommendation({ planned, recovery, sleep, yesterdayWorkouts }: CoachInput): DailyRecommendation {
  const recoveryScore = recovery?.score?.recovery_score;
  const sleepPerformance = sleep?.score?.sleep_performance_percentage;
  const yesterdayStrain = yesterdayWorkouts.reduce((sum, workout) => sum + (workout.score?.strain ?? 0), 0);
  const yesterdaySummary = summarizeWorkouts(yesterdayWorkouts);
  const originalPlan = summarizePlan(planned);
  const isMandatoryRest = /HELT TRÄNINGSFRI|resdag/i.test(originalPlan);
  const hasNoRunningConstraint = /INGEN löpning/i.test(planned.running);

  if (isMandatoryRest) {
    return {
      level: recoveryScore !== undefined && recoveryScore < 34 ? "red" : recoveryScore !== undefined && recoveryScore < 67 ? "yellow" : "green",
      title: "Fast begränsning – resdag och träningsfritt",
      training: originalPlan,
      reason: "Masterplanens resdag gäller oavsett WHOOP-färg.",
      yesterdaySummary,
      originalPlan,
      wasAdjusted: false
    };
  }

  if (recoveryScore === undefined) {
    return {
      level: "unknown",
      title: "Följ grundplanen och känn efter",
      training: `${planned.running}${planned.gym ? ` ${planned.gym}` : ""}`,
      reason: "WHOOP har ännu ingen färdig recovery för idag.",
      yesterdaySummary
      ,originalPlan
      ,wasAdjusted: false
    };
  }

  if (recoveryScore >= 67 && (sleepPerformance === undefined || sleepPerformance >= 70)) {
    return {
      level: "green",
      title: "Grönt ljus – genomför dagens plan",
      training: `${planned.running}${planned.gym ? ` ${planned.gym}` : ""}`,
      reason: `Recovery ${Math.round(recoveryScore)} %${sleepPerformance !== undefined ? ` och sömn ${Math.round(sleepPerformance)} %` : ""}.`,
      yesterdaySummary
      ,originalPlan
      ,wasAdjusted: false
    };
  }

  if (recoveryScore >= 34) {
    return {
      level: "yellow",
      title: "Gult ljus – träna, men sänk belastningen",
      training: planned.intervals
        ? "Byt 4×4 mot 30–45 min mycket lätt löpning eller cykel. Behåll överkropp eller lätt gluteaktivering om kroppen känns bra."
        : planned.heavyLegs
          ? "Gör dagens löpning lugnt och korta benpasset till lätt glute/teknik med god marginal."
          : `Genomför en nedkortad, lugn version: ${planned.running || planned.gym}`,
      reason: `Recovery ${Math.round(recoveryScore)} %${yesterdayStrain >= 15 ? ` efter hög registrerad belastning igår (${yesterdayStrain.toFixed(1)})` : ""}.`,
      yesterdaySummary
      ,originalPlan
      ,wasAdjusted: true
    };
  }

  return {
    level: "red",
    title: "Rött ljus – aktiv återhämtning, inte bara promenad",
    training: hasNoRunningConstraint
      ? "Behåll löpförbudet. Korta upper body till ett lätt pass och välj högst 10–15 min lätt rörlighet/gluteaktivering. Vid sjukdomssymtom eller smärta: avstå."
      : "Välj 20–30 min mycket lätt jogg eller cykel samt 10–15 min rörlighet/core. Om du har sjukdomssymtom, skarp smärta eller tydlig skadekänning: avstå träningen.",
    reason: `Recovery ${Math.round(recoveryScore)} %. Hårda intervaller och tungt ben flyttas till en bättre dag.`,
    yesterdaySummary
    ,originalPlan
    ,wasAdjusted: true
  };
}

function summarizePlan(planned: DayPlan) {
  return [planned.running, planned.gym].filter(Boolean).join(" ");
}

function summarizeWorkouts(workouts: WhoopWorkout[]) {
  if (workouts.length === 0) return "WHOOP registrerade ingen aktivitet igår.";

  return workouts
    .map((workout) => {
      const minutes = Math.max(0, Math.round((new Date(workout.end).getTime() - new Date(workout.start).getTime()) / 60000));
      const distance = workout.score?.distance_meter
        ? `, ${(workout.score.distance_meter / 1000).toFixed(1)} km`
        : "";
      const strain = workout.score ? `, strain ${workout.score.strain.toFixed(1)}` : "";
      return `${workout.sport_name} ${minutes} min${distance}${strain}`;
    })
    .join(" · ");
}
  
