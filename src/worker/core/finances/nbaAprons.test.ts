import { beforeEach, expect, test } from "vitest";
import { mockIDBLeague, resetCache, resetG } from "../../../test/helpers.ts";
import { team } from "../index.ts";
import { idb } from "../../db/index.ts";
import g from "../../util/g.ts";
import helpers from "../../util/helpers.ts";
import { isRepeater } from "./nbaAprons.ts";
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

test("repeater status requires three of the preceding four seasons", async () => {
	const t = (await idb.cache.teams.get(0))!;
	for (let i = 1; i <= 4; i++) {
		const ts = team.genSeasonRow(t, undefined, g.get("season") - i);
		ts.expenses.luxuryTax = i <= 3 ? 100 : 0;
		await idb.cache.teamSeasons.add(ts);
	}
	expect(await isRepeater(0)).toBe(true);
});
