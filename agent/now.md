# Hand-off --- crit 5 (a game), thirteenth run, 65.5h to cutoff

## State

`comp4020-crit5-dachi`: **Swerve**, a three-lane dodge. Pushed clean this run
--- `origin/main` at `b85321b` (once pushed; see below).

This run's own check: whether a backgrounded tab's rAF throttling (a real
gap between frames after alt-tab away/back) could cause an unfair jump ---
a stale `dt` producing either an instant collision or a burst of rows
spawning at once. Answered by arithmetic, not a live browser check:
`frame()`'s `dt` is clamped to `Math.min(0.05, ...)` regardless of real
elapsed time, and even at the game's own speed cap (450 world units/s), one
clamped frame only advances the spawn accumulator by 22.5 units against a
170-unit row spacing --- neither a runaway jump nor a skipped-row burst is
reachable. No source change; documented in the project's own `CLAUDE.md`
(`b85321b`).

This makes five consecutive dry runs (9--13): four browser-level sensor
passes plus this run's arithmetic one, all confirms or reasoned scope-outs,
no new bugs. At 65.5h to cutoff (~61% of the 168h window already elapsed
--- well past crit 4's 28%-elapsed point, which is the precedent for *not*
drafting early), this run drafted `reflections/crit-5.md` (273 words,
answering both standing prompts: the `role="application"` a11y catch as
the breakthrough, and the "ask a narrower question, don't just re-run
sensors" lesson for the developer-identity prompt) rather than inventing a
sixth pass. `pnpm check:evidence` passes with the reflection present and
all 6 `PROCESS.md` citations still resolving. `pnpm check` green (24
tests, unchanged). Verified the built `dist/` still serves and loads
clean via a real `agent-browser open`/`eval` round-trip (canvas `role`
still `application`), server confirmed killed after. Working tree clean.

## Next action

**This repo is now functionally finished pre-crit.** PROCESS.md (6 cited
bug-fix moments) and reflections/crit-5.md are both written; nothing new
has surfaced in five straight runs across every sensor family this
project has invented (input-handling/OS-arbitration, layout/reflow,
performance/transfer-size, and now frame-timing arithmetic). Three items
remain deliberately scoped out and shouldn't be reopened without new
evidence (see the project's own `CLAUDE.md`, "Swerve-specific notes"):
the one-mechanic/no-tutorial bars (human-judgement, for the pod crit),
non-visual playability (inherently visual mechanic, same as the brief's
own Mario 1-1 reference), and the restart-grace-period gap (onboarding-
only grace is the intended design).

With 65.5h still on the clock, the honest next step is *not* a fourteenth
self-generated sensor pass --- if a future run can't name a genuinely new
question before starting, don't force one. Live GitHub Pages URL still
404s (repo not yet flipped public by the harness); check it once it's up,
but that's the harness's job, not something to chase. The one thing left
to actually wait for is the pod crit itself: watch for whatever it
surfaces (the no-tutorial rule is explicitly "the one thing here you can't
put under test and can't fake"), and treat that as the next real signal
rather than another invented check. If a run lands with nothing from the
crit yet and no new angle, a light final verification pass (full page/link
walkthrough, confirm the live URL, `git status` clean) is enough --- this
repo doesn't need more building, only finishing when the prompt calls a
run the last one.
