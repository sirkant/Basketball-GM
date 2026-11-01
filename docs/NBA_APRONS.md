# Basketball apron and ownership model

The model applies to basketball leagues using the soft salary cap. Difficulty
does not change these rules. Other sports and hard-cap/no-cap leagues keep their
existing financial rules.

## Rules implemented

- First and second apron thresholds scale with the cap. Their offsets above the
  league's configured tax line use the official 2026-27 NBA system levels.
- Trades have a $1M matching tolerance per team and operation, including above
  the first apron. This is an explicit gameplay rule, not an NBA CBA allowance.
  It does not relax apron thresholds, taxes, active hard caps or pick restrictions.
  Second-apron independent salary matching shares the same single $1M allowance;
  the allowance never multiplies with the number of players in the package.
  Second-apron trades cannot aggregate
  outgoing salaries to acquire larger incoming contracts. Independent matching
  of several contracts is allowed. A salary-reducing trade can escape an apron.
- Expanded matching activates a first-apron hard cap. Aggregation activates a
  second-apron hard cap. The more restrictive previously activated cap remains
  binding, including on renewals and minimum signings. The salary-year state
  carries from free agency into the following season and expires the next summer.
- Non-taxpayer, taxpayer and room mid-level exceptions have shared annual
  spending limits, maximum contract lengths and the corresponding hard-cap
  effects. Minimum-exception contracts are limited to two years. AI and user
  signings use the same legality checks.
- High-salary players waived during the regular season cannot be signed by a
  team whose resulting payroll exceeds the first apron.
- Luxury tax uses the CBA's progressive rates from 2025-26 onward. Brackets scale
  from the 2023-24 cap. Paying tax in three of the preceding four salary years
  triggers repeater rates. Tax distributions go to non-taxpaying teams.
- A second-apron regular-season finish freezes the team's first-round pick seven
  drafts ahead. Two further second-apron finishes in the next four seasons move
  it to the end of the first round; three finishes below unfreeze it. Penalized
  picks cannot win the lottery. Existing saved state survives export/import.

The regular-season snapshot is taken at the transition into the playoffs, before
any further roster management. This is the game's transaction boundary following
the last regular-season game.

## Ownership and UI

Owners have a persistent winning, profit, low-payroll or balanced priority. The
dashboard and finances screen show the resulting win, profit and roster-cost
targets. Preseason messages state expectations; annual evaluations assess wins,
playoffs, profits, salaries plus tax, and lost apron flexibility. AI transaction
valuation includes the marginal roster cost and recovering flexibility.

The owner's $500M red line is a game rule, not an NBA regulation: spending at
least $500M in salaries plus tax while finishing above the second apron causes
automatic dismissal at the annual evaluation, even after a championship or
during the introductory grace period. God Mode and the existing spectator,
multi-team and automatic-play evaluation exemptions retain their usual behavior.
Disabling budgets also disables ownership's financial penalties.

Warnings appear on the dashboard, roster, finances, free-agent and renewal
screens. Trade previews show resulting payroll, tax and activated hard caps.
Negotiations show offer-specific financial projections and legal restrictions.

## Boundaries of the existing game

This implements apron consequences in the game's supported transaction model;
it is not a complete NBA CBA simulator. Sign-and-trades, cash in trades,
non-simultaneous traded-player exceptions, biannual exceptions, detailed Bird
service eligibility, cap holds, bonuses and daily exception proration are not
currently modeled. Their addition would require separate transaction and
contract systems. Existing custom cap/tax settings are respected, and historical
leagues use this modern ruleset rather than recreating every historical CBA.

## Sources and validation

- [NBA/NBPA CBA, Article VII](https://nbpa.com/cba)
- [Official 2026-27 system levels and exceptions](https://www.nba.com/news/nba-salary-cap-2026-27-season)

Tests cover CBA tax examples, hard-cap lifecycle, MLE limits, buyout restrictions,
trade aggregation and undo, frozen-pick progression and draft position, and
guaranteed dismissal regardless of championship results. Browser verification
includes a full-season simulation and desktop/mobile financial warnings in an
isolated temporary league.
