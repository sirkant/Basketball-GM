import { expect, test } from "vitest";
import { PHASE } from "../../../common/constants.ts";
import { resetG } from "../../../test/helpers.ts";
import g from "../../util/g.ts";
import { getSalaryPlan } from "./salaryPlanner.ts";

test("starts with the upcoming salary year during an offseason expansion draft", () => {
	resetG();
	g.setWithoutSavingToDB("phase", PHASE.EXPANSION_DRAFT);
	g.setWithoutSavingToDB("nextPhase", PHASE.DRAFT_LOTTERY);
	const season = g.get("season");
	const plan = getSalaryPlan([
		{ pid: 1, amount: 12_000, exp: season, released: false },
	]);
	expect(plan.before[0]).toMatchObject({ season: season + 1, total: 0 });
});
