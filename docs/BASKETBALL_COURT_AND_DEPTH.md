# Basketball court and positional depth

## Product change

Court & depth is the new default for current five-a-side basketball rosters.
A compact club masthead replaces the banner. The court presents the selected
five, with PG/SG/SF/PF/C depth alongside it. Selecting a role ranks the roster
for that role and opens a scouted strengths/limitations report. Hybrid positions
and strong secondary fits are visible together. Rotation and the full lineup
table retain existing stats, contracts, transactions and coaching controls.

Make starter replaces the player occupying the selected projected slot with a
bench player in the actual roster order. All player IDs and other order slots
are preserved. The existing worker reorder action persists the change and turns
off automatic sorting. Only editable user rosters expose the action. Scouting
placement is recalculated after each change; the coach controls in-game roles.

Financial context depends on PR #11: ordinary screens show a short line and
relevant risks, with objectives and the full report in Finances. The visual
workspace uses basketball court geometry, portraits and position language.
Basketball's home navigation is named Front office; other sports retain their
existing labels and behavior. No data or iOS project is removed.

## Positional model and its limits

The existing simulator uses individual composite skills and lineup synergies,
including handling/passing/shooting, interior/perimeter defense and rebounding.
It also checks broad position balance during substitutions. It does not assign
a fixed efficiency percentage to an individual PG/SG/SF/PF/C slot.

The new model is an explanatory scouting projection, not a new simulation rule.
Each role weights its relevant attributes (weights sum to one). Listed roles
include G→PG/SG, GF→SG/SF, F→SF/PF and FC→PF/C. Secondary role labels consider
the gap from that player's strongest projected role, plus minimum handling,
mobility and physical requirements. Strong fit is within eight points with a
score of at least 55; Situational within eighteen with a score of at least 40;
otherwise Emergency. Strong, defensively aware rebounders can compensate for
limited height at center. Listed role describes the position on record.
Scoring determines role-specific candidate order, while the court optimizer
assigns each of the existing five starters once, maximizing total projected
role score with a small listed-role preference. It never selects new starters.

Inputs use the same scouting fuzz as displayed ratings (height remains unfuzzed,
as in the existing formatter). Profiles are not sent when ratings are hidden;
the UI then uses only listed positions to arrange players and rank depth. No
underlying true-rating role scores or efficiency percentages are displayed.
Injuries are shown separately; fit describes skills, not availability.

The UI explains these limits in How positional fit works. An actual new
position-assignment/efficiency simulation system would need its own rules,
balancing, AI and save migration PR; this delivery does not pretend to implement
one through a display-only number.

## Compatibility and validation criteria

- Existing saves need no migration. Current non-five-a-side basketball leagues
  fall back to Rotation; historical rosters retain their full table.
- Short rosters show vacant slots; duplicates are rejected by the optimizer.
- Hidden ratings never produce role profiles in the worker payload or UI.
- Selection/search/report controls work with mouse, keyboard and mobile.
- Starting changes persist after reload and the following game uses the updated
  roster order. Other teams and spectator mode stay read-only.
- Dark/light themes and 1440/1024/390/320px layouts are inspected in production.
- Pure model tests cover hybrid roles, differing secondary fits, physical
  limits, invalid inputs, unique assignment, vacancies and starter replacement.

## Verified delivery

- 634 tests pass, 12 skipped; full ESLint and TypeScript pass. The final mobile
  interaction was checked again with targeted ESLint and TypeScript.
- Production build 2026.11.02.1239; disposable Chromium leagues in both themes
  at 1440/1024/390/320px. Court cards are neither clipped nor overlapping and
  the page has no horizontal overflow. A mobile court selection moves focus
  and the viewport to that position's depth panel.
- Position selection, candidate ranking/report, empty search, player links,
  Rotation, full table and coaching remain accessible. Rival and spectator
  rosters expose no starter-edit action.
- A starter change persisted after reload; a real regular-season game recorded
  one game started for the promoted bench player. Roster IDs were conserved.
- The hidden-ratings worker message contains no position profiles and the UI
  uses listed roles only. Three-a-side falls back to Rotation. A three-player
  roster shows two vacancies rather than duplicating players.
- An initial local test run collided with a production build removing the
  shared generated schema; the completed-build run passed all tests. No
  product-code workaround or relaxed assertions were used for that collision.
