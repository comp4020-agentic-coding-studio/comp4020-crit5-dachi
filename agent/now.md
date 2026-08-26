# Hand-off --- crit 5 (a game), second run, 155.5h to cutoff

## State

`comp4020-crit5-dachi`: **Swerve**, a three-lane dodge. Working tree clean,
pushed nowhere yet (local only, as expected this early --- still well inside
the plan/build/deepen window).

1. Confirmed `pnpm check` green (24/24 tests) before and after this run's one
   change.
2. Did the depth pass the first hand-off flagged as open: played several real
   timed rounds via a temporary `window.__debug` probe in `main.ts` (removed
   with `git checkout` before committing --- see MEMORY.md's existing
   technique note, now also written into this project's own `CLAUDE.md`) with
   `agent-browser` driving real key presses. Findings:
   - The difficulty ramp (blocked-lane count climbs to score 40, speed climbs
     to score 75 then plateaus) reads as genuinely graduated, not a cliff ---
     confirms the brief's "a skill that sharpens" bar without needing a
     second interacting mechanic.
   - Restart-on-any-key feels cheap in the encouraging sense: the board
     clears fully and the next threat is still ~4s out, so dying doesn't
     punish immediately retrying.
   - One scripted death around score 23 was very likely CLI round-trip
     latency outrunning the reaction window at higher speed (a known
     tooling artefact per MEMORY.md), not a fairness bug --- the
     never-blocks-every-lane invariant is already unit-tested.
   - **Decision, made deliberately rather than left implicit**: kept the
     single mechanic. The brief says one mechanic is usually enough, and the
     real playtest supports that this one already sustains interest for
     five minutes on its own via the ramp. Not adding a second mechanic
     (e.g. a shield pickup) this run; revisit only if a future playtest
     pass suggests the ramp alone stops being enough, not on a schedule.
3. Wrote the fixed-logical-resolution letterboxed-canvas pattern and the
   debug-probe playtesting technique into this repo's own `CLAUDE.md`
   (`7bd5b67`) --- the working-style memory's "grow the project's own
   CLAUDE.md once a sensor lens lands or a pattern gets reused" condition was
   now met (this run's playtest was a second, distinct sensor lens beyond the
   first run's a11y/keyboard/resize sweep).
4. Did **not** touch `PROCESS.md` or `reflections/crit-5.md` yet --- still
   two runs in, nowhere near sensor-exhaustion or clock-pressure signals.

## Next action

Sensors not yet run on this project: a full a11y/keyboard/resize/screenshot
re-sweep (last confirmed clean on the first run, before the grace-period
change and card replacement --- worth one more pass since those two commits
touched timing and a public asset, even though neither touches the DOM
structure the sweep checks) and a logic/state-symmetry pass over
`game-logic.ts`/`main.ts` (e.g. does `resetGame` clear every piece of mutable
state the render function reads --- `best` is deliberately kept across
resets, confirm that's the only deliberate exception). Consider whether
Swerve's own `CLAUDE.md` should also record the "one mechanic, decided not
two" call as a citable moment for `PROCESS.md` later.
