import { PLAYER } from "../../../common/constants.ts";
import { player, team } from "../index.ts";
import getBest from "./getBest.ts";
import { idb } from "../../db/index.ts";
import { g, local } from "../../util/index.ts";
import { orderBy } from "../../../common/utils.ts";
import { shuffle } from "../../../common/random.ts";
import {
	apronsEnabled,
	checkApronSigning,
	saveApronState,
	currentApronState,
} from "../finances/nbaAprons.ts";
import { getApronLevels } from "../../../common/nbaAprons.ts";

/**
 * AI teams sign free agents.
 *
 * Each team (in random order) will sign free agents up to their salary cap or roster size limit. This should eventually be made smarter
 *
 * @memberOf core.freeAgents
 * @return {Promise}
 */
const autoSign = async () => {
	const players = await idb.cache.players.indexGetAll(
		"playersByTid",
		PLAYER.FREE_AGENT,
	);

	if (players.length === 0) {
		return;
	}

	// List of free agents, sorted by value
	let playersSorted = orderBy(players, "value", "desc");

	// Randomly order teams
	const teams = await idb.cache.teams.getAll();
	shuffle(teams);

	for (const t of teams) {
		// Skip the user's team
		if (
			g.get("userTids").includes(t.tid) &&
			!local.autoPlayUntil &&
			!g.get("spectator")
		) {
			continue;
		}

		if (t.disabled) {
			continue;
		}

		let probSkip;
		if (__SPORT === "basketball") {
			probSkip = t.strategy === "rebuilding" ? 0.9 : 0.75;
		} else {
			probSkip = 0.5;
		}

		// Skip teams sometimes
		if (Math.random() < probSkip) {
			continue;
		}

		const playersOnRoster = await idb.cache.players.indexGetAll(
			"playersByTid",
			t.tid,
		);

		// With forceHistoricalRosters, only sign FAs if we have to
		if (
			playersOnRoster.length >= g.get("minRosterSize") &&
			g.get("forceHistoricalRosters")
		) {
			continue;
		}

		// Ignore roster size, will drop bad player if necessary in checkRosterSizes, and getBest won't sign min contract player unless under the roster limit
		const payroll = await team.getPayroll(t.tid);
		const legalPlayers = [];
		if (apronsEnabled()) {
			const levels = getApronLevels(g.get("salaryCap"), g.get("luxuryPayroll"));
			for (const candidate of playersSorted) {
				const rule = await checkApronSigning(
					t.tid,
					candidate,
					candidate.contract.amount,
					candidate.contract.exp,
					false,
					payroll,
				);
				if (rule.error) {
					continue;
				}
				const hardCap = currentApronState(t)?.hardCap ?? rule.state?.hardCap;
				const reserve =
					Math.max(0, g.get("minRosterSize") - playersOnRoster.length - 1) *
					g.get("minContract");
				if (
					hardCap &&
					payroll + candidate.contract.amount + reserve >
						(hardCap === 1 ? levels.first : levels.second)
				) {
					continue;
				}
				legalPlayers.push(candidate);
			}
		}
		const p = getBest(
			playersOnRoster,
			apronsEnabled() ? legalPlayers : playersSorted,
			apronsEnabled() ? undefined : payroll,
		);
		if (p) {
			// Remove from list of free agents
			playersSorted = playersSorted.filter((p2) => p2 !== p);

			await player.sign(p, t.tid, p.contract, g.get("phase"));
			const rule = await checkApronSigning(
				t.tid,
				p,
				p.contract.amount,
				p.contract.exp,
				false,
				payroll,
			);
			if (rule.state) {
				await saveApronState(t.tid, rule.state);
			}
			await idb.cache.players.put(p);
			await team.rosterAutoSort(t.tid);
		}
	}
};

export default autoSign;
