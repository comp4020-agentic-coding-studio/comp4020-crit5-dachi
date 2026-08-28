# Hand-off --- crit 5 (a game), ninth run, 96.5h to cutoff

## State

`comp4020-crit5-dachi`: **Swerve**, a three-lane dodge. Pushed clean this run
--- `origin/main` at `840b110`.

The eighth run's sensor pass had come back fully clean (tab order,
middle-click, a11y audit all confirmed with no new bug), and its hand-off
asked the ninth run to find a genuinely new question rather than repeat the
tab-order/button-guard family. Found one: the canvas that carries every
keyboard move (`window`-level `keydown` → arrow keys) had no explicit `role`,
so it resolved to the implicit HTML-AAM role `img` --- confirmed with
`agent-browser eval "document.querySelector('canvas').getAttribute('role')"`
reading `null`. That matters specifically because a screen reader's
browse-mode virtual cursor (NVDA/JAWS) claims bare arrow keys for its own
quick-navigation by default, and a non-interactive implicit role doesn't
switch the AT into the focus/forms mode that would hand raw keystrokes
through to the page --- unlike Aurora Keys' single-letter-hotkey collision
(logged in `MEMORY.md`, not blocking there because buttons gave an
independent path), Swerve has *no* alternate control, so this was a
can-a-screen-reader-user-play-at-all question, not a redundant-path one.

Fixed with `role="application"` on the canvas (`55c1dd5`), the standard
technique for a canvas game that needs raw keys handed straight through.
No real NVDA/JAWS/VoiceOver is available in this sandbox, so verification
was necessarily partial (not a full AT confirmation): `pnpm check` green
(24 tests), a fresh `agent-browser a11y --json` still 0 violations/0
incomplete with the role present, and a real `agent-browser press
ArrowRight`/`ArrowLeft` sequence (reading the player's x back by
monkey-patching `CanvasRenderingContext2D.prototype.arc` via `eval`, since
position is a closed-over `main.ts` variable with nothing in the DOM to
query) still moved the player between lane centres exactly as before ---
confirming the fix is additive and doesn't touch the working keyboard path
for sighted/mouse users. Documented in both this project's own `CLAUDE.md`
(`840b110`) and the global `MEMORY.md` (thirteenth technique in the
app-vs-browser-input-handling family's sibling, AT-vs-page arbitration).

Full detail lives in the project's own `CLAUDE.md`; not repeating it here.

`pnpm check` green throughout. Local `python3 -m http.server` used for this
run's browser sensor pass was killed before the run ended --- confirmed via
`curl` returning connection-refused, not just assumed. Live GitHub Pages URL
still 404s (repo not yet flipped public/deployed by the harness) --- expected
per the standing note below, not something to chase.

## Next action

Six real/genuine findings now landed across this project (five behavioural
bugs from runs 2--7, plus this run's accessibility gap), all but this run's
cited in `PROCESS.md`. Consider adding a sixth `PROCESS.md` moment for the
`role="application"` fix if a future run judges it belongs alongside the
other five --- it's a different kind of finding (an accessibility gap found
by reasoning about ARIA semantics, not by playing or by a browser-dispatch
test) and the brief's "one change that came from playing the finished game"
slot is already filled by the opening-grace-period fix, so don't force this
one into that specific sentence.

96.5h to cutoff is still well over the 24h "finish" threshold --- keep
building/deepening, don't move to `reflections/crit-5.md` yet. If a future
run's code-level and browser-level lenses go dry again, worth trying next
(none of these are confirmed bugs, just untried angles):
- Whether the `<p id="live">` `aria-live="polite"` region interacts sensibly
  with the new `role="application"` --- application mode can suppress some
  ATs' automatic reading of live regions outside the application's own
  focus; not yet reasoned through carefully, and no way to confirm without a
  real AT in this sandbox. Worth a documented "reasoned about it, here's the
  tradeoff" pass rather than assuming it away, if this project's other
  angles go dry again.
- The `resetGame()` `spawnAccumulator` state-symmetry question (see prior
  hand-offs) is closed, don't reopen.
- The "one mechanic vs two" and no-tutorial/five-minute bars remain
  deliberately deferred human-judgement items for the pod crit, not
  something to keep re-verifying with automation.

Given sensors keep finding something every couple of runs when a genuinely
new question is asked (this run being proof), don't default to a doc-only
pass next time without first trying one more distinct angle --- but if a
good-faith attempt turns up nothing, that's a fine result to note and keep
moving toward the reflection once the clock is closer to the final run.
