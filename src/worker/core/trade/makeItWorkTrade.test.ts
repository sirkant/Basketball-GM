import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { DEFAULT_LEVEL } from "../../../common/budgetLevels.ts";
import type { TradeTeams } from "../../../common/types.ts";
import { mockIDBLeague, resetCache, resetG } from "../../../test/helpers.ts";
import { idb } from "../../db/index.ts";
import { g, helpers } from "../../util/index.ts";
import { player, team } from "../index.ts";
import * as makeItWork from "./makeItWork.ts";
import makeItWorkTrade from "./makeItWorkTrade.ts";

let original: TradeTeams;

beforeEach(async () => {
	resetG();
	g.setWithoutSavingToDB("salaryCapType", "hard");
	g.setWithoutSavingToDB("salaryCap", 100_000);
	const teams = helpers.getTeamsDefault().slice(0, 2).map(team.generate);
	const players = [10_000, 25_000, 85_000, 70_000].map((amount, pid) => ({
		...player.generate(pid < 3 ? 0 : 1, 28, 2012, true, DEFAULT_LEVEL),
		pid,
		contract: { amount, exp: 2018 },
		gamesUntilTradable: 0,
	}));
	original = [
		{ tid: 0, pids: [0], dpids: [], pidsExcluded: [2], dpidsExcluded: [] },
		{ tid: 1, pids: [], dpids: [], pidsExcluded: [], dpidsExcluded: [] },
	];
	await resetCache({ players, teams, trade: [{ rid: 0, teams: original }] });
	idb.league = mockIDBLeague();
});

afterEach(() => {
	vi.restoreAllMocks();
});

test("reports the exact counteroffer additions on each side with a separate salary warning", async () => {
	const pick = await idb.cache.draftPicks.add({
		tid: 0,
		originalTid: 0,
		season: 2017,
		pick: 0,
		round: 1,
	});
	const candidate = helpers.deepCopy(original);
	candidate[0].pids.push(1);
	candidate[0].dpids.push(pick);
	candidate[1].pids.push(3);
	vi.spyOn(makeItWork, "default").mockResolvedValue(candidate);

	expect(await makeItWorkTrade()).toMatchObject({
		status: "counteroffer",
		warning: expect.stringContaining("over the salary cap"),
		changes: [
			{ side: 0, action: "added", type: "player", id: 1 },
			{ side: 0, action: "added", type: "pick", id: pick },
			{ side: 1, action: "added", type: "player", id: 3 },
		],
		previousTeams: original,
	});
	expect((await idb.cache.trade.get(0))?.teams).toEqual(candidate);
});

test("distinguishes an unchanged result from a search with no counteroffer", async () => {
	const search = vi.spyOn(makeItWork, "default").mockResolvedValue(original);
	expect(await makeItWorkTrade()).toMatchObject({
		status: "unchanged",
		warning: null,
	});

	search.mockResolvedValue(undefined);
	expect(await makeItWorkTrade()).toMatchObject({
		status: "noDeal",
		warning: null,
	});
	expect((await idb.cache.trade.get(0))?.teams).toEqual(original);
});

test("reports an existing rule blocker even when the search cannot find a counteroffer", async () => {
	original[1].pids.push(3);
	vi.spyOn(makeItWork, "default").mockResolvedValue(undefined);

	expect(await makeItWorkTrade()).toMatchObject({
		status: "noDeal",
		warning: expect.stringContaining("over the salary cap"),
	});
});

test("leaves later edits in place when the offer changes during the search", async () => {
	const candidate = helpers.deepCopy(original);
	candidate[0].pids.push(1);
	const edited = helpers.deepCopy(original);
	edited[0].pidsExcluded.push(1);
	vi.spyOn(makeItWork, "default").mockImplementation(async () => {
		await idb.cache.trade.put({ rid: 0, teams: edited });
		return candidate;
	});

	expect(await makeItWorkTrade()).toEqual({ status: "stale" });
	expect((await idb.cache.trade.get(0))?.teams).toEqual(edited);
});
