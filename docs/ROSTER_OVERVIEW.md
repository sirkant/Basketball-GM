# Roster overview

Basketball's current-season roster opens with player cards. Each card shows the actual lineup role, portrait, position, age, scouted overall and potential changes, selected-season per-game production, contract, salary-cap share, health, trade restrictions, and renewal interest. Player profiles and existing trade workflows are directly accessible.

Situation filters identify expiring contracts, injured players, and trade restrictions. Search matches names or positions. Roles always use the original lineup order, including when a filter hides other players. The display choice persists in this browser. Historical seasons and other sports retain the full table.

The **Lineup & full table** button exposes the existing lineup editing, playing-time controls, detailed statistics, releases, and bulk actions. Overview cards do not reorder the lineup. Ratings and skill indicators respect the no-ratings challenge.

This feature changes presentation only. Contracts, injury recovery, transaction restrictions, scouting uncertainty, AI behavior, and difficulty remain governed by the existing simulation.

Validation: full automated suite (594 passed, 12 skipped), ESLint/TypeScript, production build, and Chromium production checks covering search, empty results, lineup roles under filtering, expiring/injured/restricted fixtures, disabled trades, persisted display selection, full-table access, and mobile layout.
