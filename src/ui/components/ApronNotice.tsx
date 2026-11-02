import type { getFinancialStatus } from "../../worker/core/finances/nbaAprons.ts";
import { helpers } from "../util/helpers.ts";

export type FinancialStatus = Awaited<ReturnType<typeof getFinancialStatus>>;

const currency = (value: number) => helpers.formatCurrency(value / 1000, "M");

const ApronMargin = ({
	label,
	limit,
	payroll,
}: {
	label: string;
	limit: number;
	payroll: number;
}) => {
	const over = payroll > limit;
	const margin = `${currency(Math.abs(limit - payroll))} ${over ? "above" : "below"}`;
	return (
		<div className="col-12 col-sm-6">
			<div className="d-flex flex-wrap justify-content-between gap-1 small mb-1">
				<span className="fw-semibold">
					{label} · {currency(limit)}
				</span>
				<span className={over ? "fw-bold" : undefined}>{margin}</span>
			</div>
			<div className="progress" style={{ height: 6 }}>
				<div
					className={`progress-bar ${over ? "bg-danger" : "bg-primary"}`}
					role="progressbar"
					aria-label={`${label} payroll`}
					aria-valuemin={0}
					aria-valuemax={limit}
					aria-valuenow={Math.max(0, Math.min(payroll, limit))}
					aria-valuetext={`${currency(payroll)} payroll; ${margin} the ${label.toLowerCase()}`}
					style={{
						width: `${Math.max(0, Math.min(100, (payroll / limit) * 100))}%`,
					}}
				/>
			</div>
		</div>
	);
};

export const ApronNotice = ({
	status,
	compact = false,
	showOwner = true,
}: {
	status: FinancialStatus;
	compact?: boolean;
	showOwner?: boolean;
}) => {
	if (!status) {
		return null;
	}
	const { payroll, tax, total, levels, state, owner, budget } = status;
	const second = payroll > levels.second;
	const first = payroll > levels.first;
	const danger = budget && status.ownerEvaluation && second && total >= 500000;
	return (
		<div
			className={`alert ${danger ? "alert-danger" : first || (budget && total > owner.maxCost) ? "alert-warning" : "alert-info"} mt-2 mb-3`}
			role="status"
			aria-label="Roster finances"
		>
			<div className="d-flex flex-wrap justify-content-between gap-2 mb-2 fw-bold">
				<span>Roster finances</span>
				<span
					className={`badge ${danger ? "bg-danger" : first ? "bg-warning text-dark" : "bg-primary"}`}
				>
					{second
						? "Second apron"
						: first
							? "First apron"
							: "Below first apron"}
					{state?.hardCap
						? ` · Hard cap at ${state.hardCap === 1 ? "first" : "second"} apron`
						: ""}
				</span>
			</div>
			<div className={`row g-2 ${compact ? "mb-2" : "mb-3"}`}>
				{(
					[
						["Payroll", payroll],
						["Projected luxury tax", tax],
						["Salaries + tax", total],
					] as const
				).map(([label, value]) => (
					<div className="col-12 col-sm-4" key={label}>
						<div className={compact ? "" : "border rounded p-2 h-100"}>
							<div className="small">
								{label}
								{label === "Projected luxury tax" && status.repeater
									? " · Repeater"
									: ""}
							</div>
							<div className={compact ? "fw-semibold" : "fs-4 fw-semibold"}>
								{currency(value)}
							</div>
							{label === "Salaries + tax" && budget ? (
								<div className="small">
									Owner budget {currency(owner.maxCost)}
								</div>
							) : null}
						</div>
					</div>
				))}
			</div>
			{!compact ? (
				<div className="row g-3 mb-3">
					<ApronMargin
						label="First apron"
						limit={levels.first}
						payroll={payroll}
					/>
					<ApronMargin
						label="Second apron"
						limit={levels.second}
						payroll={payroll}
					/>
				</div>
			) : (
				<div className="small mb-2">
					First apron {currency(levels.first)} · Second apron{" "}
					{currency(levels.second)}
				</div>
			)}
			{first ? (
				<div className="small">
					Trade matching allows up to $1M more incoming salary per team and
					trade (gameplay tolerance).
					{second
						? " You also lose the mid-level exception and cannot combine salaries to acquire a larger contract. Finishing above this line freezes a future first-round pick."
						: " Receiving a sign-and-trade player or using the full mid-level exception requires staying below the first apron."}
					{!second
						? ` You are ${currency(levels.second - payroll)} below the second apron, where you also lose the mid-level exception and salary aggregation.`
						: null}
				</div>
			) : (
				<div className="small">
					{currency(levels.first - payroll)} below the first apron. Crossing it
					limits trade matching to outgoing salary plus the game's $1M
					tolerance. Apron room is not salary-cap space.
				</div>
			)}
			{state?.hardCap ? (
				<div className="border rounded p-2 mt-2 fw-semibold">
					Remaining room under your hard cap:{" "}
					{currency(
						(state.hardCap === 1 ? levels.first : levels.second) - payroll,
					)}
					. All signings, including renewals and minimum contracts, must fit.
				</div>
			) : null}
			{!compact && showOwner ? (
				<div className="border-top pt-2 mt-3">
					<b>Owner: {owner.label}.</b> {owner.text}
				</div>
			) : null}
			<details className="small mt-2">
				<summary className="fw-semibold">
					{compact || !showOwner
						? "Apron rules & penalties"
						: "Owner targets & apron rules"}
				</summary>
				<div className="mt-2">
					{!compact && showOwner ? (
						<div>
							Target: {Math.round(owner.winPct * 100)}% wins
							{budget
								? ` · Profit ${currency(owner.minProfit)} · Salaries + tax budget ${currency(owner.maxCost)}`
								: ""}
							.
						</div>
					) : null}
					<div>
						Aprons compare payroll, excluding luxury tax. Receiving a
						sign-and-trade player or using the full mid-level exception requires
						staying below the first apron. Using the taxpayer mid-level
						exception requires staying below the second apron.
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
					{budget && status.ownerEvaluation && !danger ? (
						<div className="mt-1">
							Owner's red line: a roster above the second apron costing $500M or
							more in salaries and luxury tax means dismissal, regardless of
							results.
						</div>
					) : null}
				</div>
			</details>
			{status.penalties.length > 0 ? (
				<div className="small fw-semibold mt-2">
					{status.penalties.length} future first-round{" "}
					{status.penalties.length === 1 ? "pick has" : "picks have"} apron
					restrictions. See apron rules for seasons and penalties.
				</div>
			) : null}
			{budget && status.ownerEvaluation && total > owner.maxCost ? (
				<div className="fw-bold mt-1">
					You are {currency(total - owner.maxCost)} over the owner's roster
					budget. This counts against your performance evaluation.
				</div>
			) : null}
			{danger ? (
				<div className="fw-bold border-top pt-2 mt-2">
					Dismissal guaranteed at the annual evaluation: a roster above the
					second apron costing $500M or more in salaries and luxury tax means
					dismissal, regardless of results.
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
