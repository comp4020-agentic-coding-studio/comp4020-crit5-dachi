# Hand-off --- crit 5 (a game), eighth run, 107.5h to cutoff

## State

`comp4020-crit5-dachi`: **Swerve**, a three-lane dodge. Pushed clean this run
--- `origin/main` at `d1a1f00`.

This was the first run on this project where the sensor pass came back fully
clean --- three angles the seventh run's hand-off had flagged as not-yet-tried,
all confirmed with no bug:

- A full `Tab`/`Shift+Tab` walkthrough (Home link → canvas → nothing, and
  back) is sane now that the focus-stealing-Enter fix from the seventh run
  has landed.
- Middle-click (button 1) on the canvas doesn't move or restart, in both
  live-play (checked via a temporary `window.__debug` probe reading
  `playerLane`/`gameOver`, reverted before committing) and game-over states
  --- the existing `e.button !== 0` guard already covers it, not just
  left/right as previously confirmed.
- `agent-browser a11y --json` reports 0 violations, 0 incomplete.

With sensors dry for the first time (not yet a repeated pattern --- the prior
four runs each found a real bug), and 107.5h still on the clock (~64% of the
168h window remaining), used the "confirms clean, plenty of time left"
signal to do doc work rather than force a speculative code change: filled in
`PROCESS.md`'s five real moments (the playtesting-driven grace period plus
the four keyboard/pointer input-handling bugs from runs 4--7), each with a
real commit citation, and recorded the three clean confirmations in this
repo's own `CLAUDE.md`. Held off on `reflections/crit-5.md` on purpose ---
that's explicitly a final-run artefact per doctrine, and 107.5h is closer to
crit 4's "sensors dry once, ~72% of the week left, don't lock in the story
yet" precedent than to a genuine end-of-week finish. `pnpm check:evidence`
confirms this: PROCESS.md's citations resolve, it only fails on the missing
reflection file, exactly as expected at this stage.

`pnpm check` green throughout (24 tests, typecheck, build). A local
`python3 -m http.server` used for this run's browser sensor pass was killed
before the run ended --- double-check no stray server survives into a future
run.

## Next action

Five real bugs now found and fixed across this project (modifier keydown
hijack, Space-scroll during play, right-click button check, focus-stealing
Enter, plus the playtesting-driven opening grace period), all cited in
`PROCESS.md`. Sensor angles from the app-vs-browser-input-handling family are
now largely exhausted for this codebase --- keydown modifiers, Space/Enter
defaults, pointer button, focus-target collision, and now middle-click and
tab order have all been checked at least once.

If a future run's code-level lenses go dry again too, worth trying next
(none of these are confirmed bugs, just untried angles):
- The state-symmetry angle on `resetGame()`'s `spawnAccumulator` reset (0,
  not `-START_GRACE_PX`) --- checked by hand across several runs and judged
  not a bug (restarting straight into normal pacing, without the fresh-load
  grace period, reads as intentional: a player who's already died once
  doesn't need the extra orientation beat). Worth citing precisely in
  `PROCESS.md` with exact numbers if it's ever useful, but don't reopen it
  as a bug hunt.
- The "one mechanic vs two" brief provocation is still open and still
  deliberately deferred --- don't add a second mechanic speculatively; only
  take it up if a pod-style human signal asks for more depth, since "feel"
  isn't something these sensors can judge (same reasoning as Aurora Keys'
  crit 4, logged in global `MEMORY.md`).
- The brief's no-tutorial claim and "obvious in ten seconds" bar are also
  human-judgement items the pod crit settles, not something to keep
  re-verifying with automation.

Given sensors are increasingly dry and time remaining is still substantial,
the next run should first look for a genuinely new question (not a repeat of
tab-order/button-guard-shaped checks) before defaulting to another doc pass
--- but if nothing new turns up on a good-faith attempt, that's fine to note
and move toward `reflections/crit-5.md` once the clock is closer to the
final run than it is now.
