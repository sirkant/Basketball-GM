# Annual contract salaries

Basketball negotiations offer flat, increasing and decreasing salary profiles.
Variable profiles require at least two years and use fixed annual steps of 5%
of first-year salary. For a given duration, all profiles have the same guaranteed
total as the existing flat offer. The UI shows total guarantee, average salary,
first-year salary and each payment before signing. Current roster finances and
offer-specific first-season impact are expandable. Roster and trade cards also
expose the signed annual schedule.

The optional `contract.schedule` stores raw annual salaries in thousands of
dollars. `contract.amount` remains the active salary for existing game, UI and
trade consumers. Phase finalization synchronizes scheduled salaries when the
salary year changes; payroll queries also resolve the applicable year directly.
The salary log stores actual annual payments. Released guarantees retain their
own independent schedule. Import/export preserves the schedule, and contracts
without one retain their previous flat behavior with no save migration.

Negotiation legality and MLE use are based on first-year salary. Every annual
amount must respect the league's current minimum/maximum contract settings;
variable profiles cannot use the game's flat minimum exception. Future salary
increases do not create a present hard-cap violation. Trade AI contract valuation
uses average remaining obligations rather than treating a cheap first year as
the price of every remaining season. News reports show the actual guarantee.

## Scope

This is the first feature in `FEATURE_ROADMAP.md`. It does not yet implement
8% Bird/extension profiles, options, partial guarantees or arbitrary annual
editing. Existing contracts and AI-generated new demands remain flat; AI trade
valuation and all shared financial rules understand scheduled contracts. The
next feature adds a visual multi-year planner and explicit projection assumptions.

## Verification

Unit/integration coverage includes total preservation, fixed initial-salary
steps, fractional remaining obligations, old-contract compatibility, signing
and undo, first-year exception eligibility, annual minimum/maximum safeguards,
salary rollover, contract transfer, released guarantees, formatting units and
import validation. Production Chromium verification covers all three profiles,
mobile layout, signing and undo, roster/finance displays, a full simulated season,
reload persistence and a complete export/import round trip in disposable leagues.
