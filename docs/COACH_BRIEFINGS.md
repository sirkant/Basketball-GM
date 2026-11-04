# Coach correspondence

Basketball Inbox now includes advisory staff reports and an **Ask coach for an assessment** action. These reports use the same team ratings and attribute ranks as Power Rankings, including injuries and play-through settings. They do not change player ratings, trade acceptance, difficulty, owner evaluation, or simulation tactics.

## Roster priorities

The coach checks three-point shooting, rebounding, defensive awareness, passing, and interior scoring. A bottom-third grade can produce a concrete request with a top-half coverage target. Full-strength grades distinguish temporary injury cover from a permanent roster gap. Regular-season scoring margin provides results context without treating ratings as results.

You can prioritize a request or keep the current plan. Follow-ups retain that decision, compare the current rank with the original baseline and target, and acknowledge when coverage improves. They do not claim that a particular trade caused the improvement. Older requests link to the newer assessment and cannot accept stale responses. Follow-up references use stable report keys because league imports regenerate message IDs.

Reports are created on phase changes and after simulation batches cross a ten-game window. Manual requests refresh changed scouting snapshots; repeated requests for an unchanged snapshot reopen the existing report. There is at most one automatic report per window rather than one message per simulation day.

## Playoff preparation

Each upcoming scheduled user-team playoff game gets a preview, including the opponent, venue, actual series score and game number, relative available talent, perimeter and rebounding threats, balance, and injury context. Scheduling the next game creates its report before that game is played. The assessment combines current roster grades with the opponent's regular-season shooting production where a sample exists. A talent edge does not suppress an opponent's shooting threat or imply a guaranteed win.

## Inbox behavior and compatibility

Coach correspondence is advisory and never blocks Continue. Mandatory unread owner mail still blocks and takes priority when opening the next unread message, even when more than ten newer coach messages exist. Inbox has a Coach filter. Challenge mode with hidden live ratings suppresses generation and redacts existing scouting reports in view payloads. Spectator mode cannot request or respond to staff advice.

All message fields are optional for old saves. Export/import preserves decisions and report relationships. The existing shared Power Rankings calculation was moved into a core helper without changing its ranking formulas; other sports retain their existing UI behavior.

## Verification

Common-model tests cover priorities, injury cover, response continuity, resolution, opponent shooting threats despite inferior overall talent, balanced versus uniformly weak opponents, and mandatory versus advisory mail. Disposable-browser integration covers report generation, response persistence, deduplication, ten-game follow-ups, next-game playoff scheduling, hidden-rating redaction, mobile widths, mandatory owner mail behind fifteen advisory messages, and export/import.
