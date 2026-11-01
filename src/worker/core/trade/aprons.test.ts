import { beforeEach, expect, test } from "vitest";
import { mockIDBLeague, resetCache, resetG } from "../../../test/helpers.ts";
import { player, team, trade } from "../index.ts";
import { idb } from "../../db/index.ts";
import { g, helpers } from "../../util/index.ts";
import { DEFAULT_LEVEL } from "../../../common/budgetLevels.ts";
import { PHASE } from "../../../common/constants.ts";
import type { TradeTeams } from "../../../common/types.ts";
import processTrade from "./processTrade.ts";

let proposal: TradeTeams;
beforeEach(async () => {
	resetG();
	g.setWithoutSavingToDB("salaryCap", 164961);
	g.setWithoutSavingToDB("luxuryPayroll", 200428);
	g.setWithoutSavingToDB("phase", PHASE.REGULAR_SEASON);
	const teams = helpers.getTeamsDefault().slice(0, 2).map(team.generate);
	const salaries = [200000, 15000, 15000, 20000];
	const players = salaries.map((amount, pid) => {
		const p = player.generate(
			pid === 3 ? 1 : 0,
			28,
			g.get("season") - 4,
			true,
			DEFAULT_LEVEL,
		);
		return {
			...p,
			pid,
			contract: { amount, exp: g.get("season") + 2 },
			gamesUntilTradable: 0,
		};
	});
	await resetCache({
		players,
		teams,
		teamSeasons: teams.map((t) => team.genSeasonRow(t)),
	});
	idb.league = mockIDBLeague();
	proposal = [
		{ tid: 0, pids: [1, 2], dpids: [], pidsExcluded: [], dpidsExcluded: [] },
		{ tid: 1, pids: [3], dpids: [], pidsExcluded: [], dpidsExcluded: [] },
	];
});

test("salary-reducing aggregation can escape the second apron and undo restores cap status", async () => {
	expect((await trade.summary(proposal)).warning).toBeNull();
	const undo = await processTrade(proposal, undefined);
	expect((await idb.cache.teams.get(0))?.apronState?.hardCap).toBe(2);
	expect(await team.getPayroll(0)).toBe(220000);
	expect(await undo()).toBe(true);
	expect((await idb.cache.teams.get(0))?.apronState).toBeUndefined();
	expect(await team.getPayroll(0)).toBe(230000);
});

test("same aggregation is rejected when it leaves the team above the second apron", async () => {
	const p = (await idb.cache.players.get(0))!;
	p.contract.amount = 210000;
	await idb.cache.players.put(p);
	expect((await trade.summary(proposal)).warning).toContain("second apron");
});

test("frozen picks cannot be traded even in a salary-neutral deal", async () => {
	const t = (await idb.cache.teams.get(0))!;
	t.apronPickPenalties = [
		{
			triggerSeason: g.get("season"),
			season: g.get("season") + 7,
			over: 0,
			under: 0,
		},
	];
	await idb.cache.teams.put(t);
	const dpid = await idb.cache.draftPicks.add({
		tid: 0,
		originalTid: 0,
		round: 1,
		pick: 0,
		season: g.get("season") + 7,
	});
	proposal[0].dpids = [dpid];
	expect((await trade.summary(proposal)).warning).toContain("frozen");
});
