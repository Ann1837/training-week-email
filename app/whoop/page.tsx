"use client";

import { Activity } from "lucide-react";
import { useState } from "react";

export default function WhoopPage() {
  const [adminSecret, setAdminSecret] = useState("");

  function startWhoopLogin() {
    const params = new URLSearchParams();

    if (adminSecret) {
      params.set("adminSecret", adminSecret);
    }

    window.location.href = `/api/whoop/start?${params.toString()}`;
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
          Logga in med WHOOP här. Efter login får du en refresh token som ska läggas in i Vercel som
          environment variable.
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

        <p className="whoop-note">
          Redirect URL i WHOOP ska vara{" "}
          <code>https://training-week-email.vercel.app/api/whoop/callback</code>.
        </p>
      </section>
    </main>
  );
}
