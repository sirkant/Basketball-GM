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
	const { payroll, tax, total, levels, state } = status;
	const second = payroll > levels.second;
	const first = payroll > levels.first;
	const currency = (v: number) => helpers.formatCurrency(v / 1000, "M");
	return (
		<div
			className={`alert ${first ? "alert-warning" : "alert-info"} mt-2 mb-3`}
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
			{!compact
				? status.penalties.map((p) => (
						<div key={p.season}>
							{p.season} first-round pick:{" "}
							{p.penalized
								? "frozen and moved to the end of the first round"
								: "frozen; two further second-apron seasons within four years move it to the end of the first round"}
							.
						</div>
					))
				: null}
		</div>
	);
};
