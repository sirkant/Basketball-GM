import type { SalaryPlan } from "../../common/salaryPlanner.ts";
import { helpers } from "../util/helpers.ts";

const currency = (amount: number) =>
	Math.abs(amount) < 1
		? helpers.formatCurrency(amount * 1000, "", 0)
		: helpers.formatCurrency(amount / 1000, "M");

export const SalaryPlanner = ({ plan }: { plan: SalaryPlan }) => {
	const { after, before } = plan;
	const projection = after ?? before;
	const limitRows = [
		["Salary cap", "cap"],
		["First apron", "firstApron"],
		["Second apron", "secondApron"],
	] as const;
	const rows = [
		...(after
			? [
					{ label: "Before trade", amounts: before.map(({ total }) => total) },
					{
						label: "After trade",
						amounts: after.map(({ total }) => total),
						emphasis: true,
					},
					{
						label: "Change",
						amounts: after.map(
							({ total }, index) =>
								Math.round((total - before[index]!.total) * 1000) / 1000,
						),
						signed: true,
					},
				]
			: [
					{
						label: "Total commitments",
						amounts: before.map(({ total }) => total),
						emphasis: true,
					},
				]),
		{ label: "Roster salary", amounts: projection.map(({ roster }) => roster) },
		{
			label: "Released salary",
			amounts: projection.map(({ released }) => released),
		},
		{
			label: "Expiring salary",
			amounts: projection.map(({ expiring }) => expiring),
		},
	];
	const hasCap = projection[0]?.cap !== undefined;

	return (
		<>
			<div className="table-responsive">
				<table className="table table-sm mb-2">
					<caption className="visually-hidden">
						{after
							? "Three-year commitments before and after the trade"
							: "Three-year salary commitments"}
					</caption>
					<thead>
						<tr>
							<th scope="col">{after ? "Trade projection" : "Commitments"}</th>
							{projection.map(({ season }) => (
								<th key={season} scope="col" className="text-end">
									{season}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{rows.map(({ label, amounts, emphasis, signed }) => (
							<tr
								key={label}
								className={emphasis ? "table-active fw-bold" : undefined}
							>
								<th scope="row" className={emphasis ? undefined : "fw-normal"}>
									{label}
								</th>
								{amounts.map((amount, index) => (
									<td
										key={projection[index]!.season}
										className="text-end text-nowrap font-monospace"
									>
										{signed && amount > 0 ? "+" : ""}
										{currency(amount)}
									</td>
								))}
							</tr>
						))}
						{limitRows.map(([label, key]) =>
							projection[0]?.[key] === undefined ? null : (
								<tr key={key}>
									<th scope="row" className="fw-normal">
										{label}
									</th>
									{projection.map(({ season, [key]: distance }) => (
										<td
											key={season}
											className={`text-end ${distance !== undefined && distance < 0 ? "text-danger" : "text-body-secondary"}`}
										>
											{distance === undefined || distance === 0 ? (
												"At limit"
											) : (
												<>
													<span className="text-nowrap font-monospace">
														{currency(Math.abs(distance))}
													</span>{" "}
													{distance < 0 ? "over" : "below"}
												</>
											)}
										</td>
									))}
								</tr>
							),
						)}
					</tbody>
				</table>
			</div>
			<p className="small text-body-secondary mb-0">
				{after
					? hasCap
						? "The breakdown and limit distances reflect the proposed roster. "
						: "The breakdown reflects the proposed roster. "
					: ""}
				Expiring salary is included in that year’s total and rolls off the
				following year.
				{hasCap
					? " Limits stay at today’s values. Distances exclude cap holds and roster charges."
					: ""}{" "}
				The projection assumes contracts run to expiry and excludes future moves
				and taxes.
			</p>
		</>
	);
};
