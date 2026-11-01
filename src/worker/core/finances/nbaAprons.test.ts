import { beforeEach, expect, test } from "vitest";
import { mockIDBLeague, resetCache, resetG } from "../../../test/helpers.ts";
import { team, player } from "../index.ts";
import { idb } from "../../db/index.ts";
import g from "../../util/g.ts";
import helpers from "../../util/helpers.ts";
import { DEFAULT_LEVEL } from "../../../common/budgetLevels.ts";
import {
	checkApronSigning,
	currentApronState,
	recordApronSeason,
	saveApronState,
	isRepeater,
} from "./nbaAprons.ts";
import { PHASE } from "../../../common/constants.ts";

beforeEach(async () => {
	resetG();
	g.setWithoutSavingToDB("salaryCap", 164961);
	g.setWithoutSavingToDB("luxuryPayroll", 200428);
	g.setWithoutSavingToDB("phase", PHASE.REGULAR_SEASON);
	const t = team.generate(helpers.getTeamsDefault()[0]!);
	await resetCache({ teams: [t], teamSeasons: [team.genSeasonRow(t)] });
	idb.league = mockIDBLeague();
});

const p = { contract: { amount: 10000, exp: 2030 } };

test("own-player renewal can cross the second apron without a hard cap", async () => {
	expect(
		(await checkApronSigning(0, p, 30000, g.get("season") + 2, true, 220000))
			.error,
	).toBeUndefined();
});

test("even minimum contracts cannot breach an activated hard cap", async () => {
	await saveApronState(0, { hardCap: 1 });
	expect(
		(
			await checkApronSigning(
				0,
				p,
				g.get("minContract"),
				g.get("season"),
				false,
				209000,
			)
		).error,
	).toContain("hard cap");
});

test("taxpayer MLE is unavailable above the second apron", async () => {
	expect(
		(await checkApronSigning(0, p, 5000, g.get("season"), false, 225000)).error,
	).toBeDefined();
});

test("MLE spending cannot be reused on another free agent", async () => {
	await saveApronState(0, { mleType: "taxpayer", mleUsed: 5000, hardCap: 2 });
	expect(
		(await checkApronSigning(0, p, 3000, g.get("season"), false, 210000)).error,
	).toBeDefined();
});

test("non-taxpayer MLE triggers a first-apron hard cap", async () => {
	expect(
		(await checkApronSigning(0, p, 10000, g.get("season") + 2, false, 190000))
			.state?.hardCap,
	).toBe(1);
});

test("waived high-salary players are unavailable above the first apron", async () => {
	expect(
		(
			await checkApronSigning(
				0,
				{ ...p, releasedSalary: { amount: 25000, season: g.get("season") } },
				g.get("minContract"),
				g.get("season"),
				false,
				210000,
			)
		).error,
	).toContain("waived");
});

test("offseason hard cap carries into the next regular season then expires", async () => {
	const year = g.get("season");
	g.setWithoutSavingToDB("phase", PHASE.FREE_AGENCY);
	await saveApronState(0, { hardCap: 2 });
	g.setWithoutSavingToDB("season", year + 1);
	g.setWithoutSavingToDB("phase", PHASE.PRESEASON);
	expect(currentApronState(await idb.cache.teams.get(0))?.hardCap).toBe(2);
	g.setWithoutSavingToDB("phase", PHASE.FREE_AGENCY);
	expect(currentApronState(await idb.cache.teams.get(0))).toBeUndefined();
});

test("repeater status requires three of the preceding four seasons", async () => {
	const t = (await idb.cache.teams.get(0))!;
	for (let i = 1; i <= 4; i++) {
		const ts = team.genSeasonRow(t, undefined, g.get("season") - i);
		ts.expenses.luxuryTax = i <= 3 ? 100 : 0;
		await idb.cache.teamSeasons.add(ts);
	}
	expect(await isRepeater(0)).toBe(true);
});

test("second-apron season freezes the distant pick exactly once", async () => {
	const star = player.generate(0, 30, g.get("season"), true, DEFAULT_LEVEL);
	star.contract.amount = 230000;
	await idb.cache.players.add(star);
	await recordApronSeason();
	await recordApronSeason();
	expect((await idb.cache.teams.get(0))?.apronPickPenalties).toEqual([
		{
			season: g.get("season") + 7,
			triggerSeason: g.get("season"),
			over: 0,
			under: 0,
		},
	]);
});

test("three later seasons below the second apron unfreeze a pick", async () => {
	const t = (await idb.cache.teams.get(0))!;
	const first = g.get("season");
	t.apronPickPenalties = [
		{ season: first + 7, triggerSeason: first, over: 0, under: 0 },
	];
	await idb.cache.teams.put(t);
	for (let i = 1; i <= 3; i++) {
		g.setWithoutSavingToDB("season", first + i);
		await idb.cache.teamSeasons.add(team.genSeasonRow(t));
		await recordApronSeason();
	}
	expect(
		(await idb.cache.teams.get(0))?.apronPickPenalties?.[0]?.unfrozen,
	).toBe(true);
});

test("two later second-apron seasons permanently penalize the frozen pick", async () => {
	const t = (await idb.cache.teams.get(0))!;
	const first = g.get("season");
	t.apronPickPenalties = [
		{ season: first + 7, triggerSeason: first, over: 0, under: 0 },
	];
	await idb.cache.teams.put(t);
	const p = player.generate(0, 30, first, true, DEFAULT_LEVEL);
	p.contract.amount = 230000;
	await idb.cache.players.add(p);
	for (let i = 1; i <= 2; i++) {
		g.setWithoutSavingToDB("season", first + i);
		await idb.cache.teamSeasons.add(team.genSeasonRow(t));
		await recordApronSeason();
	}
	expect(
		(await idb.cache.teams.get(0))?.apronPickPenalties?.[0]?.penalized,
	).toBe(true);
});
