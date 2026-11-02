import type { FinancialStatus } from "./ApronNotice.tsx";
import { helpers } from "../util/helpers.ts";
import { useLocal } from "../util/local.ts";

const currency = (amount: number) => helpers.formatCurrency(amount / 1000, "M");

// Day-to-day context only. The complete report and owner brief live in Finances.
export const FinancialStrip = ({
	status,
	financeUrl,
}: {
	status: FinancialStatus;
	financeUrl?: string;
}) => {
	const { minPayroll, salaryCapType } = useLocal([
		"minPayroll",
		"salaryCapType",
	]);
	if (!status) {
		return null;
	}
	const { payroll, total, levels, owner, budget, state } = status;
	const first = payroll > levels.first;
	const second = payroll > levels.second;
	const danger = budget && status.ownerEvaluation && second && total >= 500000;
	const warnings: string[] = [];
	if (salaryCapType !== "none" && payroll < minPayroll) {
		warnings.push(`${currency(minPayroll - payroll)} below the salary floor.`);
	}
	if (first) {
		warnings.push(
			second
				? "Second apron: no MLE or salary aggregation; future-pick restrictions apply."
				: "First apron: incoming trade salary limited to outgoing + $1M (gameplay tolerance).",
		);
	}
	if (state?.hardCap) {
		warnings.push(
			`Hard cap at the ${state.hardCap === 1 ? "first" : "second"} apron.`,
		);
	}
	if (budget && status.ownerEvaluation && total > owner.maxCost) {
		warnings.push(
			`${currency(total - owner.maxCost)} over the owner's budget.`,
		);
	}
	if (status.penalties.length > 0) {
		warnings.push(
			`${status.penalties.length} future first-round ${status.penalties.length === 1 ? "pick is" : "picks are"} restricted.`,
		);
	}
	return (
		<aside className="finance-context" aria-label="Financial position">
			<div className="finance-context-line">
				<span>
					Payroll <strong>{currency(payroll)}</strong>
				</span>
				<span className={first ? "text-warning-emphasis" : ""}>
					{second
						? "Second apron"
						: first
							? "First apron"
							: `${currency(levels.first - payroll)} below first apron`}
				</span>
				<a href={financeUrl ?? helpers.leagueUrl(["team_finances"])}>
					Finances & ownership <span aria-hidden="true">↗</span>
				</a>
			</div>
			{warnings.length > 0 ? (
				<p className="finance-context-warning">{warnings.join(" ")}</p>
			) : null}
			{danger ? (
				<p className="finance-context-danger" role="alert">
					Dismissal guaranteed at the annual evaluation: above the second apron
					with $500M+ in salaries and tax.
				</p>
			) : null}
		</aside>
	);
};
