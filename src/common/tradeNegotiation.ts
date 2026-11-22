import type { TradeTeams } from "./types.ts";

export const tradeNegotiationKey = (teams: TradeTeams) =>
	JSON.stringify(
		teams.map(({ tid, pids, dpids, pidsExcluded, dpidsExcluded }) => [
			tid,
			pids.toSorted((a, b) => a - b),
			dpids.toSorted((a, b) => a - b),
			pidsExcluded?.toSorted((a, b) => a - b) ?? [],
			dpidsExcluded?.toSorted((a, b) => a - b) ?? [],
		]),
	);
