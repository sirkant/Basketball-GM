# Basketball GM — franchise interface

## Direction

A basketball front office: clear club identity, disciplined typography, compact
player comparisons and visible consequences. Graphite navigation, warm paper
surfaces, forest green actions and restrained lime accents. Dark mode retains
its own readable surfaces. Existing team logos and player portraits supply the
identity; decorative court geometry is CSS, with no external asset dependency.

FM24's separation of persistent club navigation, contextual tabs and specialized
data views is the interaction reference. NBA 2K's franchise presentation is a
reference for sports identity, not a source of copied logos, screens or artwork.
Apple's influence is hierarchy, consistency and focus, not oversized whitespace.

References:

- https://community.sports-interactive.com/sigames-manual/football-manager-2024-touch-and-console/the-user-interface-r4972/
- https://community.sports-interactive.com/sigames-manual/football-manager-2024/your-squad-team-report-and-dynamics-r4957/
- https://newsroom-nl.2k.com/news/endless-possibilities-await-as-mynba-levels-up-in-nbar-2k26

## Audit

The old roster spends most of the initial viewport on a colored finance alert,
then repeats payroll in a team report. Equal-weight cards obscure comparison
between players and push the actual squad below the fold. Navigation looks like
a generic web admin. Dense data is valuable; its visual hierarchy needs work.

## Independent deliveries

1. **Foundation and squad**: scoped basketball shell, club masthead, compact
   financial position, ownership brief, row-based squad comparison, expandable
   player actions. Preserve the full data table, sorting, rotation, releases,
   coaching sliders, notes, historical rosters and hidden-rating rules.
2. **Player dossier**: portrait and role, performance, development and contract
   as distinct sections; keep every historical/statistical view accessible.
3. **Trade room**: two clubs, incoming/outgoing assets and central proposal;
   legality summaries beside confirmation, full rules on demand. Preserve
   counteroffers, excluded assets, picks, saved proposals and undo.
4. **Finance and future planning**: annual commitments and salary/tax/apron
   context; owner expectations beside financial decisions, clear assumptions.
5. **League home**: upcoming game, pending decisions and recent events; real
   game data, no fabricated insights or decorative KPI cards.

Each delivery has a separate PR and starts from validated master. This plan
supersedes the feature roadmap's immediate order for visual work; contract,
option, extension and simulation development remains separate.

## Design rules

The next revision follows direct gameplay feedback: court and PG/SG/SF/PF/C
depth take priority over the player dossier. Ownership objectives belong in
Finances, with only relevant risks in daily screens. See CONTEXTUAL_FINANCE_UI.md
and BASKETBALL_COURT_AND_DEPTH.md for the implemented interaction changes and
the distinction between scouting projections and simulator mechanics.

- One dominant task per screen; names and decisions before decoration.
- Preserve data density through aligned comparisons and specialist tables.
- Semantic colors indicate risk as well as text; healthy finance is neutral.
- Dismissal, over-budget, apron, hard-cap and pick risks remain visible even
  when detailed regulations are closed. No changes to difficulty or rules.
- Native links, buttons, search fields and disclosure controls; visible focus.
- Keep the existing theme preference, navigation and mobile drawer behavior.
- Scope foundational CSS to basketball; do not reskin the iOS project or other
  sports. Avoid global table/typography overrides that break dense tools.

## Acceptance and validation

Review production screenshots at 1440, 1024 and 390px in both themes. Check
unbroken navigation, drawer, hidden ratings, empty search, player actions,
annual salary disclosures, full-table rotation controls and historical views.
Exercise finance warning boundaries with disposable leagues. Record actual
contrast checks for text and focus; no page overflow or lost controls. Run
ESLint, TypeScript, the game test suite and a production build. Use disposable
browser contexts; never modify the user's local league for visual QA.

The first delivery intentionally keeps team report/coaching one disclosure away
in squad view, immediately visible in full-table mode. Financial detail remains
available in its original component. Other screens receive only the shell until
their dedicated delivery. Source components and production screenshots are the
reviewable design artifacts.

## Delivery 1 validation

- 624 game tests pass, 12 skipped; ESLint and TypeScript pass.
- Production build, checked at 1440, 1024 and 390px in light and dark themes.
- Disposable Chromium league: search/empty state, injury filter, player profile,
  annual contract disclosure, coaching sliders, full-table playing time and
  reset, mobile drawer, trade navigation and no horizontal page overflow.
- Hidden ratings stay hidden; salary-floor and second-apron/owner-dismissal
  warnings remain visible with the detailed financial disclosure closed.
- Measured text contrast: player names 16.57:1 light / 13.33:1 dark; muted role
  text 5.37:1 / 7.28:1; navigation brand 13.91:1 in both themes. These are sampled
  key styles, not a claim of a complete accessibility audit.
- Existing game logic, trade allowance, save format, difficulty and iOS files
  are unchanged. Other screens still need their dedicated design deliveries.
