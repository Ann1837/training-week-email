export type WeekdayKey =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type DayPlan = {
  headline: string;
  running: string;
  gym: string;
  suggestedOrder: string;
  intensity: string;
  recovery: string;
  heatSun: string;
  reminders: string;
  surpriseExercise: string;
  heavyLegs: boolean;
  intervals: boolean;
};

export type WeeklyPlan = {
  owner: string;
  timezone: string;
  days: Record<WeekdayKey, DayPlan>;
};

export const weekdayKeys: WeekdayKey[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday"
];

export const weekdayLabels: Record<WeekdayKey, string> = {
  monday: "Måndag",
  tuesday: "Tisdag",
  wednesday: "Onsdag",
  thursday: "Torsdag",
  friday: "Fredag",
  saturday: "Lördag",
  sunday: "Söndag"
};
