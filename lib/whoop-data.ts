import { getWhoopConfig, type WhoopTokenResponse } from "@/lib/whoop";
import { getWhoopRefreshToken, saveWhoopRefreshToken } from "@/lib/whoop-token-store";

type Collection<T> = { records: T[]; next_token?: string };

export type WhoopRecovery = {
  cycle_id: number;
  sleep_id: string;
  created_at: string;
  updated_at: string;
  score_state: string;
  score?: {
    user_calibrating: boolean;
    recovery_score: number;
    resting_heart_rate: number;
    hrv_rmssd_milli: number;
    spo2_percentage?: number;
    skin_temp_celsius?: number;
  };
};

export type WhoopSleep = {
  id: string;
  cycle_id: number;
  start: string;
  end: string;
  timezone_offset: string;
  nap: boolean;
  score_state: string;
  score?: {
    stage_summary: {
      total_in_bed_time_milli: number;
      total_awake_time_milli: number;
      total_no_data_time_milli: number;
      total_light_sleep_time_milli: number;
      total_slow_wave_sleep_time_milli: number;
      total_rem_sleep_time_milli: number;
      sleep_cycle_count: number;
      disturbance_count: number;
    };
    sleep_needed: {
      baseline_milli: number;
      need_from_sleep_debt_milli: number;
      need_from_recent_strain_milli: number;
      need_from_recent_nap_milli: number;
    };
    respiratory_rate: number;
    sleep_performance_percentage: number;
    sleep_consistency_percentage: number;
    sleep_efficiency_percentage: number;
  };
};

export type WhoopWorkout = {
  id: string;
  start: string;
  end: string;
  timezone_offset: string;
  sport_name: string;
  sport_id: number;
  score_state: string;
  score?: {
    strain: number;
    average_heart_rate: number;
    max_heart_rate: number;
    kilojoule: number;
    percent_recorded: number;
    distance_meter?: number;
    altitude_gain_meter?: number;
  };
};

async function refreshWhoopAccessToken(requestUrl: string) {
  const config = getWhoopConfig(requestUrl);
  const refreshToken = await getWhoopRefreshToken();

  if (!refreshToken) throw new Error("WHOOP är inte anslutet.");
  if (!config.clientId || !config.clientSecret) throw new Error("WHOOP-konfigurationen är ofullständig.");

  const response = await fetch(new URL("/oauth/oauth2/token", config.apiHostname), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      scope: "offline"
    }),
    cache: "no-store"
  });

  const token = (await response.json().catch(() => null)) as WhoopTokenResponse | { error?: string } | null;
  if (!response.ok || !token || !("access_token" in token)) {
    const detail = token && "error" in token ? token.error : response.statusText;
    throw new Error(`Kunde inte förnya WHOOP-token: ${detail ?? "okänt fel"}`);
  }

  if (token.refresh_token) await saveWhoopRefreshToken(token.refresh_token);
  return token.access_token;
}

async function getCollection<T>(requestUrl: string, accessToken: string, path: string, limit: number) {
  const config = getWhoopConfig(requestUrl);
  const url = new URL(path, config.apiHostname);
  url.searchParams.set("limit", String(limit));

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store"
  });
  const data = (await response.json().catch(() => null)) as Collection<T> | { message?: string } | null;

  if (!response.ok || !data || !("records" in data)) {
    const detail = data && "message" in data ? data.message : response.statusText;
    throw new Error(`WHOOP-anropet ${path} misslyckades: ${detail ?? "okänt fel"}`);
  }

  return data.records;
}

export async function getLatestWhoopData(requestUrl: string) {
  const accessToken = await refreshWhoopAccessToken(requestUrl);
  const [recoveries, sleeps, workouts] = await Promise.all([
    getCollection<WhoopRecovery>(requestUrl, accessToken, "/developer/v2/recovery", 1),
    getCollection<WhoopSleep>(requestUrl, accessToken, "/developer/v2/activity/sleep", 10),
    getCollection<WhoopWorkout>(requestUrl, accessToken, "/developer/v2/activity/workout", 25)
  ]);

  const yesterdayWorkouts = workouts.filter((workout) =>
    isOnRelativeLocalDay(workout.start, "Europe/Stockholm", -1)
  );

  return {
    recovery: recoveries[0] ?? null,
    sleep: sleeps.find((sleep) => !sleep.nap) ?? sleeps[0] ?? null,
    workout: workouts[0] ?? null,
    yesterdayWorkouts,
    fetchedAt: new Date().toISOString()
  };
}

function isOnRelativeLocalDay(isoDate: string, timezone: string, dayOffset: number) {
  const target = new Date();
  target.setUTCDate(target.getUTCDate() + dayOffset);
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  return formatter.format(new Date(isoDate)) === formatter.format(target);
}
  
