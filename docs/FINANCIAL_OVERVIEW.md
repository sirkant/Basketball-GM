# Financial overview

The shared roster-finance notice now separates payroll, projected luxury tax, and combined cost into clear metrics. Owner budget is displayed next to combined cost. The full panel shows payroll progress toward each apron and the exact amount above or below it, with text equivalents for screen readers. Apron room is explicitly distinguished from salary-cap space.

Current transaction consequences, activated hard caps, owner-budget overruns and guaranteed dismissal remain visible without opening any disclosure. Supporting rules, owner targets and the individual pick penalties are available through a native keyboard-accessible disclosure. Active pick restrictions are summarized outside it, including compact notices in contract and trade previews.

The panel uses the existing financial-status calculation. It changes no thresholds, taxes, legality checks, difficulty settings, or owner evaluations. Disabled ownership dismissals continue to be identified explicitly.

The companion browser regression tests cover exact apron boundaries, hard-cap visibility, the $500M dismissal boundary in compact mode, exemption handling, pick disclosures, disabled aprons, and accessible progress values when payroll exceeds a threshold.

Validation: 600 automated tests passed, 12 skipped, production build, and Chromium production checks of below-apron margins, active hard caps, red-line dismissal warnings, pick disclosure, contract negotiation, trade previews, team finances and mobile layout. The roster overview was also checked with the no-ratings challenge enabled.
