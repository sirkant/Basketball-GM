import { beforeEach, expect, test } from "vitest";
import { resetCache, resetG, mockIDBLeague } from "../../../test/helpers.ts";
import { player, team } from "../index.ts";
import { idb } from "../../db/index.ts";
import { g, helpers, local } from "../../util/index.ts";
import { PHASE } from "../../../common/constants.ts";
import { DEFAULT_LEVEL } from "../../../common/budgetLevels.ts";
import {
	ensureOwnerMandate,
	getOwnershipBoard,
	ownerTradeImpact,
	recordOwnerTrade,
	undoOwnerTrade,
	recordOwnerGame,
} from "./ownership.ts";
import updateOwnerMood from "../season/updateOwnerMood.ts";
import { genMessage } from "../phase/genMessage.ts";
import { ownerExpectations } from "./nbaAprons.ts";
import type { TradeTeams } from "../../../common/types.ts";
import processTrade from "../trade/processTrade.ts";

beforeEach(async () => {
	resetG();
	local.autoPlayUntil = undefined;
	g.setWithoutSavingToDB("phase", PHASE.REGULAR_SEASON);
	g.setWithoutSavingToDB("gracePeriodEnd", g.get("season"));
	const t = team.generate({
		...helpers.getTeamsDefault()[0]!,
		strategy: "rebuilding",
		ownerPriority: "balanced",
	});
	const t2 = team.generate(helpers.getTeamsDefault()[1]!);
	const ps = Array.from({ length: 10 }, (_, pid) => {
		const p = player.generate(0, 23, g.get("season"), true, DEFAULT_LEVEL);
		p.pid = pid;
		p.rosterOrder = pid;
		p.ratings.at(-1)!.ovr = 60 - pid;
		p.ratings.at(-1)!.pot = 65;
		p.ratings.at(-1)!.fuzz = 0;
		p.contract = { amount: 10000, exp: g.get("season") + 2 };
		p.injury = { type: "Healthy", gamesRemaining: 0 };
		return p;
	});
	const veteran = player.generate(1, 32, g.get("season"), true, DEFAULT_LEVEL);
	veteran.pid = 50;
	veteran.contract = { amount: 10000, exp: g.get("season") + 1 };
	await resetCache({
		teams: [t, t2],
		players: [...ps, veteran],
		teamSeasons: [team.genSeasonRow(t)],
	});
	await idb.cache.draftPicks.add({
		dpid: 1,
		tid: 0,
		originalTid: 0,
		round: 1,
		pick: 0,
		season: g.get("season") + 1,
	});
	idb.league = mockIDBLeague();
});

test("one immutable mandate and one letter even with concurrent requests", async () => {
	const [a, b] = await Promise.all([
		ensureOwnerMandate(),
		ensureOwnerMandate(),
	]);
	expect(a).toEqual(b);
	const original = structuredClone(a);
	const t = (await idb.cache.teams.get(0))!;
	t.strategy = "contending";
	t.ownerPriority = "winning";
	await idb.cache.teams.put(t);
	g.setWithoutSavingToDB("salaryCap", 300000);
	expect(await ensureOwnerMandate()).toEqual(original);
	expect(ownerExpectations(t).maxCost).toBe(original!.targets.maxCost);
	expect(
		(await idb.cache.messages.getAll()).filter((m) => m.from === "The Owner"),
	).toHaveLength(1);
});
test("trade previews do not add decisions, executed evidence is idempotent and undo removes it", async () => {
	const teams: TradeTeams = [
		{ tid: 0, pids: [], dpids: [1], pidsExcluded: [], dpidsExcluded: [] },
		{ tid: 1, pids: [50], dpids: [], pidsExcluded: [], dpidsExcluded: [] },
	];
	const impact = await ownerTradeImpact(teams);
	expect(impact?.concerns.join(" ")).toContain("veteran");
	expect((await ensureOwnerMandate())!.decisions).toHaveLength(0);
	await recordOwnerTrade(42, impact);
	await recordOwnerTrade(42, impact);
	expect((await ensureOwnerMandate())!.decisions).toHaveLength(1);
	await undoOwnerTrade(42);
	expect((await ensureOwnerMandate())!.decisions).toHaveLength(0);
});

test("actual trade processing and undo keep the owner journal consistent", async () => {
	const undo = await processTrade(
		[
			{ tid: 0, pids: [0], dpids: [1], pidsExcluded: [], dpidsExcluded: [] },
			{ tid: 1, pids: [50], dpids: [], pidsExcluded: [], dpidsExcluded: [] },
		],
		undefined,
	);
	expect((await ensureOwnerMandate())!.decisions).toHaveLength(1);
	expect(
		(await ensureOwnerMandate())!.decisions[0]!.concerns.join(" "),
	).toContain("veteran");
	expect(await undo()).toBe(true);
	expect((await ensureOwnerMandate())!.decisions).toHaveLength(0);
	expect((await idb.cache.players.get(0))!.tid).toBe(0);
	expect((await idb.cache.draftPicks.get(1))!.tid).toBe(0);
});

test("an explicit playoff-series target changes the annual assessment", async () => {
	const t = (await idb.cache.teams.get(0))!;
	t.strategy = "contending";
	t.ownerPriority = "winning";
	await idb.cache.teams.put(t);
	await ensureOwnerMandate();
	const ts = (await idb.cache.teamSeasons.getAll())[0]!;
	ts.won = 60;
	ts.lost = 22;
	ts.playoffRoundsWon = 0;
	await idb.cache.teamSeasons.put(ts);
	const result = await updateOwnerMood();
	expect(result!.deltas.playoffs).toBeLessThan(0);
	expect(
		(await idb.cache.teamSeasons.getAll())[0]!.ownerReview?.objectives.find(
			(o) => o.key === "playoffs",
		)?.status,
	).toBe("missed");
});
test("counts only actual full-game baseline injury absences, once per game", async () => {
	await ensureOwnerMandate();
	const ps = await idb.cache.players.getAllByKey();
	ps[0]!.injury = { type: "Ankle", gamesRemaining: 12 };
	ps[1]!.injury = { type: "Finger", gamesRemaining: 1 };
	const rows = [
		{ id: 0, stat: { gp: 0 } },
		{ id: 1, stat: { gp: 1 } },
		{ id: 2, stat: { gp: 0 } },
	];
	await recordOwnerGame(100, 0, false, rows, ps);
	await recordOwnerGame(100, 0, false, rows, ps);
	let m = (await ensureOwnerMandate())!;
	expect(m.injuries.games).toBe(1);
	expect(m.injuries.keyMissed).toBe(1);
	expect(m.injuries.rotationMissed).toBe(1);
	ps[0]!.tid = 1;
	await recordOwnerGame(101, 0, false, rows, ps);
	m = (await ensureOwnerMandate())!;
	expect(m.injuries.keyMissed).toBe(1);
});
test("hidden-rating board contains no scouted talent and spectator has no mandate board", async () => {
	await ensureOwnerMandate();
	g.setWithoutSavingToDB("challengeNoRatings", true);
	const board = await getOwnershipBoard(0);
	expect(board?.current?.roster.talent).toBeUndefined();
	expect(board?.current?.mandate.targets.talent).toBeUndefined();
	expect(board?.current?.objectives.some((o) => o.key === "talent")).toBe(
		false,
	);
	expect(board?.current?.mandate.baseline.rotation[0]?.ovr).toBe(0);
	g.setWithoutSavingToDB("spectator", true);
	expect(await getOwnershipBoard(0)).toBeUndefined();
});
test("late adoption does not reconstruct old games or injuries", async () => {
	const ts = (await idb.cache.teamSeasons.getAll())[0]!;
	ts.won = 20;
	ts.lost = 30;
	await idb.cache.teamSeasons.put(ts);
	const m = (await ensureOwnerMandate())!;
	expect(m.issuedGames).toBe(50);
	expect(m.injuries.games).toBe(0);
	const b = await getOwnershipBoard(0);
	expect(b?.current?.winsDelta).toBe(0);
});
test("annual evaluation persists once and cannot cancel the 500M second-apron red line", async () => {
	await ensureOwnerMandate();
	const ts = (await idb.cache.teamSeasons.getAll())[0]!;
	ts.won = 60;
	ts.lost = 22;
	ts.playoffRoundsWon = 4;
	ts.payrollEndOfSeason = 260000;
	ts.expenses.salary = 260000;
	ts.expenses.luxuryTax = 240000;
	ts.ownerMood = { wins: 1, playoffs: 1, money: 1 };
	await idb.cache.teamSeasons.put(ts);
	const response = await updateOwnerMood();
	expect(response).toBeDefined();
	const before = structuredClone(
		(await idb.cache.teamSeasons.getAll())[0]!.ownerMood,
	);
	expect(await updateOwnerMood()).toBeUndefined();
	expect((await idb.cache.teamSeasons.getAll())[0]!.ownerMood).toEqual(before);
	expect((await idb.cache.teamSeasons.getAll())[0]!.ownerReview?.applied).toBe(
		true,
	);
	await genMessage(response!.deltas, response!.cappedDeltas);
	expect(g.get("gameOver")).toBe(true);
	expect((await idb.cache.messages.getAll()).at(-1)!.text).toContain(
		"regardless of results",
	);
});
test("saved team and review round-trip through JSON and next-year mandate keeps the previous story", async () => {
	const m = (await ensureOwnerMandate())!;
	const t = (await idb.cache.teams.get(0))!;
	const serialized = JSON.stringify(t);
	const restored = JSON.parse(serialized);
	expect(team.generate(restored).ownerMandate).toEqual(m);
	const report = (await getOwnershipBoard(0))!.current!;
	const ts = (await idb.cache.teamSeasons.getAll())[0]!;
	ts.ownerReview = {
		...structuredClone(report),
		verdict: "A better foundation",
		applied: true,
	};
	await idb.cache.teamSeasons.put(ts);
	const serializedSeason = JSON.stringify(ts);
	const restoredSeason = JSON.parse(serializedSeason);
	expect(restoredSeason.ownerReview.mandate.targets).toEqual(m.targets);
	g.setWithoutSavingToDB("phase", PHASE.FREE_AGENCY);
	const next = (await ensureOwnerMandate())!;
	expect(next.opening).toContain("A better foundation");
	expect(next.season).toBe(g.get("season") + 1);
	expect(next.injuries.gids).toHaveLength(0);
	expect(next.decisions).toHaveLength(0);
});
