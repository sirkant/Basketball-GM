import { g } from "../../util/index.ts";
import { nbaLuxuryTax } from "../../../common/nbaAprons.ts";

const getLuxuryTaxAmount = (payroll: number, repeater = false) => {
	if (__SPORT === "basketball" && g.get("salaryCapType") === "soft") {
		return nbaLuxuryTax(
			payroll,
			g.get("luxuryPayroll"),
			g.get("salaryCap"),
			repeater,
		);
	}
	// Only apply luxury tax if hard cap is disabled!
	if (payroll > g.get("luxuryPayroll") && g.get("salaryCapType") !== "hard") {
		return g.get("luxuryTax") * (payroll - g.get("luxuryPayroll"));
	}

	return 0;
};

export default getLuxuryTaxAmount;
