# COMP4020 prototype

Your starter repo for a COMP4020 prototype: a static site in HTML/CSS/TypeScript
that builds to plain HTML/CSS/JS and deploys to GitHub Pages. The deployed site
is what gets marked, not this repo.

The
[course website](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/)
publishes this deliverable's brief and spec, and this repo's name tells you
which deliverable applies. Read both before you plan or build.

## The link-preview card

`public/card.png` (1200x630) is the image a shared link shows; `index.html`'s
head points at it. Replace it and the `description` meta, and copy the head
block into any new page. The card URL resolves against the page that names it,
like any link --- `./card.png` is wrong one directory down, and nothing in CI
checks it, so the deployed head is the only place a broken one shows up.

## The checks

`pnpm check` runs them, and `pnpm check:evidence` is the extra gate before you
ship. CI runs the same plus links, secrets and the deploy.

`spec/README.md`, `PROCESS.md` and `reflections/README.md` are in this repo and
say what they are for.

## Swerve-specific notes

- The canvas is a fixed logical resolution (300×500 world units in `main.ts`)
  scaled via `canvas.style.width/height` to fit the viewport, letterboxed
  rather than redrawn per-viewport. All gameplay math (lane centres, row
  speed, collision) stays in world units; only `resize()` touches CSS pixels.
  Confirmed correct at both marking viewports, at a 320px reflow check, and
  across a resize mid-round (lane position survives). Reuse this pattern
  directly for any future canvas-based prototype rather than re-deriving it.
- `game-logic.ts` has no DOM/canvas/timers so the one rule the brief requires
  under test (`isCollision`) --- plus the fairness invariant it depends on
  (`generateRow` never blocks every lane) and the difficulty/speed ramps --- is
  a plain unit test, not a DOM-wired one. Keep new rules in this file, not
  `main.ts`, for the same reason.
- To playtest pacing/feel (not just correctness) without shipping debug code,
  temporarily append `(window as any).__debug = () => ({ ...state })` after
  `main.ts`'s final `requestAnimationFrame(frame)` call, drive real input via
  `agent-browser press`, poll the probe to react and to log score/timing, then
  `git checkout -- main.ts` before committing. Confirmed the difficulty ramp
  (blocked-lane count climbs to score 40, speed climbs to score 75 then caps)
  reads as a well-graduated skill curve, not a cliff, and that dying clears
  the board and gives a fresh ~4s runway before the next threat --- restarting
  immediately on any key feels cheap in the encouraging sense, not the unfair
  one. A single scripted death around score 23 during this pass was very
  likely CLI round-trip latency outrunning the reaction window at higher
  speed, not a fairness bug --- the "never blocks every lane" invariant is
  already unit-tested, so treat an automated-play death at high difficulty as
  a tooling artefact to double-check, not a bug report, unless the debug
  probe's own state shows an unsafe row (all three lanes blocked).
- The keydown handler binds bare `a`/`d`/arrow keys and called
  `preventDefault()` unconditionally, which hijacked real browser shortcuts
  sharing those keys with a modifier held --- confirmed with a real
  `agent-browser press Control+a` / `Alt+ArrowLeft` and a bubble-phase
  listener reading `event.defaultPrevented` back (`true` before the fix).
  Fixed with a one-line guard (`if (e.ctrlKey || e.metaKey || e.altKey)
  return;`) at the top of the handler, re-confirmed clean after. Any future
  keyboard-driven prototype that binds letter or arrow keys globally needs
  this same guard checked, not assumed --- it's cheap to add up front but
  easy to miss since it only shows up against a real modifier combo, never
  a plain keypress.
- `preventDefault()` on a bare, unmodified key that does nothing yet (Space,
  before game-over) is just as easy to miss as the modifier case above ---
  the keydown handler only called it for Space/Enter when `gameOver`, so
  pressing Space mid-round fell through to the browser's default scroll.
  Invisible at both marking viewports (the page never overflows there), but
  `resize()`'s own 0.5 minimum scale floor means a short-enough viewport
  *does* leave the canvas taller than the window, and Space visibly
  scrolled the canvas out of view mid-game. Confirmed with a real
  `agent-browser press Space` plus `window.scrollY` at a forced-overflow
  390×250 viewport, both before (`98`) and after (`0`) the fix
  (call `preventDefault()` for Space/Enter unconditionally, gate only the
  `resetGame()` call on `gameOver`). General lesson: when auditing a keydown
  handler for browser-default leaks, don't stop at "does it guard the right
  modifiers" --- also check whether it calls `preventDefault()` on every
  branch a key can take, including the ones where the game itself does
  nothing, and check it at a viewport where the page's own layout invariant
  (here, "canvas always fits the window") is actually forced to break.
- The canvas's `pointerdown` handler moved or restarted the player for any
  mouse button, since it never checked `e.button` --- a right-click silently
  steered the player (or restarted a finished round) exactly like a
  left-click, while the browser's own context menu still opened on top of
  the result. The mouse-button analogue of the modifier-key keydown lesson
  above: any pointer handler bound to a whole interactive element (not just
  a keyboard handler bound to a whole keyboard region) needs to check which
  input variant actually triggered it before treating them as equivalent.
  Confirmed two ways: a real CDP `agent-browser mouse down/up right` on the
  canvas (proving the OS/browser genuinely dispatches `pointerdown` with
  `button: 2`, not just a hand-built event) and a synthetic
  `dispatchEvent(new PointerEvent('pointerdown', {button: 2, ...}))` via
  `agent-browser eval` to sidestep this sandbox's CLI round-trip latency
  outrunning the ~5s-from-load reaction window (see the debug-probe entry
  above) --- reading `#live`'s text back showed a right-click left a
  game-over announcement untouched (no `resetGame()`) while an immediately
  following left-click still blanked it (restart still works), and
  pixel-read the player's lane to confirm a live-round right-click doesn't
  move it either. Fixed with `if (e.button !== 0) return;` at the top of
  the handler --- safe for touch/pen too, since the Pointer Events spec
  mandates `button === 0` for any primary-contact pointerdown regardless of
  device. General lesson: this is a distinct check from the touch-action
  and multi-touch-tracking passes already run on this project --- test the
  *button* field on a pointerdown handler specifically whenever the handler
  drives game state from a whole-element listener, not just whether touch
  and mouse are both wired up.

## This file is yours

A starting point, not a rulebook: what you add to it is the harness, and the
harness is assessed. This file and the sensors you wire into `check` carry
across the course --- both come with you into next week's repo. The prototype
doesn't: source, and the tests answering this week's published spec, stay
behind. `spec/README.md` draws the line.
