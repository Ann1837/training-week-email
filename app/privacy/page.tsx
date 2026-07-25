export const metadata = {
  title: "Privacy Policy | Training Week Briefing",
  description: "Privacy policy for Ann's private training email automation."
};

export default function PrivacyPage() {
  return (
    <main className="privacy-page">
      <section className="privacy-card">
        <p className="privacy-kicker">Training Week Briefing</p>
        <h1>Privacy Policy</h1>
        <p className="privacy-updated">Last updated: 25 July 2026</p>

        <p>
          Training Week Briefing is a private training assistant for Ann. It is used to help plan
          training, recovery, and related email briefings.
        </p>

        <h2>Information Used</h2>
        <p>
          If the app is connected to WHOOP, it may access recovery, sleep, strain, workout, and
          profile data that Ann authorizes through the WHOOP OAuth flow.
        </p>

        <h2>How Information Is Used</h2>
        <p>
          The data is used only to support personal training planning, recovery guidance, and email
          summaries. It is not used for advertising, profiling, or resale.
        </p>

        <h2>Sharing</h2>
        <p>
          Personal data is not sold. Data is only processed through the technical services needed to
          run the app, such as hosting and email delivery.
        </p>

        <h2>Storage</h2>
        <p>
          The app is designed for low-volume personal use. Any stored training plan or app
          configuration is kept only for the purpose of running the training email automation.
        </p>

        <h2>Revoking Access</h2>
        <p>
          WHOOP access can be revoked at any time from the WHOOP account or developer settings. The
          app can also be disabled by removing environment variables, cron jobs, or deployment
          access.
        </p>

        <h2>Contact</h2>
        <p>
          For questions about this privacy policy, contact{" "}
          <a href="mailto:ann@pjano.se">ann@pjano.se</a>.
        </p>
      </section>
    </main>
  );
}
