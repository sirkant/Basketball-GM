import { ApronNotice } from "../../components/ApronNotice.tsx";
import { helpers } from "../../util/helpers.ts";
import type { View } from "../../../common/types.ts";
import { TRADE_SALARY_TOLERANCE } from "../../../common/nbaAprons.ts";
import { SalaryPlanner } from "../../components/SalaryPlanner.tsx";

const FinancialRules = ({ summary }: Pick<View<"trade">, "summary">) => {
	const status = summary.financialStatus;
	if (!status) {
		return null;
	}
	const danger =
		status.budget &&
		status.ownerEvaluation &&
		status.payroll > status.levels.second &&
		status.total >= 500000;
	const overBudget =
		status.budget &&
		status.ownerEvaluation &&
		status.total > status.owner.maxCost;
	const hardCap =
		status.state?.hardCap && summary.apronHardCap
			? Math.min(status.state.hardCap, summary.apronHardCap)
			: (status.state?.hardCap ?? summary.apronHardCap);

	return (
		<>
			{danger ? (
				<div className="text-danger fw-bold small mb-2" role="alert">
					Owner's red line: this proposal leads to guaranteed dismissal at the
					annual evaluation, regardless of results.
				</div>
			) : null}
			<div className="d-flex flex-wrap gap-3 small text-body-secondary mb-2">
				<span>
					{helpers.formatCurrency(TRADE_SALARY_TOLERANCE / 1000, "M")} salary
					matching tolerance per team, applied to the matching limit
				</span>
				{hardCap ? (
					<span className="fw-semibold text-warning-emphasis">
						Hard cap after trade: {hardCap === 1 ? "first" : "second"} apron
					</span>
				) : null}
			</div>
			<details>
				<summary className="small fw-semibold">
					Financial impact & rules · Salaries + tax{" "}
					{helpers.formatCurrency(status.total / 1000, "M")}
					{overBudget ? (
						<span className="text-warning-emphasis"> · Over owner budget</span>
					) : null}
				</summary>
				<div className="mt-2">
					<ApronNotice status={status} compact />
				</div>
			</details>
		</>
	);
};

const FinancialDetails = ({ summary }: Pick<View<"trade">, "summary">) => {
	if (!summary.financialStatus && !summary.salaryPlan) {
		return null;
	}

	return (
		<div className="border-top mt-3 pt-3">
			<FinancialRules summary={summary} />
			{summary.salaryPlan ? (
				<details className={summary.financialStatus ? "mt-2" : undefined}>
					<summary className="small fw-semibold">
						Three-year salary impact
					</summary>
					<div className="mt-2">
						<SalaryPlanner plan={summary.salaryPlan} />
						<a
							className="small d-inline-block mt-2"
							href={helpers.leagueUrl(["team_finances"])}
						>
							View team finances and contracts
						</a>
					</div>
				</details>
			) : null}
		</div>
	);
};

export default FinancialDetails;
