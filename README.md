# Training Week Email Automation

A small Next.js app for Ann's weekly training plan. It stores the week as JSON, lets you edit each day in an admin page, and sends a Swedish daily training briefing email.

This version is designed to run on free-tier services:

- Vercel Hobby
- Low-frequency Vercel cron jobs only
- Resend free tier
- No paid database, paid storage, paid analytics, or paid Vercel add-ons required
- No OpenAI API key or OpenAI API usage

## What It Does

- Edit the weekly training plan at `/`
- Store the plan in `data/weekly-plan.json`
- Send only today's plan by email
- Send a manual test email from the admin page
- Include a unique daily surprise exercise that fits the day's workout
- Expose a real scheduled email endpoint at `/api/cron`
- Send a Sunday evening Bryan Johnson weekly digest from open public sources
- Send Hanna one upcoming marathon-plan week every Sunday at 16:00
- Include Vercel Hobby-compatible cron jobs for the daily training email and weekly Sunday emails
- Use `Europe/Stockholm` as the training timezone

## Daily Surprise Exercise

Each day can include a `surpriseExercise` field. This is shown in the daily email as "Dagens extra övning".

To keep the project free-tier only, the app does not call an AI API, OpenAI, GLM, DuckDuckGo, or any external search service every morning. Instead, the surprise exercises are curated into `data/weekly-plan.json` when the weekly plan is updated. That gives the email a personal touch without API keys, live web requests, rate limits, or surprise costs.

## Bryan Johnson Sunday Digest

The Sunday digest lives in:

```text
app/api/bryan-weekly/route.ts
```

It sends Ann a short Swedish weekly email on Sunday evening with Bryan Johnson's latest public posts from free/open sources. It currently uses:

- Bryan Johnson's public YouTube RSS feed
- Bryan's public posts page as a best-effort fallback when it responds

It does not use OpenAI, GLM, DuckDuckGo, paid search, paid scraping, or any AI API. The digest is a lightweight link-and-title summary, which keeps the project free and avoids surprise usage.

The digest is added as a second Vercel Cron entry. Vercel Hobby supports multiple cron jobs, as long as each job does not run more often than once per day. This Bryan digest runs only once per week.

## Hanna Sunday Marathon Plan

The Hanna email lives in:

```text
app/api/hanna-weekly/route.ts
```

It sends one upcoming marathon-plan week to `hannapellk@gmail.com` every Sunday at 16:00 Europe/Stockholm. It uses the same Resend account and sender as the other emails. No extra service, paid API, database, or OpenAI usage is required.

The route only sends automatically on the Sundays that have a scheduled week in `lib/hanna-plan.ts`. A manual dry-run previews the next upcoming week.

If you want to change the recipient later, set this optional Vercel environment variable:

```bash
HANNA_EMAIL_TO=new-address@example.com
```

## Setup

```bash
corepack enable
pnpm install
cp .env.example .env.local
pnpm run dev
```

Open `http://localhost:3000`.

## Environment Variables

```bash
RESEND_API_KEY=your_resend_api_key
TRAINING_EMAIL_TO=ann@pjano.se
TRAINING_EMAIL_FROM=Training Briefing <training@yourdomain.com>
HANNA_EMAIL_TO=hannapellk@gmail.com
CRON_SECRET=change-me
ADMIN_SECRET=change-me-too
```

`TRAINING_EMAIL_FROM` must be a sender/domain verified in Resend. `ADMIN_SECRET` protects save and manual test-email actions so strangers cannot create email usage.

## Actual Scheduled Email Function

The scheduled function lives in:

```text
app/api/cron/route.ts
```

It does three things:

1. Checks `CRON_SECRET` if it is configured.
2. Reads `data/weekly-plan.json`.
3. Sends today's email only when the local hour in `Europe/Stockholm` is 07.

This is an actual backend route, not a static page.

## Vercel Hobby Deployment

### Option A: Deploy from the Vercel dashboard

Use this if you have the project in GitHub.

1. Push this folder to a GitHub repository.
2. Go to `https://vercel.com/new`.
3. Import the GitHub repository.
4. Choose Framework Preset: `Next.js`.
5. Leave Build Command as `next build`.
6. Add the production environment variables listed below.
7. Click Deploy.

### Option B: Deploy from the CLI

Use this if you want to deploy directly from this local folder.

```bash
corepack enable
pnpm install
pnpm run build
npx vercel --prod
```

The CLI will ask you to log in, choose a Vercel account/team, and link or create a project.

## Production Environment Variables

Add these in Vercel:

```text
Project -> Settings -> Environment Variables
```

Use the `Production` environment.

```bash
RESEND_API_KEY=re_xxxxxxxxx
TRAINING_EMAIL_TO=ann@pjano.se
TRAINING_EMAIL_FROM=Training Briefing <training@yourdomain.com>
HANNA_EMAIL_TO=hannapellk@gmail.com
CRON_SECRET=a-long-random-secret
ADMIN_SECRET=another-long-random-secret
```

After changing environment variables in Vercel, redeploy the project so the functions receive the new values.

To avoid accidental free-tier usage, do not add `RESEND_API_KEY` to `Preview` unless you intentionally want preview deployments to send real email.

## Resend API Key

1. Create a Resend account.
2. Verify a sending domain, for example `yourdomain.com`.
3. Create an API key in Resend.
4. Put it in `.env.local` for local development:

```bash
RESEND_API_KEY=re_xxxxxxxxx
```

5. Put the same key in Vercel as `RESEND_API_KEY`.

`TRAINING_EMAIL_FROM` should use your verified domain:

```bash
TRAINING_EMAIL_FROM=Training Briefing <training@yourdomain.com>
```

## Cron Configuration

`vercel.json` is configured with three low-frequency Vercel Hobby cron jobs:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "0 5 * * *"
    },
    {
      "path": "/api/bryan-weekly",
      "schedule": "0 17 * * 0"
    },
    {
      "path": "/api/hanna-weekly",
      "schedule": "0 14 * * 0"
    }
  ]
}
```

Vercel cron schedules are UTC. Stockholm is UTC+2 during Swedish summer time, so `0 5 * * *` triggers during the 07:00 Stockholm hour in summer.
Hanna's marathon plan uses `0 14 * * 0`, which is Sunday 16:00 Stockholm during Swedish summer time.
The Bryan Johnson digest uses `0 17 * * 0`, which is Sunday 19:00 Stockholm during Swedish summer time.

For Vercel Hobby/free-tier use:

- Keep only these three cron entries in `vercel.json`.
- Do not add frequent cron jobs or polling.
- The route checks the Stockholm local hour and skips if it is not 07.
- Vercel Hobby may invoke the job at any point within the scheduled hour, so the email may arrive sometime during 07:00-07:59 Stockholm time.
- The app has one daily training send, plus weekly Sunday sends for Hanna and Bryan. Absolute duplicate-proof delivery would require durable storage to record sent days; that is intentionally not included in the $0 setup.

You need to change the cron expression twice per year if you stay on Vercel Hobby:

- Summer time, CEST, UTC+2: `0 5 * * *`
- Winter time, CET, UTC+1: `0 6 * * *`

For the Bryan Johnson Sunday digest:

- Summer time, CEST, UTC+2: `0 17 * * 0`
- Winter time, CET, UTC+1: `0 18 * * 0`

For Hanna's Sunday marathon plan:

- Summer time, CEST, UTC+2: `0 14 * * 0`
- Winter time, CET, UTC+1: `0 15 * * 0`

This avoids a paid Vercel plan and keeps the app low-usage. Most days only the training cron runs; Sundays also have Hanna's plan at 16:00 and the Bryan digest in the evening. The tradeoff is that daylight-saving changes are manual.

Vercel automatically sends the `CRON_SECRET` value as a Bearer authorization header when it invokes the cron route.

## Manual Email Testing

From the admin page:

1. Start the app or open the Vercel production URL.
2. Enter the same value as `ADMIN_SECRET` in the `Admin secret` field.
3. Pick a day tab.
4. Click `Testmail`.

From the command line, sending a real email:

```bash
curl -fsS -X POST "http://localhost:3000/api/send-today" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: your-admin-secret" \
  -d '{"dayKey":"monday"}'
```

From the command line, generating the email without sending:

```bash
curl -fsS -X POST "http://localhost:3000/api/send-today" \
  -H "Content-Type: application/json" \
  -d '{"dryRun":true,"dayKey":"monday"}'
```

Testing the deployed cron route manually:

```bash
curl -fsS "https://your-domain.com/api/cron?secret=your-cron-secret"
```

If you run this outside the 07:00 Europe/Stockholm hour, it should return `skipped: true`. That is expected and prevents accidental sends from the wrong UTC hour.

Testing a real deployed email manually:

```bash
curl -fsS -X POST "https://your-domain.com/api/send-today" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: your-admin-secret" \
  -d '{"dayKey":"monday"}'
```

Previewing the Bryan Johnson digest without sending:

```bash
curl -fsS -X POST "https://your-domain.com/api/bryan-weekly" \
  -H "Content-Type: application/json" \
  -d '{"dryRun":true}'
```

Sending a real Bryan Johnson digest manually:

```bash
curl -fsS -X POST "https://your-domain.com/api/bryan-weekly" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: your-admin-secret" \
  -d '{}'
```

Previewing Hanna's marathon email without sending:

```bash
curl -fsS -X POST "https://your-domain.com/api/hanna-weekly" \
  -H "Content-Type: application/json" \
  -d '{"dryRun":true}'
```

Sending Hanna's marathon email manually:

```bash
curl -fsS -X POST "https://your-domain.com/api/hanna-weekly" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: your-admin-secret" \
  -d '{}'
```

## COST SAFETY

This project is intended to stay on free-tier services only.

Services used:

- Vercel: hosts the Next.js app and runs the daily training cron plus two weekly Sunday cron jobs.
- Resend: sends the daily training email.
- Static Hanna marathon plan: one upcoming week is sent once per week to `hannapellk@gmail.com`.
- Public Bryan Johnson/YouTube pages: read once per weekly digest.
- GitHub, optional but recommended: stores the repo so Vercel can deploy it.

Free plans required:

- Vercel Hobby. Do not upgrade to Pro.
- Resend Free. Resend's pricing page lists the Free plan with a daily limit of 100 emails.
- GitHub Free is enough if you use GitHub.

Credit card:

- The app itself does not require a credit card.
- The repo does not include billing integrations, paid APIs, OpenAI API usage, paid databases, or paid background workers.
- If Vercel, Resend, or another provider asks you to add a card to enable an optional feature, skip that feature. Do not enable paid add-ons.

How to avoid charges:

- Keep only the daily training cron, weekly Sunday Hanna cron, and weekly Sunday Bryan cron in `vercel.json`.
- Do not add background jobs that poll more often than once per day.
- Keep `ADMIN_SECRET` set so strangers cannot trigger real test emails.
- Keep `CRON_SECRET` set so only Vercel's cron or your signed manual test can call `/api/cron`.
- Add `RESEND_API_KEY` only to Vercel `Production`, not `Preview`, unless you intentionally want preview deployments to send real email.
- Do not enable Vercel Pro, paid analytics, paid observability, paid storage, paid deployment protection, paid databases, Vercel AI, Vercel Workflows, Vercel Queues, or any paid add-on.
- Do not add an OpenAI API key. This app does not need one.
- Do not add GLM, DuckDuckGo, or other AI/search API keys unless you deliberately change the app later. Surprise exercises are stored in the weekly JSON plan for $0 operation.
- Do not add paid search/scraping APIs for the Bryan Johnson digest. It uses free public feeds/pages only.
- Keep manual test sends low. Every click on `Testmail` sends a real email.
- Watch Resend usage after deployment and stay under the free daily email limit. This project normally sends one email per day, plus two extra emails on Sundays.
- If you add durable plan storage later, choose a free option deliberately before changing `lib/plan-store.ts`.

What to disable if you stop using the project:

- In Vercel, disable or delete the project.
- In Vercel, remove the cron jobs by deleting the `crons` entry from `vercel.json` and redeploying, or disable Cron Jobs in the project settings.
- In Vercel, remove `RESEND_API_KEY`, `CRON_SECRET`, and `ADMIN_SECRET` from Environment Variables.
- In Resend, revoke the API key used by this app.
- In Resend, check usage and make sure no unexpected sends are happening.

## Verify The Deployment

After Vercel deploys:

1. Open the production URL.
2. Confirm the admin page loads.
3. Enter `ADMIN_SECRET`.
4. Click `Testmail` for today's tab or another selected day.
5. Check that the email arrives at `TRAINING_EMAIL_TO`.
6. Go to Vercel Project -> Settings -> Cron Jobs and confirm `/api/cron`, `/api/hanna-weekly`, and `/api/bryan-weekly` are listed.
7. Go to Vercel Project -> Logs after a scheduled run and filter for `/api/cron`.

If `/api/cron` returns `401`, check that `CRON_SECRET` exists in Vercel and redeploy.

If `/api/send-today` returns `Unauthorized`, enter the correct `ADMIN_SECRET` in the admin page or pass it with the `X-Admin-Secret` header.

If `/api/send-today` returns `RESEND_API_KEY saknas`, check that `RESEND_API_KEY` exists in Vercel and redeploy.

If Resend rejects the sender, verify the domain used by `TRAINING_EMAIL_FROM`.

## API Routes

- `GET /api/plan` returns the current weekly JSON plan
- `PUT /api/plan` saves the weekly JSON plan and requires `ADMIN_SECRET` when configured
- `POST /api/send-today` sends a manual test email and requires `ADMIN_SECRET` when configured
- `POST /api/send-today` with `{ "dryRun": true }` returns the generated email without sending
- `GET /api/cron` sends the scheduled daily email when the Stockholm local hour is 07
- `GET /api/hanna-weekly` sends Hanna's scheduled Sunday week plan when the Stockholm local hour is 16
- `POST /api/hanna-weekly` sends Hanna's next available week plan manually and requires `ADMIN_SECRET`
- `POST /api/hanna-weekly` with `{ "dryRun": true }` previews Hanna's next available week email without sending
- `GET /api/bryan-weekly` sends the scheduled Sunday Bryan Johnson digest when the Stockholm local hour is 19
- `POST /api/bryan-weekly` sends a manual Bryan Johnson digest and requires `ADMIN_SECRET`
- `POST /api/bryan-weekly` with `{ "dryRun": true }` previews the digest without sending

## Editing The Plan Manually

You can edit `data/weekly-plan.json` directly if needed. Each day supports:

- `headline`
- `running`
- `gym`
- `suggestedOrder`
- `intensity`
- `recovery`
- `heatSun`
- `reminders`
- `surpriseExercise`
- `heavyLegs`
- `intervals`

## Deploy Notes

On platforms with ephemeral filesystems, changes made through the admin page may not persist across deploys or restarts. For a $0 setup, treat the JSON file in the repo as the durable source of truth and redeploy when you want durable weekly-plan changes. For a durable production editor later, move `data/weekly-plan.json` to a small database, object storage, or a hosted key-value store. The rest of the app is structured so that only `lib/plan-store.ts` needs to change.

On Vercel Hobby, the `Spara` button cannot permanently write to `data/weekly-plan.json`. For permanent weekly-plan changes, edit `data/weekly-plan.json` in GitHub or locally, commit, push, and let Vercel redeploy. The `Testmail` button can still send the plan currently visible on screen without saving it first.

The deployed admin page is public, but save and real test-email sends are protected by `ADMIN_SECRET` when configured. Do not share the production URL broadly.
