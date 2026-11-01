# Basketball management roadmap

Every feature ships through its own branch and PR. Merge only after its checks
pass, then start the next dependent feature from validated master. Existing iOS
files, saves, difficulty settings and the $1M trade tolerance are preserved.

## 1. Annual contract salaries — implemented

Offer flat, increasing and decreasing salary profiles. The initial variable
profiles use 5% annual steps based on first-year salary, with the same guaranteed
total as the corresponding flat offer. Negotiation shows first-year salary,
average salary, guaranteed total and each annual payment before signing.

Store an optional annual schedule and retain current `contract.amount` for
existing consumers. Contracts without a schedule remain flat. Update payroll,
trade matching, tax, releases/dead money, remaining obligations, AI contract
valuation, export/import and season transitions. Current-year hard caps apply
to current-year cost; future apron exposure is not a current hard-cap violation.

Acceptance: correct annual charges across seasons and after trades/releases;
signing legality based on first-year salary; no minimum/maximum or exception
loopholes; signing undo and save round-trip preserve the schedule; old saves
remain unchanged. Unit, integration, full-suite and production-browser checks.

## 2. Three-to-five-year roster planner — planned; depends on 1

A visual annual overview of guaranteed commitments, expiring players, released
salary, cap room and apron exposure. Separate committed costs from projections
of future cap/tax levels. Compare signing/trade scenarios without changing the
league. Explain major changes in room and identify renewal years. Do not present
unsigned renewals or future cap growth as guaranteed.

Acceptance: planner reconciles with annual contracts and finances, scenarios
have no save side effects, assumptions are explicit, and mobile is usable.

## 3. Team and player options — planned; depends on 1 and 2

An optional final contract year with a clear decision deadline. Team options
exchange player security for club flexibility; player options carry retention
risk. Player preferences and AI valuations account for who controls the option.
An offseason decision inbox explains salary and roster impact before confirming.

Acceptance: exercise/decline occurs once at the correct phase; all manual, AI
and automatic-play paths resolve options; planner separates conditional costs;
transactions and import/export preserve option ownership and decision state.

## 4. Extensions before expiration — planned; depends on 1–3

Offer a future contract without overwriting remaining years of the active one.
Expose eligibility, start season and annual cost in the player's contract panel.
The player may prefer to wait; AI uses equivalent eligibility and valuation.
Research applicable NBA extension restrictions before implementation.

Acceptance: no overlapping salary schedules, double payment, early overwrite
or repeated extension exploit; future obligations survive trades and releases.

## 5. Three-team trades — planned; depends on 1 and planner cost utilities

Assign each outgoing player and pick an explicit destination. Show what each
participant gives/receives, matching difference, payroll impact and blockers.
Check every team independently using the same tolerance, hard-cap and pick
restrictions. Keep the current simple two-team flow available.

Acceptance: conservation and unique ownership of assets; AI consent from every
participant; atomic execution and complete undo; rejection leaves no partial
trade; counteroffers and saved proposals retain all destinations.

## 6. Player situation reports — planned; can follow 2 independently

An explanatory player overview covering current role/minutes, recent production,
development, injuries, contract horizon and reasons for renewal interest. Use
observed stats and existing mood components, expose scouting uncertainty and
respect hidden-rating challenges. Link each concern to a relevant action.

Acceptance: explanations reconcile with underlying data, small samples are
identified, unavailable information stays hidden, and mobile avoids wide tables.

## 7. Explained counteroffers — planned; uses 1, 2 and later 5

Explain whether the partner needs talent, picks, salary relief, shorter
commitments or a legal salary structure. Distinguish legality from willingness.
Suggest actionable adjustments without revealing exact hidden AI valuations or
promising acceptance. Respect assets marked as excluded from counteroffers.

Acceptance: reasons reflect the actual evaluation, recommendations respect all
participants' rules, and exclusions/saved offers/undo continue to work.

## Delivery discipline

Keep each feature independently reviewable and reversible. Implement the model
and the UI that explains it together. Include meaningful boundary, lifecycle and
compatibility tests; verify production UI on desktop and mobile in disposable
leagues. Record completed PRs and any remaining limitations here as work ships.
