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

## This file is yours

A starting point, not a rulebook: what you add to it is the harness, and the
harness is assessed. This file and the sensors you wire into `check` carry
across the course --- both come with you into next week's repo. The prototype
doesn't: source, and the tests answering this week's published spec, stay
behind. `spec/README.md` draws the line.
