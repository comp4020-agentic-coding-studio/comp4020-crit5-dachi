# Hand-off --- crit 5 (a game), fifth run, 131.5h to cutoff

## State

`comp4020-crit5-dachi`: **Swerve**, a three-lane dodge. Working tree clean,
nothing to commit this run --- `origin/main` still at `87ad335`.

This run repeated the full browser sensor sweep for the first time since run
2 (three runs of code-level lenses in between), plus one new angle borrowed
from Aurora Keys' precedent. Everything came back clean --- no new bug:

1. **a11y** (`agent-browser a11y --json`): 0 violations, 0 incomplete.
2. **Keyboard**: `Tab` walks link → canvas → end of page; canvas is properly
   in the tab order and window-level keydown handles movement regardless of
   focus.
3. **Resize mid-interaction**: moved a lane, resized 1920×1080 → 390×844,
   state survived; screenshot at 390×844 shows correct layout (player
   centred, no overflow).
4. **320px reflow**: `scrollWidth === innerWidth` (320) both at rest and
   after a keypress.
5. **Touch-action scoping** (new check, not previously run on this project):
   Aurora Keys' lesson was that `touch-action: none` on a broad ancestor
   (`body`) kills pinch-zoom everywhere; Swerve already scopes it to `canvas`
   only (`styles.css:47`), not `body`. Confirmed by reading the stylesheet
   --- already correct, nothing to fix.
6. **Reduced-motion** (new check, not previously run on this project):
   monkeypatched `ctx.arc` via `agent-browser eval` to record every radius
   drawn. With `prefers-reduced-motion: reduce` forced, all draws are a flat
   `20` (pulse genuinely disabled, not just visually subtle). Without it, 69
   distinct radii across ~1s (a real continuous tween, not a discrete
   toggle) --- the same "does it actually animate or just flip" question
   that caught a real bug on Aurora Keys, here confirming Swerve's `main.ts`
   canvas-draw approach doesn't have that failure mode (it was always a risk
   specific to animated CSS custom properties without `@property`
   registration, which doesn't apply to a raw canvas draw call).

## Next action

Five runs in, code-level lenses (modifier keys, Space-scroll, touch-input
parity, blocked-lane bias) and now the full browser sweep have all gone
clean or already been fixed. Two real bugs found and fixed so far (modifier
keydown hijack, Space-scroll during play) --- both good `PROCESS.md`
candidates for later, not yet written up (still early: 131.5h is ~22% into
the 168h window elapsed, not clock-pressure).

The "one mechanic vs two" brief provocation (a second interacting
mechanic --- e.g. a risk/reward speed-boost or pickup lane) is still open
and still deferred: three consecutive hand-offs have judged the one-mechanic
game already meets the brief's "obvious in ten seconds" bar, and a second
mechanic is explicitly optional ("harder but stronger *if playability
holds*") --- risky to bolt on without a way to verify "feel," which per this
project's own working-style precedent (crit 4) needs a human pod, not a
sensor. Don't add it speculatively; only take it up if a future pod-style
signal specifically asks for more depth, or if code-level bug-hunting stays
dry for several more runs and it becomes the only remaining deepening lever.

Sensor families not yet tried on this project, if the next run needs a new
angle: a state-symmetry pass specifically asking whether `resetGame()`
clears every piece of mutable state a *restart* (as opposed to a fresh page
load) could leak --- `spawnAccumulator` resets to `0` on restart vs
`-START_GRACE_PX` on first load, which was checked this run by hand (restart
runway ≈4.2s vs fresh-load ≈5.0s, both plausible, matches the already-logged
playtest observation of "~4s runway" after a death) and is not a bug, just
worth citing precisely if `PROCESS.md` ever wants the exact numbers.
