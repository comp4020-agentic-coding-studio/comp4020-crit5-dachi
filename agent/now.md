# Hand-off --- crit 5 (a game), fourth run, 137.5h to cutoff

## State

`comp4020-crit5-dachi`: **Swerve**, a three-lane dodge. Working tree clean,
pushed --- `origin/main` is at `1201ea6`.

1. Ran both sensor lenses the third hand-off flagged as open, both confirmed
   clean (no bug):
   - `generateRow`'s blocked-lane count at high difficulty: empirically
     verified (200k-sample `node -e`) `Math.floor(random() * maxBlocked)` is
     unbiased --- both 1 and 2 blocked lanes are reachable at maxBlocked=2,
     near-even split. Also mapped exactly where the step happens: `maxBlocked`
     jumps from 1 to 2 at score 20 (difficulty 0.5), not at score 40
     (difficulty 1) as the code comment's phrasing might suggest --- not a
     bug, just a looser doc claim than the actual step function, not worth
     changing.
   - Touch-input parity: dispatched a real synthetic `PointerEvent` with
     `pointerType: 'touch'` at the canvas via `agent-browser eval`, both
     halves. Lane changed correctly (1→0 left, 1→2 right) --- the handler
     already treats all pointer types uniformly via `clientX`, no bug. One
     early attempt showed no movement on the very first dispatch of the
     session; three immediate retries with identical code all worked, so
     treated as the already-documented "first browser action in a session
     can be unreliable, reload/retry before trusting a null result" caution,
     not a real flake to chase further.
2. Two clean confirms in a row was the cue (per this project's own working-
   style precedent) to ask a different kind of question rather than re-run
   the same lenses. Found and fixed a real bug: the keydown handler only
   called `preventDefault()` on Space/Enter when `gameOver`, so Space during
   live play fell through to the browser's default scroll. Invisible at both
   marking viewports (page never overflows there) but real at a forced-
   overflow viewport (390×250, where `resize()`'s own 0.5 minimum scale
   floor leaves the canvas taller than the window) --- confirmed
   `window.scrollY` went from `0` to `98` on a real `agent-browser press
   Space` before the fix, `0` after. Fixed by calling `preventDefault()`
   unconditionally for Space/Enter and gating only `resetGame()` on
   `gameOver`
   ([`dc29385`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-dachi/commit/dc29385)).
   Recorded in this repo's `CLAUDE.md`
   ([`1201ea6`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-dachi/commit/1201ea6)).
   This is a distinct bug class from the modifier-key one two runs ago (that
   was "guard the wrong modifier combo"; this is "forgot to preventDefault
   on a branch where the game does nothing at all") --- both are candidate
   `PROCESS.md` citations for later, alongside the "one mechanic vs two"
   design call already flagged.
3. Still did **not** touch `PROCESS.md`'s template or write
   `reflections/crit-5.md` --- four runs in, real bugs are still surfacing
   (two so far, this run's and the modifier-key one), and 137.5h is nowhere
   near clock-pressure (~18% of the 168h window elapsed).

## Next action

The "does preventDefault cover every branch, not just the right modifiers"
question just paid off once on Space/Enter --- worth a quick sweep of
whether any *other* key this game responds to could have the same gap (none
obviously do: Arrow/`a`/`d` already preventDefault unconditionally). Beyond
that, sensor lenses not yet run on this project: a full a11y/keyboard/resize
re-sweep hasn't been repeated since run 2 (three runs of code-level lenses
since); and the "one mechanic vs two" brief provocation (a second interacting
mechanic, e.g. a pickup/powerup lane or a speed-boost risk/reward choice) is
still an open, in-scope deepening option if code-level bug-hunting goes dry
again --- not yet attempted since it's a design/build decision, not a sensor
check, and the current one-mechanic game already meets the brief's "obvious
in ten seconds" bar per the pod-test framing.
