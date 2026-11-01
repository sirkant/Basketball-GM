import { PHASE } from "../../../common/constants.ts";
import { idb } from "../../db/index.ts";
import g from "../../util/g.ts";
import { nbaLuxuryTax } from "../../../common/nbaAprons.ts";

export const apronsEnabled = () =>
	__SPORT === "basketball" && g.get("salaryCapType") === "soft";

// The game keeps the completed season number throughout the offseason.
export const salaryYear = () =>
	g.get("season") + (g.get("phase") > PHASE.PLAYOFFS ? 1 : 0);
export const isRepeater = async (tid: number) => {
	const year = salaryYear();
	const rows = await idb.merged.teamSeasons.getAll({
		tid,
		seasons: [year - 4, year - 1],
	});
	return rows.filter((ts) => ts.expenses.luxuryTax > 0).length >= 3;
};

export const projectedTax = async (tid: number, payroll: number) =>
	apronsEnabled()
		? nbaLuxuryTax(
				payroll,
				g.get("luxuryPayroll"),
				g.get("salaryCap"),
				await isRepeater(tid),
			)
		: g.get("salaryCapType") !== "hard"
			? Math.max(0, payroll - g.get("luxuryPayroll")) * g.get("luxuryTax")
			: 0;
