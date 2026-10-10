# Goodform MVP validation

Tested on 9 October 2026 with automated headless Chrome on Windows.

## Results

- TypeScript compilation passed.
- Production Vite build passed. It reports a bundle-size warning; splitting chart and authentication bundles is future optimization.
- 12 domain tests passed: shared-weight protection, completed working-set records, retained personal bests, assisted comparisons, calendar-month retention, paired BMI readings, pause accounting, and backup validation.
- 10 browser scenarios passed with no browser runtime errors.

| Browser scenario | Result |
|---|---|
| Desktop layout and brand | Pass |
| Create routine and custom exercise | Pass |
| Combine favourites and merge duplicates | Pass |
| Shared weight preserves completed sets | Pass |
| Refresh recovery, pause/resume and warm-up logging | Pass |
| End and reopen without duplicating sessions | Pass |
| Dated height/weight readings and BMI | Pass |
| Export payload and invalid-import protection | Pass |
| Valid backup restoration | Pass |
| Mobile 390px layout and navigation | Pass |

Screenshots are generated in `test-results/` by `npm run test:ui`. The folder is excluded from Git because it also contains test backup data.

## Limitations

The browser sandbox canceled completion of native file downloads. The test captured and validated the actual exported Blob, then restored it through the real file-import UI. Verify download completion in your regular browser.

Live Supabase signup, login, email delivery and password recovery require your configured Supabase project and were not tested. The local workspace is functional without credentials. No cross-device data syncing is provided.

Physical Android/iOS installation and real-device interaction have not been tested.

## Reproduce

```sh
npm install
npm test
npm run build
npx playwright install chromium
npm run dev
# In another terminal:
npm run test:ui
```

For the production offline test, run `npm run preview`, then `node scripts/offline-smoke.mjs`. On Windows you can set `BROWSER_EXECUTABLE` to your Chrome executable when using an installed browser instead of Playwright Chromium.

## Production offline verification

Passed: cached production reload without internet, active-session recovery, and persistence of edits made offline. The test caught and fixed service-worker syntax and static-asset cache matching errors. Build now checks generated service-worker syntax.


## Exercise catalogue update

14 logic tests passed, including six exercises per group, stable legacy identities, and repeat-safe additive catalogue updates. The browser suite now also checks all ten groups in the routine picker.


## Expanded default favourites

16 logic tests and 11 browser scenarios passed. Browser checks verify expanded favourite counts. Existing untouched defaults upgrade without replacing their routine IDs or existing plan-item IDs; modified routines are preserved.


## Clear selection after completion

End workout clears favourite selections after successful save. The browser regression checks that no favourite is pressed, no card has an automatic featured highlight, and Review today's plan is disabled on returning to Today.


## Unlogged sets are skipped

Production build and 12 browser scenarios passed, including ending a session with zero logged sets or warm-ups, showing All sets skipped in history, and clearing favourite selections. Completed working-set record rules remain unchanged.


## Shorter Leg Day

17 logic tests passed. The default Leg Day now contains six exercises: two quads, two hamstrings, one glutes and one calves. Only unchanged twelve-exercise starter routines are shortened; custom edits and historical snapshots are preserved.


## Seven realistic workout journeys

Executable coverage: `npm run test:journeys` against a running app (default http://127.0.0.1:4176/). Each journey uses a separate fresh browser context, drives real UI controls, and reads persisted IndexedDB results for verification. User workout data is untouched. Screenshots and machine-readable results are saved under `test-results/journeys/`.

| Journey | Operations and assertions |
|---|---|
| Arun | Chest + Triceps; bench 30/35/40 kg with 10/8/6 reps; shared pushdown weight; skip machine press; complete other exercises; verify exact saved values and no records from skipped exercise. |
| Maya | Back + Biceps plus Core; shared pulldown load; curls 5/6/7 kg per hand; timed plank; defer side plank and never return; skip pull-up; end and start second daily session. |
| Ravi | Leg Day; complete squat at 40 kg, enable shared mode, log 45 then 50 kg; preserve previous completed loads; skip hip thrust; leave final calf set unlogged. |
| Neha | Log bench set before replacing with push-up; preserve original completed set; log replacement sets; defer incline and never return; verify the saved favourite was not changed. |
| Sam | Shoulders plus Core; shared shoulder press and mixed lateral raises; defer crunch; refresh/resume; pause/resume; skip side plank; verify persisted entries, paused time and one session. |
| Priya | Log erroneous 200 kg row; end; reopen and correct to 20 kg; complete previously skipped curl; verify same session ID, no duplicate, corrected personal best and live skipped status cleared. |
| Leo | Defer squat and leg press; skip remainder; end with zero logs; verify no records; reopen and log squat; verify status and same session; then create another daily session. |

The initial complete assertion run passed five journeys and failed Priya and Leo on the same live-status issue: an exercise still showed Skipped after a set was completed in a reopened session. Saved results recalculated on ending, but the live label was stale. Fix: completing a set immediately clears its exercise's skipped flag. Maya initially had a test selector ambiguity between Plank and Side plank; exact text matching corrected the test itself.

Final rerun: all seven workout journeys passed after the live skipped-status fix, with no browser runtime errors. TypeScript compilation, production build, and all 17 logic tests passed.


## Reference-inspired logo replacement (10 October 2026)

Replaced the rear double-biceps mark with a generated transparent full-body overhead-arm bodybuilding pose. Adjusted desktop/mobile proportions and accessible label. TypeScript, production build, and all 12 browser checks passed; desktop and mobile screenshots were reviewed.

