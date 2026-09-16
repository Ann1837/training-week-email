"use client";

import { Activity } from "lucide-react";
import { useEffect, useState } from "react";

export default function WhoopPage() {
  const [adminSecret, setAdminSecret] = useState("");
  const [message, setMessage] = useState("");

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

        {message ? <p className="whoop-note" role="status">{message}</p> : null}

        <p className="whoop-note">
          Redirect URL i WHOOP ska vara{" "}
          <code>https://training-week-email.vercel.app/api/whoop/callback</code>.
        </p>
      </section>
    </main>
  );
}
