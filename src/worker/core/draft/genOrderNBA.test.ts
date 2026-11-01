import { afterAll, assert, beforeAll, test } from "vitest";
import { getDraftTids, loadTeamSeasons } from "./testHelpers.ts";
import { mockIDBLeague, resetG } from "../../../test/helpers.ts";
import { idb } from "../../db/index.ts";
import { g } from "../../util/index.ts";

beforeAll(async () => {
	resetG();
	idb.league = mockIDBLeague();

	await loadTeamSeasons();
});
afterAll(() => {
	// @ts-expect-error
	idb.league = undefined;
});

test("schedule 60 draft picks", async () => {
	const draftTids = await getDraftTids();
	assert.strictEqual(draftTids.length, 60);
});

test("a second-apron draft penalty puts even the worst team's pick last and excludes it from the lottery", async () => {
	const t = (await idb.cache.teams.get(16))!;
	t.apronPickPenalties = [
		{
			season: g.get("season"),
			triggerSeason: g.get("season") - 7,
			over: 2,
			under: 0,
			penalized: true,
		},
	];
	await idb.cache.teams.put(t);
	try {
		const tids = await getDraftTids();
		assert.strictEqual(tids[29], 16);
		const lottery = await idb.cache.draftLotteryResults.get(g.get("season"));
		assert(lottery?.result.every((row) => row.originalTid !== 16));
	} finally {
		delete t.apronPickPenalties;
		await idb.cache.teams.put(t);
	}
});

test("give the 3 teams with the lowest win percentage picks not lower than 6", async () => {
	const draftTids = await getDraftTids();
	const tids = [16, 28, 21]; // teams with lowest winp

	for (const [i, tid] of tids.entries()) {
		assert(draftTids.indexOf(tid) >= 0);
		assert(draftTids.indexOf(tid) <= i + 3);
		assert.strictEqual(draftTids.lastIndexOf(tid), 30 + i);
	}
});

test("give lottery team with better record than playoff teams a pick based on actual record for round 2", async () => {
	const draftTids = await getDraftTids();
	const pofteams = [23, 10, 18, 24, 14]; // good record lottery team

	assert(draftTids.indexOf(17) >= 0);
	assert(draftTids.indexOf(17) <= 13);
	assert.strictEqual(draftTids.lastIndexOf(17), 48); // bad record playoff team

	for (const tid of pofteams) {
		assert(draftTids.indexOf(tid) > draftTids.indexOf(17));
		assert(draftTids.lastIndexOf(tid) < draftTids.lastIndexOf(17));
	}
});

test("give reverse round 2 order for teams with the same record", async () => {
	const draftTids = await getDraftTids();
	const sameRec = [
		[3, 15, 25],
		[10, 18],
		[13, 26],
	];

	// First set of tids can fail because all 3 teams are in the lottery, although with low odds
	const lotteryTids = draftTids.slice(0, 3);
	for (const tid of sameRec[0]!) {
		if (lotteryTids.includes(tid)) {
			// Skip this test, it will fail otherwise
			sameRec.shift();
			break;
		}
	}

	for (const tids of sameRec) {
		const r1picks = draftTids.filter((tid, i) => tids.includes(tid) && i < 30);
		const r2picks = draftTids.filter((tid, i) => tids.includes(tid) && i >= 30);
		assert.deepStrictEqual(r1picks, r2picks.reverse());
	}
});
