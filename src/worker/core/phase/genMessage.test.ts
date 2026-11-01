import { assert, beforeEach, test } from "vitest";
import { mockIDBLeague, resetCache, resetG } from "../../../test/helpers.ts";
import { team } from "../index.ts";
import { idb } from "../../db/index.ts";
import g from "../../util/g.ts";
import { genMessage } from "./genMessage.ts";
import helpers from "../../util/helpers.ts";

beforeEach(async () => {
	resetG();
	g.setWithoutSavingToDB("gracePeriodEnd", g.get("season"));

	const teamsDefault = helpers.getTeamsDefault();
	await resetCache({
		teamSeasons: [team.genSeasonRow(teamsDefault[g.get("userTid")]!)],
	});

	idb.league = mockIDBLeague();
});

test("even when already at the max, recognizes excellent performance", async () => {
	const teamSeasons = await idb.cache.teamSeasons.getAll();
	assert.strictEqual(teamSeasons.length, 1);
	teamSeasons[0]!.ownerMood = {
		money: 1,
		playoffs: 1,
		wins: 1,
	};

	await genMessage(
		{
			money: 1,
			playoffs: 1,
			wins: 1,
		},
		{
			money: 0,
			playoffs: 0,
			wins: 0,
		},
	);

	const messages = await idb.cache.messages.getAll();
	assert.strictEqual(messages.length, 1);
	const message = messages[0];
	assert(message);
	assert(message.text.includes("This year: Excellent!"));
	assert(message.text.includes("Overall: Excellent!"));
});

test("when at max for one component, message falls in between what you'd expect when using the uncapped or capped deltas alone", async () => {
	const teamSeasons = await idb.cache.teamSeasons.getAll();
	assert.strictEqual(teamSeasons.length, 1);
	teamSeasons[0]!.ownerMood = {
		money: 1,
		playoffs: -0.6,
		wins: -0.6,
	};

	await genMessage(
		{
			money: 1,
			playoffs: -0.1,
			wins: -0.1,
		},
		{
			money: 0,
			playoffs: -0.1,
			wins: -0.1,
		},
	);

	const messages = await idb.cache.messages.getAll();
	assert.strictEqual(messages.length, 1);
	const message = messages[0];
	assert(message);
	assert(message.text.includes("This year: Good."));
	assert(message.text.includes("Overall: Bad."));
});

test("500M second-apron roster means dismissal even after a championship and perfect owner mood", async () => {
	const ts = (await idb.cache.teamSeasons.getAll())[0]!;
	ts.ownerMood = { wins: 1, playoffs: 1, money: 1 };
	ts.won = 82;
	ts.playoffRoundsWon = 4;
	ts.payrollEndOfSeason = 260000;
	ts.expenses.salary = 260000;
	ts.expenses.luxuryTax = 240000;
	await idb.cache.teamSeasons.put(ts);
	await genMessage(
		{ wins: 1, playoffs: 1, money: 1 },
		{ wins: 0, playoffs: 0, money: 0 },
	);
	assert.strictEqual(g.get("gameOver"), true);
	assert(
		(await idb.cache.messages.getAll())[0]!.text.includes(
			"regardless of results",
		),
	);
});

test("reckless second-apron spending is not protected by the grace period", async () => {
	g.setWithoutSavingToDB("gracePeriodEnd", g.get("season") + 3);
	const ts = (await idb.cache.teamSeasons.getAll())[0]!;
	ts.payrollEndOfSeason = 260000;
	ts.expenses.luxuryTax = 240000;
	await idb.cache.teamSeasons.put(ts);
	await genMessage(
		{ wins: 0, playoffs: 0, money: 0 },
		{ wins: 0, playoffs: 0, money: 0 },
	);
	assert.strictEqual(g.get("gameOver"), true);
});

test("apron dismissal respects God Mode", async () => {
	g.setWithoutSavingToDB("godMode", true);
	const ts = (await idb.cache.teamSeasons.getAll())[0]!;
	ts.payrollEndOfSeason = 260000;
	ts.expenses.luxuryTax = 240000;
	await idb.cache.teamSeasons.put(ts);
	await genMessage(
		{ wins: 0, playoffs: 0, money: 0 },
		{ wins: 0, playoffs: 0, money: 0 },
	);
	assert.strictEqual(g.get("gameOver"), false);
});
