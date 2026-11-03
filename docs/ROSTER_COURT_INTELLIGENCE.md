# Court & depth: salary, production and roster balance

The court and every positional candidate now show the current annual salary,
expiration year, remaining contract years, age, scouted role strengths and
production (PTS/REB/AST per game). Candidates also show minutes/games played,
salary-cap share and role limitations without opening a report. Full positional
reports and variable annual salaries remain available in details; the existing
rotation, table, coaching controls and actual starter replacement remain intact.

Remaining years include the active salary season, advancing to the upcoming
season after the playoffs. Expired contracts say renewal pending. Drafted-player
non-guaranteed contract indicators continue to use the shared contract component.
Salary-cap percentages compare salary only, excluding luxury tax and released
salary. The five-player subtotal describes the selected starters, not payroll.
No production is invented for players who have not played in the selected season
and season type.

The assistant coach compares six areas against nonempty active teams in the
current league. Each team uses its first eight players in lineup order, weighted
equally. Injured players remain in the full-strength projection, with an explicit
availability count. This is a scouting outlook, not actual team statistical
rankings, a minutes forecast or a simulation modifier. Changing the real lineup
or roster refreshes the report through the existing roster update events.

Inputs are fuzzed using normal scouting uncertainty, except known size/reach.
Rebounding, three-point shooting, perimeter defense and interior defense use the
positive component weights of the corresponding basketball simulation composites.
Size uses the height/reach rating; creation uses handling, passing and offensive
reads. Only the derived report is sent to the client, not opponents' raw ratings.
Hidden-ratings mode suppresses both report and role-strength data at the worker
and UI. Historical rosters do not receive a misleading current-league report.

Ranks count scores greater by more than 0.01; tied scores share a rank. A strength
must exceed at least ceil(75% of teams), and a weakness must trail that many.
Fewer than four nonempty teams and fully tied leagues receive no pronounced
strength/weakness claims. The report recommends covering up to two weaknesses
and preserving up to two strengths; it does not invent a problem in a balanced
league or prescribe a trade without regard to salary.

Validation: 660 tests passed, 12 skipped; ESLint and TypeScript. Production
Chromium QA uses disposable leagues, covering annual contract schedules,
contracts/strengths visible on court and in candidates, controlled real-league
rank comparisons, search and all five positions, a persisted starter swap and
the promoted player's next-game start, hidden-ratings payload suppression,
read-only rival/spectator views, 3v3 fallback and vacancies. Light/dark layouts
are checked at 1440, 1024, 390 and 320 pixels for overflow and overlapping or
clipped court tiles, including long player names.
