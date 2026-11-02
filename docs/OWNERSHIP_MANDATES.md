# Ownership: a mandate, decisions and an evidence-based review

## Experience

The owner issues a personal letter before decisions are judged. It explains the
franchise's starting point, its named rotation leaders, the owner's financial
personality and the agreed plan. Rebuilding targets address rotation talent,
age, young core candidates and first-round capital. Compete-now targets retain
rotation quality and set explicit wins/playoff expectations. Both retain the
owner's salary-plus-tax budget and profit requirements when finances are on.

Targets and instructions are saved on the team for the financial season. They
are not recomputed because a trade went wrong or the team strategy changed.
Offseason mandates belong to the upcoming season and continue into preseason;
they do not generate duplicate letters. The next letter references the previous
annual review when one exists. Bulk auto-play keeps its existing job-evaluation
exemption and suppresses mandate-letter spam.

The Owner's Office lives in Team Finances, linked from the existing financial
context. It has the agreement, live target status, injury evidence, an executed
decision journal and the last annual review. Objectives are not repeated across
ordinary screens. Trades receive one compact advisory disclosure before proposing
the deal; an owner conflict does not block an otherwise legal trade.

## Measurable criteria

Rotation talent uses the scouted overall ratings of the strongest eight players,
with empty slots contributing zero. Rotation age and young-core counts refer to
that rotation, not young end-of-bench filler. Young core candidates are 25 or
under and have scouted OVR >= 50 or POT >= 60. In hidden-rating leagues, sorting
and core criteria use the known rotation order/ages and no talent target is set.
UI payloads also redact existing talent values when hidden ratings are enabled.

A rebuilding mandate asks for three points of rotation-talent growth, a one-year
reduction of average rotation age (floor 22), two-to-six young core candidates
depending on the starting core, retained firsts in the next three drafts and a
35% win rate. It does not require playoffs. A contender retains talent within
one point, meets its owner's existing win-rate target and qualifies for playoffs;
the winning-first owner additionally requires a series win. Bench filler and
cutting the weakest rotation members cannot raise the talent score.

Rebuilding growth can earn at most +0.35 roster-execution mood; failure can lose
0.35. Routine contender maintenance earns no automatic bonus. Failed depth/pick
guardrails lose 0.08 each. Each executed trade conflicting with an explicit
instruction loses 0.08, capped at 0.32 per mandate, in the existing roster/playoff
component. These are management-evaluation rules, not changes to player ratings,
game simulation, trade legality, AI willingness or difficulty settings.

## Decision evidence

Rebuild instructions flag net first-round spending on players aged 28+, and
moving a protected baseline young rotation player without comparable young
talent (within five scouted OVR or POT points) or a net first-round gain.
Compete-now instructions flag a loss of three rotation-talent points, with an
explicit exception for material budget relief while already over budget. Relief
must close the remaining gap or save at least 5% of the roster-cost budget, so
a legitimate multi-step cleanup is recognized and a token saving is not.
Crossing the roster-cost budget is recorded when finances are enabled.

The same function generates preview feedback and records the executed trade.
Evidence includes sent/received player names, trading partner, event link,
season/phase, positives and conflicts. A preview never records a decision.
Trade undo removes its journal entry while preserving unrelated injury evidence.
There is no generic claim that every aligned trade is a good trade: feedback
states which explicit instructions were or were not breached.

## Circumstances and consequences

Only actual games count. Before player injury state is updated after a game, the
tracker checks the named baseline rotation's players on their current team. An
injured DNP counts; a healthy DNP, played-through injury, all-star game or injury
on another team does not. Game IDs prevent duplicate evidence. The initial top
three are the named core; the initial eight form the tracked rotation. New
acquisitions are not retrospectively added to this baseline injury allowance.

Regular-season win-rate context is capped at eight percentage points, also
bounded by the actual target shortfall and observed core absence rate. It never
credits additional wins, excuses cost or reverses a transaction conflict.
Playoff injury absences are reported separately without awarding unearned series.
Wins need ten post-mandate games (or the shorter configured season length).
Late adoption with fewer games also leaves new roster milestones ungraded;
pre-existing financial evaluation remains intact. No old injuries or trades are
reconstructed from forecasts or assumed causal stories.

The annual review states the plan, targets, observed outcomes, context and
conflicting decisions. It changes the existing owner mood and therefore job
security, and is applied once. Its saved evidence is a snapshot. The standard
grace period, God Mode, spectator and multi-team exemptions remain. The $500M
salaries-plus-tax / second-apron red line and explicit firing challenges remain
authoritative regardless of injuries, growth or prior goodwill.

## Saves and verification

Optional Team.ownerMandate and TeamSeason.ownerReview require no migration.
Old saves receive a prospective mandate when first tracked. Both fields survive
JSON export/import; the league schema recognizes them. Invalid active mandate
structure is replaced prospectively. Season changes create new clean evidence
without overwriting archived reviews. Source and meaningful model/integration
tests ship in the same feature PR; production browser QA uses disposable leagues.

Verified: 655 tests passed and 12 skipped, ESLint and TypeScript. Production
Chromium checked a new mandate letter, frozen age/talent targets, a real injury
game, an accepted trade against explicit instructions, undo and re-execution,
then a complete manually simulated season and annual review. The owner recorded
78 actual baseline-core injury absences and applied a bounded 3.8 percentage-point
win-assessment allowance while retaining the trade conflict. The upcoming
mandate referenced that review. Full export/import preserved both records.
The office was inspected in light/dark mode at 1440px and 390px without overflow.
