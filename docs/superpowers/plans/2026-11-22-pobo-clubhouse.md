# POBO Clubhouse Implementation Plan

**Goal** — Put the next game, required correspondence and roster decisions at the top of the basketball front office. Keep detailed views reachable within the same workflow.

**Architecture** — Relayout the existing Clubhouse panels using the current view payloads. Reuse the worker's unread-message lock and the message route's priority order. Keep the roster display preference and the existing table.

**Stack** — React, TypeScript, SCSS, IndexedDB and Chromium.

**Approved design** — Modern front office, followed by a separate trade-matching PR.

- [ ] In the dashboard worker and Clubhouse Dashboard, expose the unread lock, link to the next required message, move the upcoming opponent and rotation ahead of news and standings, and withhold performance ranks until games are played.
- [ ] In Inbox and Message, give required mail a direct action and render the selected letter before the correspondence list in mobile reading and keyboard order.
- [ ] In Controller and Roster, add a skip link and put the roster view switcher before report and table content. Keep columns, sorting, export and rotation controls available.
- [ ] Validate disposable leagues at 1440, 1024 and 390 px in both themes, plus a narrow inbox check. Exercise required/advisory mail, empty and active schedules, roster mode switching and horizontal table containment. Run the basketball tests, lint and production build.
- [ ] Deliver this branch independently. Start salary matching from the shared base, with inclusive boundary coverage and a single source for preview, counteroffer and execution.
