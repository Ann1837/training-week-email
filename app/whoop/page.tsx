"use client";

import { Activity } from "lucide-react";
import { useEffect, useState } from "react";

type LatestData = {
  recovery: { updated_at: string; score_state: string; score?: { recovery_score: number; resting_heart_rate: number; hrv_rmssd_milli: number; spo2_percentage?: number } } | null;
  sleep: { start: string; end: string; score_state: string; score?: { stage_summary: { total_in_bed_time_milli: number; total_awake_time_milli: number }; sleep_performance_percentage: number; sleep_efficiency_percentage: number; respiratory_rate: number } } | null;
  workout: { start: string; end: string; sport_name: string; score_state: string; score?: { strain: number; average_heart_rate: number; max_heart_rate: number; distance_meter?: number } } | null;
  yesterdayWorkouts: Array<{ start: string; end: string; sport_name: string; score_state: string; score?: { strain: number; average_heart_rate: number; max_heart_rate: number; distance_meter?: number } }>;
  recommendation: {
    level: "green" | "yellow" | "red" | "unknown";
    title: string;
    training: string;
    reason: string;
    yesterdaySummary: string;
  };
  fetchedAt: string;
};

export default function WhoopPage() {
  const [adminSecret, setAdminSecret] = useState("");
  const [message, setMessage] = useState("");
  const [latest, setLatest] = useState<LatestData | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected") === "1") setMessage("✓ WHOOP connected");
    if (params.get("error")) setMessage(params.get("error") ?? "WHOOP-kopplingen misslyckades.");
  }, []);

  function startWhoopLogin() {
    const params = new URLSearchParams();

    if (adminSecret) {
      params.set("adminSecret", adminSecret);
    }

    window.location.href = `/api/whoop/login?${params.toString()}`;
  }

  async function checkStatus() {
    setMessage("Kontrollerar …");
    const response = await fetch(`/api/whoop/status?adminSecret=${encodeURIComponent(adminSecret)}`);
    const data = (await response.json()) as { connected?: boolean; error?: string };
    setMessage(
      response.ok
        ? data.connected
          ? "✓ WHOOP connected"
          : "WHOOP not connected"
        : data.error === "Unauthorized"
          ? "Fel admin secret."
          : data.error ?? "Statuskontrollen misslyckades."
    );
  }

  async function loadLatestData() {
    setMessage("Hämtar WHOOP-data …");
    setLatest(null);
    const response = await fetch("/api/whoop/latest", {
      headers: { "x-admin-secret": adminSecret }
    });
    const result = (await response.json()) as { data?: LatestData; error?: string };

    if (!response.ok || !result.data) {
      setMessage(result.error === "Unauthorized" ? "Fel admin secret." : result.error ?? "WHOOP-hämtningen misslyckades.");
      return;
    }

    setLatest(result.data);
    setMessage("WHOOP-data hämtad.");
  }

  return (
    <main className="privacy-page">
      <section className="privacy-card">
        <p className="privacy-kicker">Training Week Briefing</p>
        <h1 className="whoop-title">
          <Activity size={30} />
          WHOOP-koppling
        </h1>
        <p>
          Logga in med WHOOP här. Efter login sparas anslutningen krypterat så att appen kan använda
          den senare utan att du behöver logga in igen.
        </p>

        <label className="secret-field whoop-secret">
          <span>Admin secret</span>
          <input
            type="password"
            value={adminSecret}
            onChange={(event) => setAdminSecret(event.target.value)}
            placeholder="ADMIN_SECRET"
          />
        </label>

        <button className="button primary whoop-button" onClick={startWhoopLogin}>
          Starta WHOOP-login
        </button>

        <button className="button whoop-button" onClick={checkStatus}>
          Kontrollera anslutning
        </button>

        <button className="button whoop-button" onClick={loadLatestData}>
          Hämta senaste WHOOP-data
        </button>

        {message ? <p className="whoop-note" role="status">{message}</p> : null}

        {latest ? <WhoopLatest data={latest} /> : null}

        <p className="whoop-note">
          Redirect URL i WHOOP ska vara{" "}
          <code>https://training-week-email.vercel.app/api/whoop/callback</code>.
        </p>
      </section>
    </main>
  );
}

function WhoopLatest({ data }: { data: LatestData }) {
  const recovery = data.recovery?.score;
  const sleep = data.sleep?.score;
  const workout = data.workout;
  const sleepMillis = sleep
    ? sleep.stage_summary.total_in_bed_time_milli - sleep.stage_summary.total_awake_time_milli
    : null;

  return (
    <section className="whoop-results">
      <h2>Senaste WHOOP-data</h2>
      <article className={`whoop-recommendation ${data.recommendation.level}`}>
        <h3>Dagens rekommendation</h3>
        <p><strong>{data.recommendation.title}</strong></p>
        <p>{data.recommendation.training}</p>
        <p className="whoop-detail">{data.recommendation.reason}</p>
      </article>
      <article>
        <h3>Recovery</h3>
        {recovery ? (
          <p>{recovery.recovery_score}% · Vilopuls {recovery.resting_heart_rate} bpm · HRV {Math.round(recovery.hrv_rmssd_milli)} ms{recovery.spo2_percentage ? ` · SpO₂ ${recovery.spo2_percentage.toFixed(1)}%` : ""}</p>
        ) : <p>Ingen färdig recovery hittades.</p>}
      </article>
      <article>
        <h3>Sömn</h3>
        {sleep && sleepMillis !== null ? (
          <p>{formatDuration(sleepMillis)} sömn · Performance {sleep.sleep_performance_percentage}% · Effektivitet {Math.round(sleep.sleep_efficiency_percentage)}% · Andning {sleep.respiratory_rate.toFixed(1)}/min</p>
        ) : <p>Ingen färdig sömn hittades.</p>}
      </article>
      <article>
        <h3>Gårdagens aktiviteter</h3>
        <p>{data.recommendation.yesterdaySummary}</p>
      </article>
      <article>
        <h3>Senaste registrerade aktivitet</h3>
        {workout?.score ? <p>{formatWorkout(workout)}</p> : <p>Ingen färdig workout hittades.</p>}
      </article>
    </section>
  );
}

function formatWorkout(workout: LatestData["workout"] extends infer T ? Exclude<T, null> : never) {
  if (!workout.score) return workout.sport_name;
  return `${workout.sport_name} · ${formatDuration(new Date(workout.end).getTime() - new Date(workout.start).getTime())} · Strain ${workout.score.strain.toFixed(1)} · Puls ${workout.score.average_heart_rate}/${workout.score.max_heart_rate} bpm${workout.score.distance_meter ? ` · ${(workout.score.distance_meter / 1000).toFixed(2)} km` : ""}`;
}

function formatDuration(milliseconds: number) {
  const totalMinutes = Math.max(0, Math.round(milliseconds / 60000));
  return `${Math.floor(totalMinutes / 60)} h ${totalMinutes % 60} min`;
}
  
