# A basketball league with a memory

Reference reviewed: [BBGM League Explorer](https://icamcmusic-ship-it.github.io/bbgm-league-explorer/),
including its public sample league, home, season newspaper and release notes.
The useful pattern is connected context: a season has a story, its protagonists
lead to careers and rosters, and historical comparisons explain why a result
matters. Its readable headings, quiet secondary data, section navigation and
links between entities are more relevant here than copying its whole feature set.

## First delivery: League chronicle

League History opens on a chapter browser. Search a season, franchise, player or
award, narrow to a decade, or follow the current franchise's championship-final
appearances. Sixteen years are rendered at a time; long archives stay navigable.

The selected chapter explains the transition from the previous recorded season:
repeat champion, three-peat, longer consecutive run, changing champion, or a
reversed championship matchup. It shows both finalists, regular-season records,
the actual series result when retained, individual honours and their cumulative
recorded counts. Links lead to the actual rosters, franchise history, season
summary, bracket, draft and standings. The complete existing table remains a
separate view, with its sorting, search, columns and exports.

This delivery uses existing saved history. It requires no migration or duplicate
history store, does not change simulation or finances, and does not add recurring
historical panels to roster/trade screens. Other sports retain the existing view.

Missing seasons/results break title streaks. Missing team metadata does not
support rivalry or dynasty claims. Counts explicitly cover recorded history,
not unknown years before the archive. Award `winner` arrays contain a ranked
ballot: only the first entry is the winner, never every listed candidate.
The series score is only shown from an actual retained playoff series; it is
not reconstructed from a team's regular-season record or seed.

## Next delivery: Franchise chapters

Give Team History a timeline of competitive eras: win percentage and playoff
results, championship runs, changing core players and continuity. Pick an era
to see its roster and the players' production and salary at that time. Include
historical team names and relocation context; never silently substitute today's
identity for a historical roster. Preserve the seasons and career-stat tables.

## Following delivery: Careers that connect

Build a career timeline around actual team stints, peaks, awards, injuries and
earnings. Connect players through shared seasons and playoff encounters. Draft
classes can be revisited against their observed production, distinguishing an
unfinished career from a concluded outcome. Surface relevant record chases in
the player's profile and pregame context rather than adding an omnipresent feed.

## Following delivery: Decisions and consequences

Trace trade assets to their eventual players and picks; link moves to roster
production, salary commitments and the owner's original mandate. Show measured
outcomes over explicit time windows, including missing data and players still
developing, instead of an unexplained universal trade grade. Add end-of-season
recaps connecting sporting results, injuries, money and the POBO's decisions.

Each delivery gets its own branch/PR and browser validation with disposable
leagues. The visual direction is a readable basketball archive: typographic
hierarchy, team marks, restrained separators and clear paths into full data.

## First-delivery verification

Four model tests cover contiguous runs, unsorted seasons, gaps/deleted metadata
and the evidence required to describe a Finals reversal. Full suite: 664 passed,
12 skipped. ESLint and TypeScript pass. Production browser checks cover fresh
leagues, multi-decade archives, filters/paging, actual result/award links, the
original table, hidden-ratings mode, and light/dark responsive layouts.
