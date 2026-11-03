# Clubhouse basketball UI

The basketball client uses a shared Clubhouse visual system on every routed screen. Other sports retain their existing navigation and presentation.

- `clubhouse.scss`: locally hosted Barlow Semi Condensed / Inter, explicit light/dark contrast, compact controls, club navigation and command search.
- `clubhouse-desk.scss`: the daily briefing, correspondence list, unread filters and full message reader. News, standings, fixtures, portraits and finances come from the current league.
- `clubhouse-screens.scss`: full data-table workspaces, player dossier, positional depth, trade proposal, owner office and modal presentation.

Detailed tables, column selection, filtering, export, roster alternatives and actions remain available. The briefing's rotation table includes contracts and production. The court view retains salary, duration, strengths and production; selecting a position exposes alternatives and the existing coach report. Artwork uses the league's existing team logos and player photos/faces. No stock or generated portrait is assigned to an unrelated player.

## Reproduce the visual gallery

Start the basketball production preview on port 3002, then run with Node 24 and Playwright's Chromium installed:

```sh
node tools/qa/clubhouseGallery.mjs .tools/clubhouse-gallery http://localhost:3002
```

The script creates a new isolated browser context and a disposable league, simulates a completed season and the start of another, and captures one representative state of each safe league route. It also captures rotation/table variants, column customization, contract negotiation and command search. It writes an HTML gallery, PNG images and a JSON manifest with warnings and JavaScript errors. It checks desktop and mobile page overflow; selected primary screens also get mobile images. God Mode is enabled only in this disposable league to cover management tools. Phase-specific pages retain their actual availability messages. Destructive workflows and live simulation screens are excluded. The gallery does not exhaust every season, filter, dialog or parameter combination.

Screenshots and league fixtures are generated review artifacts, excluded from source control. The user can inspect the gallery separately from their own saved games.

## Validation

Use the regular TypeScript, ESLint, test and production-build checks. In addition to the gallery, verify both themes, narrow viewports, hidden ratings, read-only rival rosters, message read isolation, keyboard search, and the roster's contract/position/starter interactions. A screenshot is evidence of rendering, not proof of every action on that screen.
