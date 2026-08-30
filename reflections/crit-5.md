# A game

The breakthrough came from a check that had nothing to do with the game
logic itself: reading a `<canvas>` element's *implicit* ARIA role rather
than trusting an axe-core audit that had already come back clean five runs
in a row. Swerve's only input is a bare arrow key on a `window`-level
listener, so a screen reader's browse-mode virtual cursor claiming those
same keys for its own quick-navigation is a can-a-blind-player-play-at-all
gap, not a cosmetic one --- and it's a gap axe-core's own rule set doesn't
model, because an implicit role isn't a violation of anything. Finding it
meant asking a genuinely new question of the page rather than re-running
the sensors that had already gone quiet. The `START_GRACE_PX` spawn delay
was the other moment that mattered for a different reason: it's the one
fix in the whole run that came from playing the finished build with real
input, not from reading `main.ts`, and it's the brief's own bar for what a
game repo has to show.

What this changed about the developer I want to be: a green check suite and
a clean automated audit both measure exactly what they were built to
measure, no more --- and the bugs worth finding live in the gap between
what a tool models and what a real player (mouse, keyboard, or assistive
technology) actually does. Six real bugs surfaced this way, each from
asking a narrower, more specific question than the last, not from
re-running a broader one. The discipline I want to keep is naming that
next question explicitly, rather than treating a quiet sensor pass as
proof there's nothing left.
