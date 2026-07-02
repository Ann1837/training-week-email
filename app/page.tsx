"use client";

import {
  AlertTriangle,
  CalendarDays,
  Dumbbell,
  Mail,
  RefreshCw,
  Save,
  Send,
  Sun,
  UserRound
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DayPlan, WeekdayKey, WeeklyPlan, weekdayKeys, weekdayLabels } from "@/lib/types";

const emptyPlan: WeeklyPlan = {
  owner: "Ann",
  timezone: "Europe/Stockholm",
  days: Object.fromEntries(
    weekdayKeys.map((day) => [
      day,
      {
        headline: "",
        running: "",
        gym: "",
        suggestedOrder: "",
        intensity: "",
        recovery: "",
        heatSun: "",
        reminders: "",
        heavyLegs: false,
        intervals: false
      }
    ])
  ) as WeeklyPlan["days"]
};

export default function Home() {
  const [plan, setPlan] = useState<WeeklyPlan>(emptyPlan);
  const [activeDay, setActiveDay] = useState<WeekdayKey>("monday");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [adminSecret, setAdminSecret] = useState("");

  useEffect(() => {
    setAdminSecret(window.localStorage.getItem("training-admin-secret") ?? "");
    void loadPlan();
  }, []);

  const day = plan.days[activeDay];
  const warnings = useMemo(
    () => [
      day.heavyLegs ? "Heavy legs idag: håll totalbelastningen smart." : "",
      day.intervals ? "Intervaller idag: prioritera uppvärmning och teknik." : ""
    ].filter(Boolean),
    [day.heavyLegs, day.intervals]
  );

  async function loadPlan() {
    setError("");
    const response = await fetch("/api/plan", { cache: "no-store" });
    if (!response.ok) {
      setError("Kunde inte läsa planen.");
      return;
    }
    setPlan(await response.json());
  }

  async function savePlan() {
    setBusy(true);
    setStatus("");
    setError("");
    try {
      const response = await fetch("/api/plan", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(adminSecret ? { "X-Admin-Secret": adminSecret } : {})
        },
        body: JSON.stringify(plan)
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Save failed");
      }
      if (adminSecret) {
        window.localStorage.setItem("training-admin-secret", adminSecret);
      }
      setStatus("Planen är sparad.");
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte spara planen.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function sendTestEmail() {
    setBusy(true);
    setStatus("");
    setError("");
    try {
      const saved = await savePlan();
      if (!saved) return;
      const response = await fetch("/api/send-today", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(adminSecret ? { "X-Admin-Secret": adminSecret } : {})
        },
        body: JSON.stringify({ dayKey: activeDay })
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Send failed");
      }
      setStatus(`Testmail skickat för ${weekdayLabels[activeDay].toLowerCase()}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte skicka testmail.");
    } finally {
      setBusy(false);
    }
  }

  function updateDay(field: keyof DayPlan, value: string | boolean) {
    setPlan((current) => ({
      ...current,
      days: {
        ...current.days,
        [activeDay]: {
          ...current.days[activeDay],
          [field]: value
        }
      }
    }));
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">
          <CalendarDays size={32} />
          <h1>Training Week Briefing</h1>
          <p>Dagliga mail 07:00 med bara dagens plan.</p>
        </div>
        <div className="meta">
          <div className="meta-item">
            <UserRound size={18} />
            <p>{plan.owner}</p>
          </div>
          <div className="meta-item">
            <Mail size={18} />
            <p>ann@pjano.se</p>
          </div>
          <div className="meta-item">
            <Sun size={18} />
            <p>{plan.timezone}</p>
          </div>
          <div className="meta-item">
            <Dumbbell size={18} />
            <p>Tallinn Marathon plus legs/glutes.</p>
          </div>
        </div>
      </aside>

      <section className="main">
        <div className="topbar">
          <div>
            <h2>Veckoplan</h2>
            <p>Ändra passen, spara planen och skicka ett testmail för vald dag.</p>
          </div>
          <div className="actions">
            <label className="secret-field">
              <span>Admin secret</span>
              <input
                type="password"
                value={adminSecret}
                onChange={(event) => setAdminSecret(event.target.value)}
                placeholder="ADMIN_SECRET"
              />
            </label>
            <button className="button" onClick={loadPlan} disabled={busy} title="Ladda om JSON-planen">
              <RefreshCw size={18} /> Ladda om
            </button>
            <button className="button primary" onClick={savePlan} disabled={busy} title="Spara planen">
              <Save size={18} /> Spara
            </button>
            <button className="button" onClick={sendTestEmail} disabled={busy} title="Skicka testmail">
              <Send size={18} /> Testmail
            </button>
          </div>
        </div>

        <nav className="day-tabs" aria-label="Välj dag">
          {weekdayKeys.map((key) => (
            <button
              key={key}
              className={`day-tab ${activeDay === key ? "active" : ""}`}
              onClick={() => setActiveDay(key)}
            >
              {weekdayLabels[key]}
            </button>
          ))}
        </nav>

        <div className="status" role="status">
          {status}
          {error ? <span className="error">{error}</span> : null}
        </div>

        <div className="editor">
          <section className="panel form-grid" aria-label="Redigera träningsdag">
            <TextField label="Rubrik" value={day.headline} onChange={(value) => updateDay("headline", value)} />
            <TextArea label="Löpning" value={day.running} onChange={(value) => updateDay("running", value)} />
            <TextArea label="Gym" value={day.gym} onChange={(value) => updateDay("gym", value)} />
            <div className="two-col">
              <TextArea
                label="Föreslagen ordning"
                value={day.suggestedOrder}
                onChange={(value) => updateDay("suggestedOrder", value)}
              />
              <TextArea
                label="Intensitet"
                value={day.intensity}
                onChange={(value) => updateDay("intensity", value)}
              />
            </div>
            <TextArea
              label="Återhämtning"
              value={day.recovery}
              onChange={(value) => updateDay("recovery", value)}
            />
            <div className="two-col">
              <TextArea
                label="Värme/sol"
                value={day.heatSun}
                onChange={(value) => updateDay("heatSun", value)}
              />
              <TextArea
                label="Påminnelser"
                value={day.reminders}
                onChange={(value) => updateDay("reminders", value)}
              />
            </div>
            <div className="toggle-row">
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={day.heavyLegs}
                  onChange={(event) => updateDay("heavyLegs", event.target.checked)}
                />
                <span>Tungt för ben/glutes</span>
              </label>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={day.intervals}
                  onChange={(event) => updateDay("intervals", event.target.checked)}
                />
                <span>Intervaller</span>
              </label>
            </div>
          </section>

          <aside className="panel preview" aria-label="Förhandsvisning">
            <h3>{weekdayLabels[activeDay]}: {day.headline || "Ingen rubrik ännu"}</h3>
            <div className="briefing">
              <PreviewRow icon="✅" label="Löpning" value={day.running} />
              <PreviewRow icon="🏋️" label="Gym" value={day.gym} />
              <PreviewRow icon="🔁" label="Ordning" value={day.suggestedOrder} />
              <PreviewRow icon="📈" label="Intensitet" value={day.intensity} />
              <PreviewRow icon="🧘" label="Återhämtning" value={day.recovery} />
              <PreviewRow icon="☀️" label="Värme/sol" value={day.heatSun} />
              <PreviewRow icon="🔔" label="Påminnelse" value={day.reminders} />
              {warnings.length ? (
                <div className="warning">
                  <AlertTriangle size={18} />
                  {warnings.map((warning) => (
                    <p key={warning}>{warning}</p>
                  ))}
                </div>
              ) : null}
              <div className="briefing-row">
                <span>🌙</span>
                <span>Undvik sen hård benträning - det kan försämra sömn och återhämtning.</span>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function TextField({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <input value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function PreviewRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  if (!value) return null;

  return (
    <div className="briefing-row">
      <span>{icon}</span>
      <span>
        <strong>{label}</strong>
        {value}
      </span>
    </div>
  );
}
