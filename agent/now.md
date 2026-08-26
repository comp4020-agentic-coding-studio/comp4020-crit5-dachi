# Hand-off --- crit 5 (a game), first run, 161.5h to cutoff

## State

`comp4020-crit5-dachi`: **Swerve**, a three-lane dodge. Fresh starter repo at
the start of this run; now a playable v1, three commits ahead of the initial
commit, pushed nowhere yet (local only, as expected this early).

1. Read the brief (`crits/05-game.json`): no on-screen tutorial, losable, an
   ending, obvious in ten seconds, still interesting at five minutes, a
   focused automated test on one rule, one change from playing not reading,
   both marking viewports.
2. Built the mechanic: player token fixed near the bottom of three lanes;
   rows fall from the top, each row blocks 1--2 lanes but never all of them
   (fairness invariant); arrow keys / A-D / tap-left-tap-right move a lane;
   score increments per row survived; speed and blocked-lane count ramp with
   score; any input after game-over restarts (same affordance, no separate
   "press to restart" instruction). Pure rules live in `game-logic.ts`,
   isolated from the canvas/DOM in `main.ts` specifically so the round-ending
   rule (`isCollision`) could get the brief's required focused unit test ---
   `spec/game-logic.test.ts` also covers the "never blocks every lane"
   fairness invariant and the speed/difficulty ramps. 24/24 tests green,
   `pnpm check` green throughout.
3. Fixed-logical-resolution canvas (300×500 world units) scaled via
   `canvas.style.width/height` to fit the viewport, letterboxed --- confirmed
   correct at both marking viewports (390×844, 1920×1080), at 320px (no
   reflow overflow), and across a resize mid-interaction (lane position
   survived 390×844 → 1920×1080). `agent-browser a11y` came back 0
   violations/0 incomplete; a real `Tab` walkthrough reaches the nav link
   then the canvas (a real `aria-label`, not visible instruction text) and
   focus-visible outline shows.
4. **The one change that came from playing, not reading the code**
   (`48b88a8`): actually running the built game in `agent-browser` (a
   temporary `window.__debug` probe exposing `playerLane`/`score`/`rows`,
   removed before committing --- see the new MEMORY.md technique note) showed
   the very first row could reach the player only ~3s after page load. Fine
   for someone who's played once already; tight for a first-ever look who's
   still orienting. Held the spawn timer back so the opening run gets about
   another second of runway before anything is actually at stake, closer to
   World 1-1's flat ground before its first enemy.
5. Replaced the template's placeholder `public/card.png` with a real one:
   the lane panel screenshotted live, composited next to a "SWERVE" wordmark
   (`462182a`).
6. Did **not** touch `PROCESS.md`, `reflections/crit-5.md`, or this repo's
   own `CLAUDE.md` yet --- 161.5h out, one build-and-verify pass in, nowhere
   near the sensor-exhaustion or clock-pressure signals that make writing
   those early the right call (see MEMORY.md's "Working style" section).

## Next action

Depth pass: the mechanic works and is fair by construction, but the brief
wants "still interesting at five minutes" and "a skill that sharpens or a
choice that matters" --- worth actually playing several full rounds (real
timing, not scripted probing) to feel out whether the speed/difficulty ramp
over `score` 0--40 is paced well, whether restarting immediately (no cooldown)
makes retrying feel cheap in a good way or a bad way, and whether the
single-mechanic loop stays interesting or needs a second interacting
mechanic per the brief's "harder, better move." Also still open: this
repo's own `CLAUDE.md` hasn't been grown yet with anything project-specific
(the fixed-logical-resolution letterboxed-canvas pattern is a decent
candidate once it's been reused, or once a second sensor lens lands).
