# goodform

A mobile-first gym journal built with React, TypeScript, Vite, Tailwind CSS, Dexie/IndexedDB, Recharts, and Zod. Includes a reference-inspired full-body bodybuilding pose beside the app name.

## Run locally

Requires Node.js 22.12+ or a current Node.js LTS release.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. Alternatively, use `pnpm install` and `pnpm dev`; the repository includes a pnpm lockfile.

## Build and test

```sh
npm test
npm run build
npm run preview
```

Run browser UI checks against an already running development or preview server:

```sh
npx playwright install chromium
npm run test:ui
```

The test runner defaults to `http://127.0.0.1:5173`. Set `APP_URL` to test another URL, or `BROWSER_EXECUTABLE` to use an installed Chrome/Chromium executable. Screenshots and the test report are written to ignored `test-results/`.

## Included

- Suggested exercises grouped into upper body (including back), lower body, and core/abs; custom exercises persist.
- Editable favourite combinations, combined session plans, duplicate detection, merge/remove/keep behaviour, and reordering.
- Optional warm-up activities saved in favourites, with completion recorded separately from planning; manual running, cycling, cross trainer, skipping, mobility, and custom activities.
- Weighted, bodyweight, assisted, and timed logging. Working and warm-up strength sets are separate.
- Shared weights update only unfinished sets. Completed sets remain individually editable.
- One active workout at a time; multiple completed sessions per day; pause, resume, discard, end, and reopen.
- Transactional local writes, refresh recovery, previous exercise performance, rest timer, skip/replace/do-later actions.
- Dated height/weight measurements, live adult BMI, corrections, units, and gain/loss/maintenance/strength goals.
- Body progress periods, strength records, and workout consistency.
- Two-calendar-month detailed workout history. Measurements, personal bests, and last-performance summaries do not automatically expire.
- Versioned, validated JSON export/restore. Invalid imports do not replace existing data. Restore replacement is explicit and transactional.
- Installable application with an offline application shell in the production build. First load must be online; use HTTPS in production or localhost for development.

## Email login

Local mode works immediately without credentials. Real email/password authentication is wired to Supabase and requires your own project:

1. Copy `.env.example` to `.env`.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to your project URL and **public publishable/anon key**.
3. Enable email/password authentication in Supabase. Configure localhost and the deployment origin in allowed redirect URLs. Configure email confirmation and password recovery delivery.
4. Restart the development server.

Never use a service-role key in frontend environment variables. No credentials are committed.

Authentication separates local workspaces by user ID. Logging out preserves that user's data in the same browser. Signing in on another browser/device does **not** restore workouts automatically: import a backup. Local guest data and authenticated user data are separate; use backup/restore to move records between them. Cloud syncing remains outside this release.

Password reset links open the app with a recovery session. Go to Profile → Account & backup → Change password to set a new password.

## Data retention and records

Calendar cutoff is computed by subtracting two months from the device's local date, clamping to the last valid day. For example, April 30 → February 28 in a non-leap year. Active sessions are not expired. Opening the app and the periodic cleanup preserve summaries before removing expired completed details.

Weights are stored canonically in kilograms. Changing display units converts them; it does not reinterpret stored values. Each measurement contains its paired height/weight/date. BMI is an adult screening measure, not a diagnosis or a goal recommendation.

Records use completed working sets only and remain associated with stable exercise identities. Historical sessions snapshot exercise labels and conventions. Correct a retained session by reopening it; explicitly remove incorrect standalone personal-best records when their source session has expired. Expired source details cannot reconstruct an earlier best.

Browser data is local and may be removed by clearing site data or uninstalling the browser. Export backups regularly. Persistent browser storage is requested when beginning a workout, but it is not a guarantee against deliberate removal. Avoid incognito mode for real records.

## Demo data

Profile → Account & backup → Load clearly labelled example data. This is allowed only before adding workouts or measurements. A persistent banner labels the sample workspace. Reset local data before recording your own results.

## Push to GitHub

This folder is an initialized Git repository. No remote is configured and nothing is published.

```sh
git add .
git commit -m "Build Goodform gym tracker MVP"
git remote add origin YOUR_REPOSITORY_URL
git push -u origin main
```

Create an empty GitHub repository first. `.env`, installed packages, build output, backup test files, and test screenshots are ignored.

## Deferred

AI Quick Log, dedicated speech input, cloud syncing, routine duplication, manually backdating workouts, nutrition, social feeds, and wearables.

## Validation limits

Local UI tests do not validate a live Supabase project, email delivery, or app installation on physical iOS/Android devices. These require configured services and device checks before a public release. Review and harden this training MVP before production use.

## Exercise catalogue updates

The library includes 60 built-in exercises, six in each muscle group. On startup, missing built-in entries are added without replacing custom exercises or changing existing exercise IDs, routines, sessions, or records. The editable catalogue is in src/catalogue.ts.


Default favourites include three exercises per covered upper-body/core group, with a shorter Leg Day: Chest + Triceps (6), Back + Biceps (6), Leg Day (6), Core / Abs (3), and Shoulders (3). Untouched original starter routines are upgraded once; customized routines retain their edits. These are editable starting templates.


Ending a workout is allowed even when no sets or warm-ups were logged. In completed sessions, unlogged sets are considered skipped, fully unlogged exercises are marked skipped, and only completed working sets contribute to records.



Run the seven isolated user journeys with npm run test:journeys. Start the app first; APP_URL overrides the default http://127.0.0.1:4176/. See UI_TEST_REPORT.md for the scenarios and verified regression fix.


