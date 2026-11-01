# Trade workspace

The trade proposal is now a full-width exchange between two receiving-team cards, above the asset selectors. Each side shows incoming and outgoing salary and payroll before/after the deal. Removing players and picks remains available directly from the exchange. Blocking feedback appears once below the exchange; propose, counteroffer, clear, save and undo actions keep their existing behavior.

The financial report is collapsed by default behind **Financial impact & rules**, with the combined roster cost visible in its summary. Active or newly triggered hard caps and the owner's guaranteed-dismissal red line remain visible without opening the report. The $1M matching tolerance is identified separately. The old sticky sidebar and computed height clipping have been removed so alerts cannot consume the exchange's available height.

Basketball asset selectors use searchable player cards with portraits, position, age, scouted ratings, production and contract. Players and draft picks have separate tabs with selected counts. Individual counteroffer exclusions are clearly labelled, and the full table retains detailed statistics and bulk exclusions. Other sports retain table-based asset selection. Hidden-rating challenges also hide skill labels on the cards.

The existing league remains in the browser's storage; this feature introduces no save migration or changes to the trade AI. The salary-tolerance rule is isolated in PR #7.

Validation: 611 tests passed, 12 skipped; ESLint and TypeScript; production build. Chromium production checks cover $1M matching with both teams above the apron, rejection one dollar beyond tolerance, visible receiving cards, collapsed reports, player search, pick addition/removal, counteroffer exclusions, saved proposals, the detailed table, mobile overflow, critical owner feedback and hidden ratings. Browser component tests verify that disclosures do not hide hard caps or the owner's red line.
