import { g } from "../util/index.ts";
import { defineView } from "../util/defineView.ts";
import { team } from "../core/index.ts";
import hasTies from "../core/season/hasTies.ts";
import { PHASE } from "../../common/constants.ts";
import type { RouteParams } from "../../ui/router/types.ts";
import { validateSeason } from "../util/processInputs.ts";

import { addPowerRankingsStuffToTeams } from "../core/team/powerRankings.ts";
export { addPowerRankingsStuffToTeams } from "../core/team/powerRankings.ts";

const processInputs = (params: RouteParams<"powerRankings">) => {
	let playoffs: "playoffs" | "regularSeason" =
		g.get("phase") === PHASE.PLAYOFFS ? "playoffs" : "regularSeason";
	if (params.playoffs === "playoffs") {
		playoffs = "playoffs";
	} else if (params.playoffs === "regularSeason") {
		playoffs = "regularSeason";
	}

	return {
		playoffs,
		season: validateSeason(params.season),
	};
};

export default defineView({
	id: "powerRankings",
	processInputs,
	load: async ({ inputs: { playoffs, season }, updateEvents, prevInputs }) => {
		if (
			(season === g.get("season") && updateEvents.has("gameSim")) ||
			season !== prevInputs?.season ||
			playoffs !== prevInputs?.playoffs
		) {
			const teams = await team.getFormattedAll({
				attrs: ["tid", "depth", "playThroughInjuries"],
				seasonAttrs: [
					"won",
					"lost",
					"tied",
					"otl",
					"lastTen",
					"abbrev",
					"region",
					"name",
					"cid",
					"did",
					"imgURL",
					"imgURLSmall",
				],
				stats: ["gp", "mov", "pts", "oppPts"],
				season,
				showNoStats: true,
			});

			const teamsWithRankings = await addPowerRankingsStuffToTeams(
				teams,
				season,
				playoffs,
			);

			let ties = false;
			let otl = false;
			for (const t of teams) {
				if (t.seasonAttrs.tied > 0) {
					ties = true;
				}
				if (t.seasonAttrs.otl > 0) {
					otl = true;
				}
				if (ties && otl) {
					break;
				}
			}

			return {
				confs: g.get("confs", season),
				divs: g.get("divs", season),
				playoffs,
				season,
				teams: teamsWithRankings,
				ties: hasTies(season) || ties,
				otl: g.get("otl", season) || otl,
			};
		}
	},
});
