# POBO season coverage, negotiations, and rotation

**Goal** — Make the season feel played, make counteroffers understandable, and make lineup choices easier to compare.

**Architecture** — Use saved game results and the existing schedule for Home. Describe the existing counteroffer engine's actual answer and changed assets in Trade. Reuse the current lineup operation, player production, and salary schedule in Rotation.

**Tech stack** — React, TypeScript, SCSS, IndexedDB, Vitest, and Chrome DevTools.

- [ ] Season coverage, stacked on #24. Lead regular season and playoffs with a matchup, club record, recent form, and a linked final score with the club's scoring leader. Use the arena for quieter phases and support hidden scores, missing data, and mobile.
- [ ] Negotiation feedback, stacked on #25. Explain the opponent's answer and actual player/pick changes. Surface any rules issue separately, leave the offer editable, and preserve the ability to undo.
- [ ] Simple rotation, stacked on #24. Group starters and bench, show production and current salary with expiration in each row, and provide a named swap for an eligible bench player. Keep contract detail, filters, and read-only views.
- [ ] Validate every branch independently. Check preseason and active games, hidden scores, counteroffer/retry/undo, starter changes, contract details, and both viewport sizes. Report checks and dependencies in each PR.
