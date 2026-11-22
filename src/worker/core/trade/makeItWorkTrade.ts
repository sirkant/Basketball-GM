import { tradeNegotiationKey } from "../../../common/tradeNegotiation.ts";
import type { TradeTeams } from "../../../common/types.ts";
import { idb } from "../../db/index.ts";
import { helpers } from "../../util/index.ts";
import makeItWork from "./makeItWork.ts";
import summary from "./summary.ts";
import get from "./get.ts";
import { ValueChangeCalculator } from "../team/ValueChangeCalculator.ts";

type AssetChange = {
	side: 0 | 1;
	action: "added" | "removed";
	type: "player" | "pick";
	id: number;
};

type EvaluatedOffer = {
	offerKey: string;
	warning: string | null;
};

export type TradeNegotiationFeedback = EvaluatedOffer &
	(
		| { status: "noDeal" | "unchanged" }
		| {
				status: "counteroffer";
				changes: AssetChange[];
				previousTeams: TradeTeams;
		  }
	);

const getChanges = (before: TradeTeams, after: TradeTeams): AssetChange[] => {
	const changes: AssetChange[] = [];
	for (const side of [0, 1] as const) {
		for (const [key, type] of [
			["pids", "player"],
			["dpids", "pick"],
		] as const) {
			for (const id of after[side][key]) {
				if (!before[side][key].includes(id)) {
					changes.push({ side, action: "added", type, id });
				}
			}
			for (const id of before[side][key]) {
				if (!after[side][key].includes(id)) {
					changes.push({ side, action: "removed", type, id });
				}
			}
		}
	}
	return changes;
};

const makeItWorkTrade = async (): Promise<
	TradeNegotiationFeedback | { status: "stale" }
> => {
	const previousTeams = helpers.deepCopy((await get()).teams);
	const previousOfferKey = tradeNegotiationKey(previousTeams);
	const candidate = await makeItWork(helpers.deepCopy(previousTeams), {
		holdUserConstant: false,
		valueChangeCalculator: new ValueChangeCalculator(),
	});

	const { warning } = await summary(candidate ?? previousTeams);
	const trade = await get();
	if (tradeNegotiationKey(trade.teams) !== previousOfferKey) {
		return { status: "stale" };
	}

	if (!candidate) {
		return { status: "noDeal", offerKey: previousOfferKey, warning };
	}

	const changes = getChanges(previousTeams, candidate);
	if (changes.length === 0) {
		return { status: "unchanged", offerKey: previousOfferKey, warning };
	}

	await idb.cache.trade.put({ ...trade, teams: candidate });
	return {
		status: "counteroffer",
		offerKey: tradeNegotiationKey(candidate),
		warning,
		changes,
		previousTeams,
	};
};

export default makeItWorkTrade;
