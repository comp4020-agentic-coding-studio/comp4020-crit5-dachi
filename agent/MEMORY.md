# MEMORY

Durable self-knowledge, curated run by run; ephemeral state belongs in
`now.md`, not here.

## Environment

- `mise` refuses to run until its config is trusted in a fresh environment:
  `mise ERROR Config files in ~/.config/mise/config.local.toml are not
  trusted` blocks every `pnpm`/`mise exec` call. Fix once per environment
  with `mise trust /home/ben/.config/mise/config.local.toml` --- it only
  marks an existing file as trusted, doesn't change its content.
- `agent-browser` (installed to `~/.bun/bin/agent-browser`, real home)
  works well for the two-viewport check the course wants: `agent-browser
  set viewport 1920 1080` / `390 844`, then `open`/`screenshot`. Real
  evidence beats assuming the CSS does what you think. In a fresh
  environment Chrome isn't installed: run `agent-browser install` once
  (downloads Chrome for Testing), and pass `--args "--no-sandbox"` on
  every subsequent `agent-browser` invocation --- headless Chrome's
  zygote sandbox check fails otherwise (`No usable sandbox!`) and
  `--with-deps` isn't needed to fix it. Invoke it as the bare
  `agent-browser` (it's on `$PATH` via `~/.bun/bin`), never as a
  literal `~/.bun/bin/agent-browser` path --- the sandbox remaps `$HOME`
  to the agents dir, not the real home, so tilde-expansion resolves to
  a nonexistent file even though the real binary and `$PATH` entry are
  fine.
- `agent-browser a11y <url> --json` runs a real axe-core audit --- worth
  reaching for on every crit, since none of the course's own checks
  (`pnpm check`) test accessibility or performance; that's explicitly left
  as the student's own sensor to wire up. On crit 1 it caught three real
  WCAG AA contrast failures (a text/background color pair reused in
  opposite fg/bg roles elsewhere in the page, so the same numeric ratio
  failed twice) that looked fine by eye and passed every other check.
  `agent-browser set media reduced-motion` (or `dark`/`light`) similarly
  lets you check a `prefers-*` media query actually fires, by reading
  `getComputedStyle(el).animationName` (or similar) live rather than just
  trusting the CSS reads correctly.
- A 320 CSS px viewport (`agent-browser set viewport 320 690`) is a cheap,
  reusable WCAG 1.4.10 reflow check --- 320px is the standard equivalence
  for "400% zoom on a 1280px display," and it's a genuinely different
  sensor from the two marking viewports (390×844, 1920×1080) and from
  resizing between them, since neither of those ever renders the page
  this narrow. Check `document.documentElement.scrollWidth` stays equal
  to the viewport width (no horizontal overflow) both on load and after
  driving whatever the core interaction is, not just a static screenshot.
  First run on assignment 1 (clean; confirmed
  [`46dca1a`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-dachi/commit/46dca1a)),
  worth reaching for on any future deliverable once the standard sensors
  (a11y, keyboard, resize, walkthrough) stop turning up anything new.
- The sandbox pins cwd to the deliverable repo: `cd /tmp/whatever && ...`
  silently resets back to the repo root on the next command rather than
  erroring. Scratch experiments (a throwaway script, a temporary `pnpm add`
  to test a package) have to happen inside the tracked tree and be cleaned
  up (`rm` the file, verify `git status` clean) rather than off to one
  side in `/tmp`.
- axe-core's `color-contrast` rule needs real layout/paint to resolve
  computed foreground/background --- jsdom doesn't do either, so running
  axe-core against a jsdom-loaded `dist/*.html` (e.g. to make the a11y
  audit a repeatable `spec/*.test.ts` instead of a manual
  `agent-browser a11y` pass) silently can't catch the contrast failures
  that matter most; only `agent-browser`'s real headless Chrome can. Not
  worth wiring into vitest --- a green check that can't see the main
  failure mode is worse than no check.
- `agent-browser a11y`'s JSON separates `violations` (real WCAG failures)
  from `incomplete` (axe couldn't auto-resolve, not a failure). Two
  recurring `incomplete` `color-contrast` shapes are non-issues, not gaps
  to chase: (1) `aria-hidden="true"` decorative elements still get
  evaluated even though real screen readers never see them; (2) text over
  a CSS gradient background, where axe can't pick a single background
  colour. For (2), don't leave it unresolved --- compute the WCAG
  contrast ratio by hand against the gradient's actual stop colours (the
  formula is short enough to inline in a `python3 -c`) to confirm the
  worst case still clears AA before moving on.
- A third recurring `incomplete` shape, distinct from the two
  `color-contrast` ones above: `aria-prohibited-attr` on a plain `<div
  aria-labelledby="...">` with no role --- axe correctly treats
  `aria-labelledby` on a non-landmark, non-widget element as unreliably
  supported by screen readers even though it isn't a hard WCAG violation.
  Caught on assignment 1 across three divs (two grouped columns plus a
  panel, each labelled by an adjacent heading). Fix is cheap and durable:
  add `role="group"` (or another appropriate role) alongside
  `aria-labelledby` whenever labelling a `div`/`span` container by a
  heading id, rather than leaving it as an unresolved `incomplete`.
- `agent-browser` has no Lighthouse-equivalent command, but its `eval`
  reaches the real Navigation Timing API, which is enough of a
  performance sensor for a static site: serve the actual `dist/` build
  (`python3 -m http.server`), then `agent-browser eval
  "JSON.stringify(performance.getEntriesByType('navigation')[0])"` (add
  `getEntriesByType('resource')` for byte counts) per page. On crit 1,
  six no-JS pages with one shared stylesheet all loaded under 50ms at
  under 5KB transfer --- confirms there's no optimisation work needed
  rather than assuming it from the stack choice. Same "wire it yourself,
  nothing in `pnpm check` covers it" gap as accessibility above; only
  worth re-running once a page picks up real weight (images, more CSS).
- `agent-browser` has no bandwidth/latency-throttling command (checked
  `agent-browser skills get core --full`, grepped for "emulate"/"throttle"/
  "delay" --- only `set offline on/off` and `network route --abort/--body`,
  neither of which simulates a slow link). Assignment 1's artefact rubric
  names "a slow connection" as an HD-band use case alongside keyboard and
  resize, and the honest way to satisfy it without hand-rolling raw CDP
  `Network.emulateNetworkConditions` calls is the same Navigation Timing
  check above: if the built site's total transfer size is a few KB with no
  images/fonts, it clears any realistic throttle by size alone, so the
  check is "read the byte count," not "simulate the packet loss." Only
  reach for real CDP-level throttling if a future page's payload is large
  enough that byte count alone doesn't settle it.
- `agent-browser open <url>` printing "✓ <title>" is not reliable proof
  the DOM is actually there to screenshot or `eval` against a moment
  later --- against one flaky external host (ffmpeg.org, on crit 2) a
  reported success was followed by a same-session `eval
  "location.href"` reading `about:blank` on the very next command, and
  a screenshot taken right after a genuine load still came back blank.
  This was specific to one slow-handshake host, not a general
  `agent-browser` bug (against the site's own `dist/` build and
  ordinary external hosts, "success" has always meant success). But
  the failure mode --- trusting the success message instead of
  checking state --- generalises: before screenshotting anything just
  navigated to (especially an external, previously-flaky, or
  slow-loading host), confirm with a cheap `eval` (`location.href`,
  `document.readyState`) rather than assuming the open command's own
  report is sufficient.

- `agent-browser`'s CLI has no multi-touch input primitive --- `mouse`/`click`
  only ever drive one pointer, and the only real multi-touch path is the raw
  WebSocket streaming protocol's `input_touch` with a `touchPoints` array,
  which isn't exposed as a CLI command. For verifying an app's own
  multi-pointer bookkeeping (e.g. a `Map<pointerId, ...>` meant to track
  independent simultaneous touches), `agent-browser eval` can dispatch
  synthetic `PointerEvent`s with distinct `pointerId`s and
  `pointerType: 'touch'` directly at the target element, then read back
  whatever DOM/CSS side effect the app produces per pointer (a class, a CSS
  custom property) to confirm two pointers are tracked independently rather
  than one clobbering the other. This is a legitimate live check of the
  app's real event-handling code (not a jsdom mock) --- it only synthesises
  the one input primitive the CLI itself can't produce (a second
  simultaneous touch point), everything downstream of `dispatchEvent` is the
  real page. Confirmed working on crit 4's `comp4020-crit4-dachi`.
- The same synthetic-`PointerEvent`-via-`eval` technique above is also the
  right sensor for a logic-symmetry pass over pointer/drag code, not just
  multi-touch: on crit 4, reading `main.ts`'s `pointermove` handler fresh
  (a pass flagged as not-yet-done in two prior hand-offs) found a real bug
  a browser screenshot or an a11y/keyboard/resize sweep would never catch
  --- any interaction with designed-in dead space between adjacent targets
  (here, the stage's CSS `gap` between pads) needs its `pointermove` handler
  checked specifically at the boundary, not just on-target. The bug: "no
  target under the pointer" and "gesture ended" were conflated into one
  branch that deleted the pointer's tracking outright, so a drag that
  briefly crossed the gap never resumed on the far side without a fresh
  pointerdown, even with the button still held. Confirmed with the
  down-on-target/move-to-gap/move-to-next-target/read-back-state sequence
  before touching source, then re-ran the identical sequence after the fix
  to prove it. General lesson: dead space between drag targets (a gap, a
  border, an inset hit-area) is a distinct test case from "on-target" and
  "gesture ended," worth checking explicitly any time a pointer handler
  hit-tests by element-under-pointer rather than by capture.
- A third technique in the same family, needed when a bug's symptom is
  masked by write ordering rather than absent: on crit 4, a recurring rAF
  loop (a keyboard key's sustain ramp) had a stale, never-terminating
  duplicate spawned by fast release-and-re-press, but polling the DOM value
  it wrote showed nothing wrong, because the stale loop and the fresh one
  both wrote every frame and the fresh one's write always landed last
  (rAF callbacks fire in registration order; the older loop always
  re-registers itself before the newer one within a shared frame).
  Monkey-patching the target element's own `style.setProperty` via
  `agent-browser eval` (wrap it, log every call with a timestamp, call the
  original) surfaced the truth: paired writes a fraction of a millisecond
  apart right after the re-press, one stale-and-climbing, one correct.
  General lesson: when a suspected duplicate-writer bug could be
  self-masking because of a deterministic "last write wins" ordering,
  polling the final value is the wrong sensor --- intercept the write call
  itself (not just its eventual DOM/CSS result) to see every write, not
  just the one that happened to be visible after the fact. Root cause was a
  loop whose "keep going" check read shared mutable state (a key string)
  rather than a token stamped at the specific invocation's own start; the
  fix (a per-press generation counter the loop checks before rescheduling)
  is the same shape as `NONE_HIT` above --- give a piece of shared,
  reused-identity state a way to distinguish "still current" from "stale"
  instead of only checking presence/absence.
- A follow-up pass on crit 4 asked whether a sibling code path (`main.ts`'s
  pluck-on-click handler, which also reuses an index-keyed id via a
  `pluckCounter`) shared that same staleness risk, and confirmed it
  doesn't: a fixed-duration `setTimeout` whose closure captures its own
  specific voice/id directly is not exposed the same way a conditional
  rAF/interval loop is, because there's nothing to *re-check* against
  shared mutable state before deciding whether to continue --- it just
  fires once, unconditionally, for the exact voice it was given. The
  staleness bug class above needs both ingredients: a recurring
  reschedule, and an exit check that reads shared state instead of an
  invocation-specific token. One ingredient missing (here, no reschedule
  at all) means the pattern doesn't apply, and confirming that by reading
  the code is legitimate, not a wasted pass.
- A fourth technique in the same family, found only after both the
  state-symmetry and logic-symmetry lenses above had gone dry twice on
  crit 4: ask where a listener is *attached*, not just what it does. An
  interaction that deliberately skips pointer/mouse capture (to let a drag
  retarget across sibling elements, as `NONE_HIT` above enables) needs its
  release/cancel listeners on `window`/`document`, not the interactive
  element itself --- without capture, a bubbled event only reaches a
  listener if the pointer is currently over that element's subtree, so
  releasing outside the element's bounds (trivial when the element is a
  small region with page chrome around it, not the full viewport) never
  fires anything, leaving whatever "gesture ended" cleanup was meant to run
  never running. Confirmed with the same synthetic-`PointerEvent`-via-`eval`
  technique above: drag from the target onto a page element well outside
  its bounding rect, release there, read back whatever state the release
  handler was meant to reset. General lesson: whenever code explicitly
  chooses not to use pointer/mouse capture, check every listener meant to
  observe "gesture ended" (up, cancel, and to a lesser extent leave/out) is
  bound to a target guaranteed to receive the event regardless of where the
  pointer physically ends up --- `pointerdown`/`start` can stay scoped to
  the interactive element since a gesture still has to originate there, but
  `up`/`cancel` can't.
- A fifth technique in the same family, found on crit 4's ninth run after the
  listener-placement lens above had already found and fixed its one bug and
  gone dry on a repeat pass: ask what happens to one piece of shared
  per-target visual state when two independent identities (voices, players,
  input sources) legitimately act on the same target at once. Aurora Keys
  keys its active voices by a per-input-source id (`pointer:<pointerId>`,
  `key:<char>`, `pluck:<index>:<n>`), which deliberately lets a held key and
  a pointer, or two touches, sound on the *same pad* simultaneously --- but
  each pad's `--level` CSS custom property was one write-wins slot, set
  unconditionally by whichever voice pressed, moved, or released last.
  Releasing one voice zeroed the pad's glow even while a sibling voice on
  that same pad kept sounding, invisible until the surviving voice happened
  to move. Confirmed with two synthetic `PointerEvent`s (distinct
  `pointerId`s) landing on one pad, releasing one, and reading `--level`
  back while the other stayed down and kept answering `pointermove`
  correctly afterwards --- proving the dark pad was a pure visual bug, not
  a dropped voice. Fixed by tracking each voice's own level per target and
  displaying an aggregate (here, the loudest still-active one) instead of a
  single mutable slot. General lesson: a state-symmetry pass usually asks
  "do this function's own tests/branches agree with each other"; this is
  the multi-writer variant --- whenever an id scheme is deliberately widened
  to let several independent things act on one shared target (a namespaced
  voiceId, a per-user cursor, a per-tab lock), check every place that target
  has a single piece of mutable state written by more than one of those
  ids, and ask what the last writer clobbers when it isn't the only one
  still active.
- A sixth technique in the same family, found on crit 4's tenth run after two
  prior JS/state-symmetry lenses had gone dry: when browser-level and
  logic-level sensors both stop finding anything in the script, move the same
  "does this actually do what it visually claims" question into the
  stylesheet, specifically animated CSS custom properties. A `@keyframes`
  block that sets a custom property (e.g. `--level: 0.22` at 50%) only
  interpolates smoothly if that property is registered via `@property` with a
  numeric `syntax`; unregistered, the browser treats it as an opaque token and
  the animation becomes a discrete flip partway through each keyframe
  interval instead of a tween. This is invisible to a single screenshot
  (both endpoint values look plausible alone) and to a11y/reduced-motion
  checks (neither samples a value's shape over time) --- the only sensor that
  catches it is polling `getComputedStyle(el).getPropertyValue('--x')` every
  ~100ms across a full animation cycle via `agent-browser eval` and checking
  for intermediate values, not just the two extremes. Confirmed on Aurora
  Keys' idle "breathing" pulse (flat `0`/`.22` toggle, no values between),
  fixed with `@property --level { syntax: "<number>"; inherits: false;
  initial-value: 0; }`, re-confirmed with a continuous curve after. General
  lesson: whenever a stylesheet animates a custom property directly with
  `@keyframes` (not just reads it inside a `calc()` that some other
  transitioning property depends on), check it's `@property`-registered ---
  otherwise "animate" silently means "toggle," and a computed-value time
  series is the only sensor built for this codebase's other checks that can
  actually see it.
- A methodology caution, not a new technique: the synthetic-`PointerEvent`-
  via-`eval` family above is only trustworthy against a page state you know
  is clean. On crit 4's eleventh run, testing whether a right mouse-click
  (pointerdown fires for any button, not just the primary one, since the
  app never checks `event.button`) leaves a stuck note looked like a real
  bug on the first attempt --- the pad stayed lit after mouse-up --- but
  that was contamination from an earlier, separate `eval` in the *same*
  page session that had dispatched a synthetic `PointerEvent` and never
  sent a matching up/cancel for it; the lit pad was that orphaned voice,
  unrelated to the right-click under test. Reloading the page
  (`agent-browser open <url>` again) immediately before the isolated test
  gave the true (clean) result: right-click down/up correctly zeroed
  `--level`, no bug. General lesson: before trusting any "state looks
  wrong" reading from a multi-step `eval` investigation, ask whether an
  earlier step in the *same* session left an un-released synthetic event
  behind, and reload for a clean slate before the check that actually
  matters --- don't assume each `eval` call implies a fresh page. Separately,
  for plain pointer-button questions (as opposed to multi-touch, which
  needs synthetic events because the CLI can't drive two real pointers),
  a real CDP `agent-browser mouse down/up <button>` is a strictly more
  faithful sensor than `dispatchEvent`d `PointerEvent`s --- it exercises
  genuine browser event sourcing (button field, ordering) rather than
  values the test author chose by hand.
- A seventh technique, found on crit 4's twelfth run after the state-symmetry
  and logic-symmetry lenses had gone dry the previous run: when a codebase's
  own logic keeps confirming clean, stop asking "does it agree with itself"
  and ask "does it agree with the browser/OS environment around it." A
  keydown handler that matches on bare letter keys spanning most of a QWERTY
  row (here, `a s d f g h j k` as Aurora Keys' scale) and calls
  `preventDefault()` unconditionally is exactly the shape that silently
  hijacks real OS/browser shortcuts, because `event.key` for a letter is
  unchanged by Ctrl/Meta/Alt --- only the modifier flags distinguish "the
  bare letter" from "the letter plus a live shortcut." `Ctrl+F` (find),
  `Ctrl+A` (select all), `Ctrl+S` (save), `Cmd+D` (bookmark), `Ctrl+H`
  (history), `Ctrl+J` (downloads), `Ctrl+K` (address-bar search), and
  `Ctrl+G` (find next) all matched Aurora Keys' scale letters and got eaten
  along with an unrequested note. Confirmed with a real CDP
  `agent-browser press Control+f` (genuine browser shortcut arbitration,
  not a synthetic `dispatchEvent` --- a synthetic `KeyboardEvent` wouldn't
  exercise the actual OS/browser-level shortcut contention this bug is
  about) and a same-page bubble-phase listener reading back
  `event.defaultPrevented`: `true` before the fix, `false` after a one-line
  modifier guard. General lesson: whenever a keydown handler binds bare
  letter/digit keys across a keyboard region and calls `preventDefault()`
  without checking `ctrlKey`/`metaKey`/`altKey`, check it against whichever
  modifier+key combos are live shortcuts on that same row before calling the
  input scheme done --- this is a distinct question family from the
  six state/logic-symmetry techniques above, worth reaching for once those
  have gone dry rather than assuming a clean internal-logic pass means the
  page has no more bugs.
- The modifier-key keydown lesson (bare letter/arrow keys bound globally,
  `preventDefault()` called without checking `ctrlKey`/`metaKey`/`altKey`)
  reproduced on a second, unrelated project: `comp4020-crit5-dachi` (Swerve,
  a lane-dodge game) bound `a`/`d`/arrow keys the same way Aurora Keys did,
  and the same real-`agent-browser`-`press` + bubble-listener method
  (`Control+a`, `Alt+ArrowLeft`, read `event.defaultPrevented` back) found
  it was hijacking select-all and back-navigation. One-line fix
  (`if (e.ctrlKey || e.metaKey || e.altKey) return;` at the top of the
  handler), re-confirmed clean. Worth treating as a standard check on any
  future project with a global keydown handler, not something specific to
  music/instrument-shaped prototypes --- the bug class is about the input
  binding shape (bare key, global listener, unconditional
  `preventDefault`), not the domain.
- A precise follow-up on the modifier-key lesson above, confirmed on crit 4's
  thirteenth run with a real CDP `agent-browser press Shift+F` (not a
  synthetic dispatch): Shift changes `event.key` for a letter (`"f"` →
  `"F"`), so a handler that lowercases before matching (as Aurora Keys'
  keydown handler does) still fires and still calls `preventDefault()` on a
  Shift+letter combo. This is *not* the same bug class as Ctrl/Cmd/Alt+letter
  --- Shift+bare-letter isn't a live OS/browser shortcut on its own the way
  those modifiers are, so there's nothing to hijack. Don't extend the
  modifier-guard lesson to Shift by pattern-matching on "it's a modifier
  key" without checking whether that specific modifier actually gates a real
  shortcut; confirm with a real `press <Modifier>+<key>` and read
  `defaultPrevented` back rather than assuming symmetry with Ctrl/Cmd/Alt.
- A single-letter global keyboard scheme (an interaction bound to bare
  letter keys on `keydown`, not scoped to a focused element) can collide
  with screen-reader browse-mode quick-navigation keys (NVDA/JAWS: `h` =
  next heading, `b` = next button, `f` = next form field, etc.) --- those
  letters get consumed by the AT before they ever reach the page's own
  listener when no widget has focus. Checked this reasoning against Aurora
  Keys' `a s d f g h j k` scale on crit 4's thirteenth run and concluded
  it's not an operability bug worth chasing: as long as every interactive
  element the scheme controls is *also* reachable and operable via its own
  native semantics (here, `<button>` elements with `Tab` + `Enter`/`Space`,
  which focus mode in modern screen readers passes through regardless of
  browse-mode quick-nav), the letter shortcuts are a sighted/mouse-first
  enhancement layered on top of a fully keyboard-operable page, not the only
  path to the interaction. General lesson: when a page binds global
  single-letter hotkeys, check whether the same functionality has an
  independent, always-available path (native semantic element + standard
  keyboard activation) before treating an AT quick-nav collision as a
  blocking a11y bug --- it's real, but only load-bearing if the hotkey is
  the *sole* way to reach the behaviour.
- An eighth technique, found on crit 4's fourteenth run once the modifier-key
  lesson's own family (app-vs-browser keyboard shortcuts) had already gone
  dry twice: the same "does the page fight the browser's own input handling"
  question applies to touch/zoom gestures, not just keyboard shortcuts, and
  `getComputedStyle` cannot see it. Aurora Keys had `touch-action: none` on
  `body`, added so a pad drag wouldn't also trigger page scroll/zoom.
  `touch-action` is not inherited the normal CSS way --- its real effect on a
  given touch is the *intersection* of the touched element's value with
  every ancestor's, resolved by the browser's own gesture recognizer, not
  the CSS cascade. `getComputedStyle` on a descendant only ever shows that
  element's own specified value (`auto`), unchanged whether or not an
  ancestor's `none` is silently overriding it for real touches --- so this
  class of bug is invisible to the single most-reached-for sensor
  (`getComputedStyle`) in this whole crit's toolkit. Because `body` wraps the
  entire page, the one declaration killed pinch-zoom everywhere (header
  link, hint text, all of it), not just over the instrument, and axe-core's
  `meta-viewport` rule never caught it since it only checks the viewport
  `<meta>` tag, not CSS `touch-action`. Fixed by moving the declaration to
  the one element (`.stage`) whose gesture actually needs it; confirmed with
  `getComputedStyle` reads before/after (`body`/`header a`: `none` → `auto`)
  plus a synthetic two-pointer drag proving the stage's own gesture was
  unaffected. General lesson: whenever a `touch-action` (or any CSS property
  with composited/intersection semantics rather than plain inheritance --
  `touch-action` is the main one in practice) is set on a broad ancestor for
  one specific interaction's sake, check it against the narrowest element
  that actually needs it, not the container it was convenient to write it
  on --- and don't trust `getComputedStyle` on descendants to reveal the
  problem, since it won't.
- No `/ship` skill and no `gh auth` are available to me in this environment
  (confirmed on crit 2: `gh auth status` reports not logged in, and no
  ship-shaped skill appears in the session's skill listing). A prior hand-off
  note for a different repo listed "push, run `/ship`" as a next action, but
  that was this agent guessing at a step, not something actually available to
  run --- doctrine.md says outright "you never receive its GitHub
  credential." The routine's step 6 is just "push the clean tree"; flipping
  a repo from private to public and triggering the CI sweep is the trusted
  harness's job, done separately from any run of mine, not a command I issue.
  Don't plan a next action around running `/ship`.
- A ninth technique, closing out the "does the page fight the browser's own
  input/gesture handling" family the seventh technique (above) opened: once
  a broad `touch-action` fix is scoped down, explicitly re-check the two
  adjacent things that kind of fix could plausibly have collateral effects
  on, rather than assuming the fix is clean because the one symptom it was
  built to address is gone. On crit 4's fifteenth run, checked (1) whether
  dragging inside the now-narrowly-scoped element still selects text ---
  confirmed no, via a real mouse-drag gesture across a `<button>` label
  reading `window.getSelection().toString()` back empty, while the same
  drag over ordinary page text (a `<p>`) selected normally, proving the
  scoping is exactly as narrow as intended rather than accidentally still
  broad --- and (2) whether the viewport `<meta>` tag or any CSS separately
  restricts pinch-zoom (`user-scalable`/`maximum-scale`), which it didn't.
  Neither check found a new bug, but both were genuinely open questions a
  prior hand-off had explicitly flagged as unchecked, not a re-run of a
  question already answered --- confirming a fix's boundary is exactly
  where you drew it is legitimate deepening, not busywork, once the fix
  itself is already landed.
- A tenth technique in the app-vs-browser-input-handling family the seventh
  technique opened: check whether a keydown handler calls `preventDefault()`
  on *every* branch a matched key can take, not just whether it guards the
  right modifiers. On crit 5 (`comp4020-crit5-dachi`, Swerve), the handler
  only called `preventDefault()` for Space/Enter when `gameOver` (to gate the
  restart), so Space during live play --- where the game itself does nothing
  --- fell through to the browser's default page-scroll. Invisible at both
  marking viewports, where the page never overflows, and invisible to a
  static `getComputedStyle`/layout check for the same reason. The fix earlier
  in this same repo (`resize()`'s 0.5 minimum scale floor, so a fixed-aspect
  canvas never shrinks below half its logical size) is exactly what made the
  bug reachable at all: a short-enough viewport forces the canvas taller than
  the window despite the letterbox, and only then does Space's default
  scroll have anywhere to go. Confirmed with a real `agent-browser press
  Space` and `window.scrollY` at a viewport (390×250) deliberately chosen to
  break that "canvas always fits" invariant --- `98` before the fix, `0`
  after (`preventDefault()` called unconditionally for Space/Enter, `gameOver`
  gates only the `resetGame()` call). General lesson: when a control's
  default browser action is only suppressed conditionally, the condition
  itself can be exactly the branch where the page's own layout invariants
  are most likely to have quietly broken --- test at a viewport chosen to
  break the invariant on purpose, not just the two marking viewports where
  by design it never does.
- The 320 CSS px reflow check (documented above under its first use, on
  assignment 1) transfers cleanly to a from-scratch canvas-free instrument
  page too, not just a chat-log-style layout: run for the first time on
  `comp4020-crit4-dachi` (Aurora Keys) on crit 4's fifteenth run, confirmed
  clean both at rest and mid-drag across the pad row
  (`document.documentElement.scrollWidth === innerWidth` throughout).
  Worth treating as a standard once-per-project check on any future
  deliverable, not something to re-derive project by project.
- For a canvas/DOM game whose real state (score, lane, spawned-row list) is
  closed over inside `main.ts` and never attached to the page, `agent-browser
  eval` can't read it directly --- there's nothing in the DOM to query. A
  temporary `window.__debug = () => ({ ...state })` assignment at the bottom
  of the entry module, added only for the playtesting session and removed
  before the commit (diffed with `git diff` to confirm it's gone), turns
  `agent-browser eval "window.__debug()"` into a real state probe: poll it on
  an interval to see exactly which lane/row/whatever is about to matter, react
  with the correct input, and confirm the mechanic is fair rather than
  guessing from a screenshot's visual read alone. Used on crit 5 (`Swerve`) to
  verify collision/restart/scoring end-to-end and to catch that a `press`
  landing after a collision already happened (per the debug probe's own
  timestamp) correctly fell through to a restart rather than a stray move ---
  confirming the "any input after game-over restarts" design rather than
  exposing a bug. Also surfaced that repeated CLI round-trips (`open`,
  `screenshot`, `eval`, each with real subprocess/network overhead) can easily
  cost more wall-clock than a tight in-game reaction window allows, so an
  automated "loss" mid-investigation may be an artefact of tooling latency,
  not the game being unfair --- cross-check against the probe's own state
  (did a row's `y` already cross the collision threshold in the same read
  that shows the loss?) before concluding the game itself is too harsh.
- For a `prefers-reduced-motion` check on a **canvas** animation (as opposed
  to an animated CSS property, which `getComputedStyle` polling already
  covers), `getComputedStyle` has nothing to read --- a canvas draws to a
  bitmap, not the DOM. The equivalent sensor is monkeypatching the specific
  draw call the animation drives (e.g. wrap `ctx.arc` via `agent-browser
  eval`, log every radius passed to it, call the original) and comparing the
  set of distinct values with and without the media feature forced. On crit
  5 (Swerve), forcing `reduced-motion: reduce` collapsed the player marker's
  pulse to a single repeated radius (`20`), while the default state produced
  69 distinct values across one second --- confirming the existing
  `!reducedMotion` guard in `main.ts` actually disables the animation rather
  than just narrowing it. Same underlying question as the `@property`
  registration check from crit 4 (does a value that's supposed to vary
  continuously actually do so, or does it silently collapse to a toggle),
  applied to a different rendering surface --- intercept the draw/write call
  itself when the sensor you'd normally reach for (computed style, DOM
  attribute) can't see the surface the animation lives on.

## Local checks vs CI's linkinator

Correction to an earlier belief in this section: `pnpm dlx linkinator
./dist --silent` (no `--recurse`) **does** request external `https://`
hrefs found in the markup --- on crit 2 it consistently flagged a real,
required `https://ffmpeg.org` link as broken in this sandbox. Diagnosed
via `curl -v` timing, raw `node -e "fetch(...)"` tests, and DNS/IPv6
checks: ffmpeg.org's host does a genuinely slow (8--12s) TLS handshake,
and Node's fetch/undici stack (what linkinator and `WebFetch` both use)
times out or `ECONNRESET`s where `curl` (no default timeout) succeeds;
this sandbox also has no IPv6 route (`ENETUNREACH`), which broke a
second link (gyan.dev) the same way. Other hosts (example.com,
wikipedia.org, github.com) were fine via Node fetch in the same
sandbox --- this looks host- and sandbox-specific, not a general
linkinator limitation. Practical upshot: a local linkinator failure on
an external link is not proof the link is actually dead --- cross-check
with a plain `curl -L` (which has no default timeout and tolerates slow
handshakes) before concluding a required, real link needs to be
dropped, and treat a genuinely slow-but-live source as an accepted risk
to confirm against the real CI run post-push rather than something to
route around by removing the citation. Separately, before linking to
any external site at all, `curl -s -o /dev/null -w "%{http_code}" -L -A
"Mozilla/5.0" <url>` it directly first --- sites with bot protection
(Smarthistory, the Met) returned 403/429 even to a real UA, and would
have broken the CI-gated links check. Prefer stable, crawler-friendly
sources (Wikipedia has never bounced a plain GET) over richer but
bot-guarded ones, except where the source itself (e.g. the actual
organisation's site in a redesign crit) is the point and can't be
swapped out.

A clean 200 from that `curl -L` check is necessary but not sufficient: it
follows redirects silently, so a specific article page that's been
retired can 301 to its section's generic homepage and still return 200
--- the link resolves, just not to what you meant to cite. Caught this on
crit 1 trying to add a UNESCO Silk Roads essay URL: `curl -L` said 200,
`WebFetch`-ing the same URL showed it had landed on a generic hub page,
not the article. Read what a candidate link actually renders (WebFetch or
a browser), not just its status code, before citing it as a specific
source.

## The static-prototype template

Two stack facts from `comp4020-crit4-dachi`, likely to recur on any future
deliverable built on this same Vite/TS static template:

- A spec test that wants to assert "the page ships client-side JS" can't
  select the built bundle by a filename pattern derived from the source file
  (e.g. `script[src*="main"]`) --- Vite names the built script chunk after
  the **HTML entry point**, not `main.ts`, so it comes out `index-<hash>.js`.
  Assert `script[type="module"]` instead.
- `tsc --noEmit` (strict mode) does not carry a top-level
  `if (!x) throw` null-narrowing into functions *defined and called later* in
  the same module, even for a `const` --- narrowing doesn't cross function
  boundaries. Fix is to re-bind the checked value to a second,
  explicitly-typed `const` right after the guard, once, rather than adding
  `!` at every later use site.

## Working style

- The doctrine's "more than 24h: plan/build/deepen, inside 24h: finish"
  split is worth taking literally --- don't write `PROCESS.md`'s final
  citations or the week's `reflections/` entry until the commit history
  that they'd cite is actually close to settled. Writing them early just
  means rewriting them later.
- Commit in small, logically separate chunks even when a run produces a
  lot of new content in one sitting (e.g. delete-the-JS-scaffold,
  theme-CSS, home-page, content-pages, links-page as five separate commits
  rather than one dump) --- the process trail is graded, not just the
  final state.
- When content and checks are both already exhausted (nothing new to
  build, nothing new to verify) but the clock still has more than 24h on
  it, don't default to a fourth identical re-verification pass. Check
  whether the deliverable repo's own `CLAUDE.md` has actually grown
  --- on crit 1, three runs of re-verification produced real lessons
  (no-JS forcing CSS-only animation, the reduced-motion live-check
  method, contrast fixes) that all landed only in this global memory,
  while the project's own `CLAUDE.md` was still the unmodified starter
  template. The doctrine and the starter repo's own text both call this
  out as process evidence a marker reads directly, so writing project
  lessons into the deliverable's `CLAUDE.md` (not just here) is
  legitimate deepening work, not busywork.
- Sensor exhaustion is also a cue to draft `PROCESS.md` and the
  deliverable's `reflections/` entry early, not just to grow `CLAUDE.md`.
  On assignment 1, once every independent sensor family (logic-symmetry,
  DOM-completeness, full browser sweep, reduced-motion, copy-precision,
  response-to-brief scoping) had each gone dry on a repeat pass, the next
  run drafted both evidence files with 39h still on the clock rather than
  running a further re-verification pass or waiting for <24h --- the
  commit history was already rich and settled, so writing early meant
  writing once, and left room for the doctrine's own "more than 24h:
  plan/build/deepen" reading to still apply if a later logic fix ever
  displaces one of the chosen `PROCESS.md` moments. Don't treat ">24h to
  cutoff" as a blanket reason to keep re-verifying once every sensor
  family the project has invented has independently confirmed clean more
  than once.
- That said, "sensors exhausted" and "clock nearly out" are two separate
  conditions, and the assignment 1 precedent above had both (39h left,
  itself well inside a much shorter remaining runway than a full week).
  On crit 4's fourth run, sensors were similarly exhausted (a fresh
  asymmetry pass over `main.ts` turned up only a confirm) but 120.5h ---
  most of the full 168h window --- was still on the clock, only ~28% of
  the week elapsed. Chose to update `PROCESS.md` (already an incrementally
  -maintained artefact, safe to extend) but held off on drafting
  `reflections/crit-4.md` --- that file is explicitly a "final run"
  finishing step in the doctrine, and locking in "the breakthrough" this
  early risks describing a story the rest of the week's work outgrows.
  Weigh both signals before drafting the reflection early: sensor
  exhaustion alone, at hour 28 of a 168-hour week, is not yet the same
  situation as sensor exhaustion with only a handful of hours left.
- **My available sensors can verify correctness and accessibility, but cannot
  evaluate aesthetic/creative "feel" --- don't invent speculative creative
  changes to compensate for a dry bug-hunting well.** On crit 4's sixth run,
  a fresh full read of `main.ts`/`styles.css` plus a live browser interaction
  check (real synthetic `PointerEvent` gesture, console watch, a11y re-audit)
  both came back clean for the second consecutive checkpoint --- a genuinely
  dry sensor well, with still >100h on the clock. The obvious next lever,
  "deepen the instrument's expressiveness" (e.g. map pointer x-position to
  pan/vibrato, reshape an envelope), was considered and rejected: browser
  automation, a11y audits, and console logs can confirm a gesture doesn't
  crash and reaches WCAG bars, but none of them can tell me whether a sound
  *feels* better --- that judgement needs human ears, and the brief for this
  particular crit says so outright ("Latency, feel... none of that shows up
  in a test suite"). Making an unverifiable creative change on spec risks
  making the instrument worse with no way to notice. General lesson beyond
  this one crit: when doctrine's "deepen" step is otherwise open-ended, check
  whether the deepening actually needed is something your sensors can judge
  before inventing new sensor-checkable work as a proxy for it --- if the
  real judge is a human audience the prompt hasn't given you access to yet
  (a pod's live crit, a stakeholder's review), the correct move is to do
  *less* this run and wait for that feedback to actually arrive, not to
  manufacture a substitute.
- When a single edit pass touches a shared partial across several files
  (e.g. adding one new page's link to every page's nav) alongside an
  unrelated content edit on one of those same files, `git add
  <that-file>` for the content commit silently pulls the nav change in
  too --- the diff no longer matches what the commit message describes.
  Check `git diff --staged` against the intended commit message before
  committing, not just `git status`, whenever a cross-cutting change
  (nav, footer, shared partial) overlaps a per-page content edit in the
  same run.
- A11y audit and reduced-motion check aren't the only sensors worth
  running once and not repeating: an actual `agent-browser screenshot`
  pass at both marked viewports (390×844 and 1920×1080) across every
  page is a distinct check from either --- it catches wrap/overflow
  layout regressions that axe-core and `getComputedStyle` don't look
  for at all. On crit 1, once content and both a11y/motion sensors were
  already confirmed clean with >24h still on the clock, this was the
  one genuinely new (not-yet-run) sensor left, rather than a fourth
  identical re-verification pass. Like the others, run it once per
  content-stable period, not every run.
- Two more sensors in the same family, distinct from a11y/reduced-motion/
  screenshot: keyboard-only operation and mid-interaction resize. Neither
  is exercised by an axe audit (static markup properties) or a plain
  screenshot (a single fixed state). `agent-browser press Tab` repeated
  N times plus reading `document.activeElement` after each confirms
  actual tab order (not just that elements are theoretically focusable);
  `press Enter` on a focused control confirms it's keyboard-activatable,
  not just clickable. `agent-browser set viewport <a> <b>` after already
  interacting with the page (not on a fresh load) confirms state survives
  a resize, not just that each viewport looks fine in isolation. Assembly
  1's marking rubric names both explicitly for its top artefact band
  ("holds up under use it wasn't designed for: the keyboard, a resize
  mid-interaction"), which is what surfaced these as worth checking
  --- likely worth doing on any interactive prototype, not just when a
  rubric says so. Same rule as the others: once per content-stable
  period.
- When every browser-level sensor (a11y, keyboard, resize, full walkthrough,
  slow-connection sizing) is already exhausted and re-running any of them
  would just repeat a prior run's exact result, look for an *asymmetry* in
  the core logic's own test coverage before concluding there's nothing left
  to build. On assignment 1, `context.test.ts`/`interaction.test.ts` covered
  shrinking the context window (eviction) thoroughly but never asserted the
  reverse --- widening it after eviction to bring a message back into view,
  which the code already handled correctly (`reconcileList` in `main.ts` is
  symmetric) but which no test named. Found by re-reading the actual
  render/reconcile code with fresh eyes rather than re-running any browser
  check, then added both a pure-logic test (`buildContext` with a widening
  window) and a DOM-wired one (`select` → `change` event flips recall back
  from forgotten to known) in
  [`38999e4`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-dachi/commit/38999e4).
  General lesson: "nothing new to verify" should mean re-reading the pure
  logic and its test file side by side for asymmetric coverage, not just
  re-running the same external sensors again.
- That asymmetry hunt generalises past the pure logic module to any
  DOM-observable side effect the render function itself produces. A second
  pass over `main.ts`'s `render()` (not just `context.ts`) found two more:
  the token meter's `is-warn`/`is-full` classes (a real colour change per
  the stylesheet) and the `aria-live` eviction announcement's singular/
  plural wording --- both real "visitor does something that changes what
  they see" behaviour, neither named by any test. Added five DOM-wired
  tests driving the composer with precisely-sized text (character count is
  a direct lever on token count via the `ceil(length/4)` approximation) to
  land the meter at exact known percentages, in
  [`0855fe0`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-dachi/commit/0855fe0).
  Doing this surfaced a distinct, more general bug class below.
- **A shared-DOM test fixture leaks mutated element state across tests
  unless every test resets everything it can touch, not just what the
  app's own reset control clears.** A test file that imports the app once
  in `beforeAll` and reuses one `document` across all `it()`s, clearing
  state via a `beforeEach` click on the app's own reset button, only
  resets what that button resets. On assignment 1, the reset button
  intentionally leaves a `<select>` (window size) untouched, matching real
  UI behaviour --- so an earlier test that changed the select's value
  leaked that value into every later test in the file, invisibly, until a
  new test happened to assert against the default. Fix was cheap
  (explicitly reset the select in `beforeEach` too) but the bug was
  latent for as long as no test depended on the leaked-over default.
  General lesson: when writing this shared-fixture-plus-reset-button test
  pattern, enumerate every piece of mutable DOM state a test can touch and
  reset all of it in `beforeEach`, not just what the app's own reset does
  --- test isolation and app-reset behaviour are two different contracts,
  and conflating them hides order-dependence bugs until a coincidence
  exposes them.
- **The sharpest version of asymmetry hunting is checking whether two
  functions meant to *agree* on a predicate actually agree, not just
  whether each is individually tested.** On assignment 1, `main.ts` had a
  "has this fact ever been stated" gate and `context.ts` had a `canRecall`
  check that only runs once that gate passes --- the two exist specifically
  to cooperate. The gate matched case-sensitively; the recall check
  lowercased both sides. Both functions already had test coverage, so a
  naive "is X tested" pass would have called this done --- the bug only
  surfaced by asking "if I feed the same untested input class (lowercase
  free text) to both, do they still agree," which no single function's own
  tests would ever ask. Worth making this an explicit second question after
  "what's untested" in any future asymmetry pass over a codebase with
  cooperating predicates: for every pair of functions/branches meant to
  agree on the same fact, do they normalise their shared input
  (case, whitespace, trimming, rounding) the same way?
- **A sixth asymmetry-hunting pass (assignment 1) found a bug that lived
  inside a single function, not between two cooperating ones.**
  `buildContext`'s eviction loop looked FIFO but was actually "skip whatever
  doesn't individually fit the remaining budget, keep trying older items
  against the same leftover space." Every existing test used uniform-sized
  messages, which always coincidentally produced a contiguous prefix and
  hid the bug through five prior passes. Real mixed sizes could evict a
  newer, larger message while keeping an older, smaller one visible ---
  backwards from the demo's own "oldest first" claim. Caught by asking a
  new question, not by re-running the previous ones: for a function whose
  test fixtures all share some unexamined property (here, uniform size),
  what happens when that property is varied? Confirmed with a throwaway
  `node -e` reproduction before touching source. General lesson for future
  asymmetry passes: after "do two functions/branches agree," also ask "do
  this function's own tests all share a property that could be masking a
  whole behaviour branch" --- uniform input size, all-ASCII text,
  all-positive numbers, inputs drawn only from a fixed set rather than free
  text, etc. Full writeup and fix in `comp4020-ass1-dachi`'s own
  `CLAUDE.md` (commit `6020844`).
- **Not every asymmetry pass finds a bug, and that's not a wasted pass.**
  A seventh pass on assignment 1 checked the two candidates the sixth
  pass had flagged as untested but plausible-looking, and both turned
  out fine: a single message alone bigger than the whole window (a real,
  reachable branch no fixture had varied) evicts correctly per the
  contiguous-oldest-first invariant, and a `Math.max(1, ...)` floor
  turned out to be genuinely dead code (never engages for any reachable
  input) rather than a live edge case. Confirmed both with a `node -e`
  repro before writing anything. Lesson: writing the test that proves a
  suspicious-looking edge case is actually fine, and removing code that
  turns out to never fire, is itself legitimate deepening work --- don't
  treat "confirmed correct" as a null result that should have been
  skipped. It's also a signal, not noise: when a pass over the same
  pair of files starts turning up confirmations instead of defects, the
  seam is thinning and it may be time to look elsewhere (browser
  sensors, PROCESS.md prep) rather than force an eighth identical pass.
- **That signal can still be wrong --- an eighth pass on assignment 1
  found a real bug by asking a question per *side effect*, not per
  function.** A render function that fans one state transition out into
  several DOM-observable side effects (here: transcript membership, a
  meter's CSS classes, an `aria-live` announcement's text) can have one
  side effect thoroughly tested for a given direction of that transition
  while a sibling side effect is never asked the same question. Assignment
  1's widening test proved messages come back into view when the window
  grows; nothing asked whether the *announcement* handled that same
  reversal, and it didn't --- it only ever updated on new evictions, so
  widening left a stale, false "N messages just fell out" sentence sitting
  in a screen-reader-visible (`sr-only`, not `aria-hidden`) region.
  Fixed by adding the symmetric branch and a regression test, confirmed
  live in a real browser before calling it done. Full writeup in
  `comp4020-ass1-dachi`'s own `CLAUDE.md` (commit `275c3b2`). General
  lesson: when a function has already had its coverage checked
  side-effect-by-side-effect once, the next asymmetry pass shouldn't ask
  "is anything still untested" again but "does each side effect handle
  every direction of the shared transition, not just the one a prior test
  happened to exercise" --- particularly for any control (like a
  window/size selector) that makes an otherwise one-way transition
  reversible.
- **When logic-symmetry asymmetry hunting over a page's core state
  functions goes two-for-two on confirms-only (no bug found), the next
  reusable lens isn't a harder version of the same question --- it's a
  different question about the same control: does a reset/clear button
  actually reset *every* piece of mutable DOM state on the page, or only
  what the core render function redraws from its own state every cycle?**
  On assignment 1, nine passes over `context.ts`/`main.ts`'s eviction and
  recall logic (the last two confirming no bug) never asked this about the
  page's Reset button, because it's a different kind of question ---
  "what does this control forget to clear," not "do these two functions
  agree." Enumerating every element with mutable state (not just the ones
  `render()` writes each cycle) found a real one: an unsent composer
  draft and its live token-count preview survived Reset, sitting stale
  next to a freshly-zeroed transcript and meter. Confirmed live in a real
  browser before touching source. Full writeup in
  `comp4020-ass1-dachi`'s own `CLAUDE.md` (commit `2b38115`). Worth
  reaching for this lens specifically once a project's own state-symmetry
  asymmetry hunting has gone quiet, rather than assuming quiet
  logic-symmetry checks mean the page has no more bugs to find.
- **`comp4020-crit4-dachi` (Aurora Keys) is now finished --- 15 runs, seven
  real bugs found, final run pushed clean and shipped.** Worth keeping as a
  calibration point for future crits' expected depth: real bugs kept
  surfacing well past the point where the obvious browser-level sensors
  (a11y, keyboard, resize, reduced-motion, screenshots at both marking
  viewports) had all gone clean, by inventing progressively narrower
  questions (logic-symmetry, listener-placement, multi-writer shared state,
  animated-custom-property registration, app-vs-browser shortcut/gesture
  collisions) rather than re-running the same sensors. The final run itself
  was uneventful by design: one last not-yet-tried sensor (a live
  `Tab`/`Shift+Tab` walkthrough) came back clean, then the finishing steps
  (evidence check, `reflections/crit-4.md`, commit, push) were mechanical
  because `PROCESS.md` and this repo's own `CLAUDE.md` had already been kept
  current run by run --- there was no scramble to reconstruct the story at
  the end. That's the payoff of the "write findings into the project's own
  files immediately, not just here" habit already threaded through the
  entries above: a final run should mostly be finishing steps, not
  discovery.
- An eleventh technique in the app-vs-browser-input-handling family (the
  seventh and tenth techniques above): the mouse-button analogue of the
  modifier-key keydown lesson. On crit 5's sixth run, after three
  consecutive code-level passes and a full browser sweep had gone clean,
  `comp4020-crit5-dachi`'s (Swerve) canvas `pointerdown` handler turned out
  to move or restart the player for *any* mouse button, since it never
  checked `e.button` --- a right-click silently steered the player (or
  restarted a finished round) exactly like a left-click, while the
  browser's own context menu still opened on top of the result. Same bug
  shape as the modifier-key lesson (a whole-element/whole-region listener
  treating input variants as equivalent when they aren't) but one level
  down: keyboard handlers need a modifier guard, pointer handlers bound to
  game-state need a button guard. Confirmed two ways: a real CDP
  `agent-browser mouse down/up right` (proving the browser genuinely
  dispatches `pointerdown` with `button: 2`) and a synthetic
  `dispatchEvent(new PointerEvent('pointerdown', {button: 2, ...}))` via
  `agent-browser eval` to sidestep this sandbox's CLI round-trip latency
  outrunning Swerve's short reaction window (the same latency risk logged
  under the debug-probe entry above) --- reading back an `aria-live`
  region's text showed a right-click left a game-over announcement
  untouched while an immediately following left-click still triggered a
  restart, and pixel-reading the player's canvas position confirmed a
  live-round right-click didn't move it either. Fixed with
  `if (e.button !== 0) return;`, safe for touch/pen too since the Pointer
  Events spec mandates `button === 0` for any primary-contact pointerdown
  regardless of device. General lesson: whenever a pointerdown/pointerup
  handler drives app/game state from a whole-element listener (not just a
  keydown handler from a whole keyboard region), check the `button` field
  specifically --- it's a distinct check from touch-action scoping and
  multi-touch id-tracking, both already covered elsewhere in this file, and
  easy to miss because it only shows up against a non-primary button, never
  the ordinary left-click/tap a normal playtest exercises.
- A twelfth technique in the app-vs-browser-input-handling family, distinct in
  shape from the eleven above: those all guard against a different *input
  variant* landing on the *same* target (a modifier held, a non-primary
  button); this one guards against the *same* input landing on a *different*
  target the page also makes focusable. On crit 5's seventh run, Swerve's
  global keydown handler called `preventDefault()` on Enter unconditionally
  (to gate restart-on-game-over), with no check of what actually had focus
  --- so a keyboard user tabbing past the canvas to the page's own header
  `Home` link and pressing Enter to activate it got nothing, because the
  page-wide handler consumed the keydown before the link's native activation
  behaviour ever ran. Confirmed with `agent-browser`: attach a `click`
  listener on the anchor via `eval`, real `press Tab` then `press Enter`,
  read the listener's flag back --- `false` (never fired) before the fix,
  with a same-page bubble listener separately confirming
  `event.defaultPrevented: true`; `true` (fires normally) after. Fixed with a
  `(e.target as HTMLElement).closest("a, button, input, select, textarea")`
  guard at the top of the handler, before any key-specific branch --- cheaper
  and more general than special-casing the one link, since it covers any
  future focusable element (a button, a form field) the page might grow.
  Re-confirmed arrow-key movement still works both unfocused (`e.target` is
  `body` on a fresh load, matching prior behaviour) and canvas-focused.
  General lesson: a global (not per-element) keydown handler is invisible to
  this bug for as long as the page has no other focusable element to collide
  with --- the moment a page bound to one such handler grows *any* second
  tabbable thing (a nav link, a button, a settings control), check that the
  handler skips when focus is on it, the same way it already has to skip on
  a held modifier or (for pointer handlers) a non-primary button.
- A thirteenth technique, distinct from the app-vs-browser-input-handling
  family above: those all arbitrate between the page and the browser itself;
  this one arbitrates between the page and an assistive technology sitting on
  top of the browser. On crit 5's ninth run, `comp4020-crit5-dachi` (Swerve)
  moves the player only via bare arrow keys on a `window`-level `keydown`
  listener, bound to a `<canvas>` that had `tabindex="0"` and an
  `aria-label` but no explicit `role` --- which resolves to the implicit
  HTML-AAM role `img` (confirmed via `agent-browser eval
  "document.querySelector('canvas').getAttribute('role')"` reading `null`;
  axe-core doesn't flag this, it's outside axe's rule set). A screen reader's
  browse-mode virtual cursor (NVDA/JAWS) claims bare arrow keys for its own
  quick-navigation by default, and only stops doing so for elements whose
  role puts the AT into focus/forms mode --- a generic `img`-role focusable
  element doesn't qualify, so a blind user tabbing to the canvas could have
  every arrow-key press eaten by their own AT before it ever reaches the
  page. Distinct from the single-letter-hotkey-vs-quick-nav collision logged
  for Aurora Keys (not treated as blocking there, because native `<button>`
  elements gave an independent accessible path to the same functionality) ---
  Swerve has no alternate control, so this is a can-a-screen-reader-user-
  play-at-all question, not a redundant-path one. Fixed with
  `role="application"` on the canvas, the standard technique for a canvas
  game that needs raw keystrokes handed straight to the page. No real
  NVDA/JAWS/VoiceOver was available to confirm AT behaviour directly in this
  sandbox, so verification was necessarily partial: `pnpm check` green, a
  fresh `agent-browser a11y --json` still 0 violations/0 incomplete with the
  role present, and a real `agent-browser press ArrowRight`/`ArrowLeft`
  sequence (reading the player's x position back by monkey-patching
  `CanvasRenderingContext2D.prototype.arc` via `eval`, since the position is
  a closed-over module variable with nothing in the DOM to query) still
  moved the player between lane centres exactly as before the change,
  confirming the fix is additive and doesn't touch the working keyboard path
  for sighted/mouse users. General lesson: for any canvas- or div-based
  interactive prototype whose only input path is a global keyboard listener,
  check the interactive element's *implicit* ARIA role (not just whether
  `aria-label` is present) before calling keyboard access done --- a
  non-interactive implicit role is invisible to axe and to every sensor this
  project's prior eight runs had already tried, since none of them model an
  AT's own claim on the same keys the page is listening for. Full detail in
  `comp4020-crit5-dachi`'s own `CLAUDE.md` (commits `55c1dd5`, `840b110`).
- A variant of the "does a reset control clear everything, not just what it
  redraws" lens (assignment 1's Reset-button entry above), applied to timing
  constants rather than DOM state: when a playtesting fix's own rationale
  names a *specific* state-entry path (here, Swerve's `START_GRACE_PX` spawn
  delay, added because a *fresh-load* stranger hadn't yet learned the
  controls), check whether every other path that reaches the same starting
  state --- a restart, a reset, a retry --- actually replays that same fix,
  or only the one path the original playtest happened to exercise. On crit
  5's eleventh run, `resetGame()` zeroed `spawnAccumulator` instead of
  restoring the grace offset, so a restart got ~0.8s less runway before the
  first row than a fresh load did. Confirmed by timing (via the project's
  own temporary-debug-probe technique) how long a stationary player has
  before the first row reaches the collision line from each entry path
  (~4.99s fresh load vs ~4.19s restart). Not every such gap is a bug to
  close, though: here it was examined and left alone, since the fix's
  purpose (onboard a stranger who doesn't know the controls yet) doesn't
  apply once the player has already died once and learned them --- the
  general lesson is to *ask* the question explicitly for any fix scoped to
  one entry path, not to assume symmetry closes automatically.
- A fourteenth technique, and the first in this whole crit-4/crit-5 series
  answered by arithmetic instead of a live `agent-browser` check: for a
  rAF-driven game, whether a backgrounded tab's frame-rate throttling (a
  real, large gap between frames when a player alt-tabs away and back)
  could let a stale `dt` cause an unfair instant loss or a burst of rows
  spawning at once. On crit 5's thirteenth run, this was ruled out just by
  reading the constants: Swerve's `frame()` clamps `dt` to
  `Math.min(0.05, ...)` regardless of real elapsed time, and even at the
  game's own top speed cap, one clamped frame can't advance the spawn
  accumulator far enough to cross more than one row-spacing threshold ---
  both bounds are explicit numeric literals in the source, so multiplying
  them out settles the question the same way assignment 1's "is this
  branch actually reachable" `node -e` repros did, with no browser
  round-trip needed. General lesson: before reaching for a live sensor
  (`agent-browser`, a debug probe, a monkey-patched draw call), check
  whether the invariant in question is already pinned down by an explicit
  numeric clamp or threshold in the code --- if the worst case is a literal
  multiplication away from the bound that would break it, arithmetic is a
  legitimate, cheaper substitute for observation, not a corner cut. Only
  reach for a live check when the invariant depends on real DOM/timing
  behaviour a script would actually have to observe (unregistered
  `@property` animations, `touch-action` intersection semantics, AT
  keyboard arbitration) rather than a bound the source already states
  outright.
- A concrete data point for the "sensors exhausted vs. clock nearly out are
  two separate conditions" working-style lesson (first logged against crit
  4 at 28% of the week elapsed): crit 5 drafted `reflections/crit-5.md` at
  65.5h to cutoff, ~61% of the 168h window already elapsed, after five
  consecutive dry runs (four browser-level sensor passes plus the
  arithmetic one above) across every sensor family the project had
  invented. Worth the contrast: crit 4 at 28% elapsed chose to keep
  `PROCESS.md` current but explicitly held off on the reflection, since
  that much of the week still had room for the story to change; crit 5 at
  61% elapsed, with the same "sensors dry" signal, drafted it. Use rough
  fraction-of-week-elapsed, not just "sensors are dry" alone, when deciding
  whether a run should draft the reflection early --- dry sensors this
  early in the week is not yet the same situation as dry sensors this late
  in it.
