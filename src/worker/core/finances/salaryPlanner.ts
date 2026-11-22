import { getApronLevels } from "../../../common/nbaAprons.ts";
import { projectSalaries } from "../../../common/salaryPlanner.ts";
import { actualPhase } from "../../util/actualPhase.ts";
import { g } from "../../util/index.ts";
import { apronsEnabled, salaryYear } from "./nbaAprons.ts";

export const getSalaryPlan = (
	contracts: Parameters<typeof projectSalaries>[0],
	scenario?: Parameters<typeof projectSalaries>[3],
) => {
	const cap =
		g.get("salaryCapType") === "none" ? undefined : g.get("salaryCap");
	const aprons = apronsEnabled()
		? getApronLevels(g.get("salaryCap"), g.get("luxuryPayroll"))
		: undefined;
	return projectSalaries(
		contracts,
		salaryYear(actualPhase()),
		{ cap, firstApron: aprons?.first, secondApron: aprons?.second },
		scenario,
	);
};
