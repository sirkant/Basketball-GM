import { ApronNotice, type FinancialStatus } from "./ApronNotice.tsx";
import { helpers } from "../util/helpers.ts";
import { useLocal } from "../util/local.ts";

const currency = (amount: number) => helpers.formatCurrency(amount / 1000, "M");

export const FinancialStrip = ({ status }: { status: FinancialStatus }) => {
	const { minPayroll, salaryCapType } = useLocal([
		"minPayroll",
		"salaryCapType",
	]);
	if (!status) {
		return null;
	}
	const { payroll, tax, total, levels, owner, budget } = status;
	const first = payroll > levels.first;
	const second = payroll > levels.second;
	const danger = budget && status.ownerEvaluation && second && total >= 500000;
	return (
		<section className="club-finance" aria-label="Financial position">
			<div className="club-finance-line">
				<div>
					<span>Payroll</span>
					<strong>{currency(payroll)}</strong>
				</div>
				<div>
					<span>Luxury tax{status.repeater ? " · repeater" : ""}</span>
					<strong>{currency(tax)}</strong>
				</div>
				<div>
					<span>Total cost</span>
					<strong>{currency(total)}</strong>
				</div>
				<div className="club-finance-apron">
					<span>Apron position</span>
					<strong className={first ? "text-danger" : ""}>
						{second
							? "Above second apron"
							: first
								? "Above first apron"
								: "Below first apron"}
					</strong>
				</div>
			</div>
			{salaryCapType !== "none" && payroll < minPayroll ? (
				<p className="club-finance-warning">
					{currency(minPayroll - payroll)} below the minimum payroll. A
					salary-floor penalty is projected.
				</p>
			) : null}
			{first ? (
				<p className="club-finance-warning">
					{second
						? "Second apron: no mid-level exception or salary aggregation. Future pick restrictions apply."
						: "First apron: incoming trade salary is limited to outgoing salary + $1M (gameplay tolerance)."}{" "}
					{status.state?.hardCap
						? `Hard cap at the ${status.state.hardCap === 1 ? "first" : "second"} apron.`
						: ""}
				</p>
			) : status.state?.hardCap ? (
				<p className="club-finance-warning">
					Hard cap at the {status.state.hardCap === 1 ? "first" : "second"}{" "}
					apron. All signings must fit.
				</p>
			) : null}
			{budget && status.ownerEvaluation && total > owner.maxCost ? (
				<p className="club-finance-warning">
					{currency(total - owner.maxCost)} above the owner's budget. This
					affects your evaluation.
				</p>
			) : null}
			{danger ? (
				<p className="club-finance-danger" role="alert">
					Dismissal guaranteed at the annual evaluation: second apron and $500M+
					in salaries and tax.
				</p>
			) : null}
			{status.penalties.length > 0 ? (
				<p className="club-finance-warning">
					{status.penalties.length} future first-round{" "}
					{status.penalties.length === 1 ? "pick has" : "picks have"} apron
					restrictions.
				</p>
			) : null}
			<div className="club-owner-brief">
				<span>Ownership brief</span> <strong>{owner.label}</strong>
				<span className="club-owner-text"> · {owner.text}</span>
			</div>
			<details className="club-finance-details">
				<summary>Financial breakdown & apron rules</summary>
				<ApronNotice status={status} />
			</details>
		</section>
	);
};
