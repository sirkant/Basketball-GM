import type { getFinancialStatus } from "../../worker/core/finances/nbaAprons.ts";
import { helpers } from "../util/helpers.ts";

export type FinancialStatus = Awaited<ReturnType<typeof getFinancialStatus>>;

export const ApronNotice = ({
	status,
	compact = false,
}: {
	status: FinancialStatus;
	compact?: boolean;
}) => {
	if (!status) {
		return null;
	}
	const { payroll, tax, total, levels, state, owner, budget } = status;
	const second = payroll > levels.second;
	const first = payroll > levels.first;
	const danger = budget && status.ownerEvaluation && second && total >= 500000;
	const currency = (value: number) => helpers.formatCurrency(value / 1000, "M");
	return (
		<div
			className={`alert ${danger ? "alert-danger" : first || (budget && total > owner.maxCost) ? "alert-warning" : "alert-info"} mt-2 mb-3`}
			role="status"
		>
			<div className="fw-bold">
				{second ? "Second apron" : first ? "First apron" : "Roster finances"}
				{state?.hardCap
					? ` · Hard cap at ${state.hardCap === 1 ? "first" : "second"} apron`
					: ""}
			</div>
			<div>
				Payroll {currency(payroll)} · Projected luxury tax {currency(tax)}
				{status.repeater ? " (repeater)" : ""} · Total {currency(total)}
			</div>
			<div>
				First apron {currency(levels.first)} · Second apron{" "}
				{currency(levels.second)}
			</div>
			{first ? (
				<div>
					You cannot receive more salary than you send in a trade.
					{second
						? " You also lose the mid-level exception and cannot combine salaries to acquire a larger contract. Finishing above this line freezes a future first-round pick."
						: " Receiving a sign-and-trade player or using the full mid-level exception requires staying below the first apron."}
				</div>
			) : null}
			{state?.hardCap ? (
				<div>
					Remaining room under your hard cap:{" "}
					{currency(
						(state.hardCap === 1 ? levels.first : levels.second) - payroll,
					)}
					. All signings, including renewals and minimum contracts, must fit.
				</div>
			) : null}
			{!compact ? (
				<>
					<div className="mt-2">
						<b>Owner: {owner.label}.</b> {owner.text}
					</div>
					<div>
						Target: {Math.round(owner.winPct * 100)}% wins
						{budget
							? ` · Profit ${currency(owner.minProfit)} · Salaries + tax budget ${currency(owner.maxCost)}`
							: ""}
						.
					</div>
					{status.penalties.map((p) => (
						<div key={p.season}>
							{p.season} first-round pick:{" "}
							{p.penalized
								? "frozen and moved to the end of the first round"
								: "frozen; two further second-apron seasons within four years move it to the end of the first round"}
							.
						</div>
					))}
				</>
			) : null}
			{budget && status.ownerEvaluation && total > owner.maxCost ? (
				<div className="fw-bold mt-1">
					You are {currency(total - owner.maxCost)} over the owner's roster
					budget. This counts against your performance evaluation.
				</div>
			) : null}
			{budget && status.ownerEvaluation ? (
				<div className={danger ? "fw-bold mt-1" : "small mt-1"}>
					{danger
						? "Dismissal guaranteed at the annual evaluation: "
						: "Owner's red line: "}
					a roster above the second apron costing $500M or more in salaries and
					luxury tax means dismissal, regardless of results.
				</div>
			) : null}
			{budget && status.userTeam && !status.ownerEvaluation ? (
				<div className="small mt-1">
					Ownership dismissals are disabled in this mode; apron transaction
					restrictions still apply.
				</div>
			) : null}
		</div>
	);
};
