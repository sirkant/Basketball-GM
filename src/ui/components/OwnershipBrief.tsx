import type { View } from "../../common/types.ts";
import { helpers } from "../util/helpers.ts";
import type { OwnerObjective } from "../../common/ownership.ts";

const value = (number: number | undefined, unit: OwnerObjective["unit"]) =>
	number === undefined
		? "—"
		: unit === "money"
			? helpers.formatCurrency(number / 1000, "M")
			: unit === "pct"
				? `${(number * 100).toFixed(1)}%`
				: unit === "rating" || unit === "age"
					? number.toFixed(1)
					: `${number}`;

const ObjectiveRow = ({
	objective: o,
	final = false,
}: {
	objective: OwnerObjective;
	final?: boolean;
}) => {
	const actual =
		o.key === "playoffs" && o.actual !== undefined
			? o.status === "unassessed"
				? "Pending"
				: o.actual < 0
					? "Missed playoffs"
					: o.actual === 0
						? "Qualified"
						: `${o.actual} series won`
			: value(o.actual, o.unit);
	const status =
		!final && o.status === "missed" && o.key !== "cost" ? "tracking" : o.status;
	return (
		<div className="ownership-objective">
			<span>{o.label}</span>
			<strong>{actual}</strong>
			<span>
				{o.direction === "min" ? "Target ≥" : "Target ≤"}{" "}
				{o.key === "playoffs"
					? o.target === 0
						? "Qualify"
						: `${o.target} series won`
					: value(o.target, o.unit)}
			</span>
			<span className="ownership-grade" data-status={status}>
				{o.status === "met"
					? "On target"
					: o.status === "unassessed"
						? "Not graded yet"
						: final
							? "Missed"
							: o.key === "cost"
								? "Over budget"
								: "Target in progress"}
			</span>
		</div>
	);
};

export const OwnershipBrief = ({
	ownership,
}: {
	ownership: View<"teamFinances">["ownership"];
}) => {
	const current = ownership?.current;
	if (!current) {
		return null;
	}
	const { mandate } = current;
	const lastConflict = [...mandate.decisions]
		.reverse()
		.find((d) => d.concerns.length > 0);
	return (
		<section
			className="ownership-office"
			id="ownership"
			aria-label="Ownership mandate"
		>
			<header className="ownership-heading">
				<div>
					<span className="basketball-kicker">
						The owner's office / {mandate.season}
					</span>
					<h2>
						{mandate.mode === "rebuild"
							? "Build the next core"
							: "Make this window count"}
					</h2>
				</div>
				<span>
					{mandate.mode === "rebuild"
						? "Rebuilding mandate"
						: "Compete-now mandate"}
				</span>
			</header>
			<p className="ownership-letter">“{mandate.opening}”</p>
			<p className="ownership-followup">
				<strong>{current.verdict}.</strong>{" "}
				{lastConflict
					? `Your trade${lastConflict.partnerName ? ` with ${lastConflict.partnerName}` : ""}: ${lastConflict.concerns[0]}`
					: mandate.injuries.keyMissed > 0
						? `I have recorded ${mandate.injuries.keyMissed} core player-games lost to injury. That context will be considered separately from your spending and trade decisions.`
						: "We will review the evidence against this agreement at season end."}
			</p>
			{mandate.deferRosterAssessment ? (
				<p className="small text-body-secondary">
					This mandate was issued after the trade deadline. New roster-building
					milestones are informational until the next mandate.
				</p>
			) : null}
			<div className="ownership-plan">
				<div>
					<h3>The agreement</h3>
					<ul>
						{mandate.instructions.map((text) => (
							<li key={text}>{text}</li>
						))}
					</ul>
					<p className="text-body-secondary small">
						Targets were set when this mandate was issued. Rotation metrics use
						the best eight players, not end-of-bench filler. Young core
						candidates are 25 or under with OVR 50+ or POT 60+; hidden-rating
						leagues use young rotation players.
					</p>
				</div>
				<div>
					<h3>Where we stand</h3>
					<div className="ownership-objectives">
						{current.objectives.map((o) => (
							<ObjectiveRow key={o.key} objective={o} />
						))}
					</div>
					<p className="text-body-secondary small mt-2">
						Win rate is graded after {mandate.targets.minimumGames ?? 10} games
						under this mandate. Profit and playoffs are graded at season end.
					</p>
				</div>
			</div>
			<details className="ownership-evidence">
				<summary>Injuries & circumstances</summary>
				<p>
					{mandate.injuries.games} regular-season games tracked ·{" "}
					{mandate.injuries.keyMissed} named-core player-games missed ·{" "}
					{mandate.injuries.rotationMissed} rotation player-games missed.
				</p>
				<p className="small">
					Tracking starts at the mandate. Only injury absences by the named
					baseline rotation while still on your team count. Healthy DNPs, games
					on another team and played-through injuries are excluded. Win-rate
					relief is capped at eight percentage points and never excuses spending
					or ignored instructions.
				</p>
				{mandate.injuries.players.map((p) => (
					<div key={p.pid}>
						{p.name}: {p.games} tracked injury absences
					</div>
				))}
				{mandate.issuedGames > 0 ? (
					<p className="small">
						Issued after {mandate.issuedGames} games; earlier circumstances and
						decisions are not reconstructed.
					</p>
				) : null}
			</details>
			<details className="ownership-evidence">
				<summary>
					Decision journal · {mandate.decisions.length} executed trades
				</summary>
				{mandate.decisions.length === 0 ? (
					<p>No trades have been recorded under this mandate.</p>
				) : (
					[...mandate.decisions].reverse().map((d) => (
						<article className="ownership-decision" key={d.eid}>
							<a href={helpers.leagueUrl(["trade_summary", d.eid])}>
								{d.partnerName ? `Trade with ${d.partnerName}` : "View trade"}
							</a>
							<p>
								Sent: {d.sent.join(", ") || "Draft assets"} · Received:{" "}
								{d.received.join(", ") || "Draft assets"}
							</p>
							{d.concerns.map((text) => (
								<p className="text-warning-emphasis" key={text}>
									Instruction conflict: {text}
								</p>
							))}
							{d.positives.map((text) => (
								<p key={text}>{text}</p>
							))}
						</article>
					))
				)}
			</details>
			{ownership.latest ? (
				<details className="ownership-evidence">
					<summary>
						Last annual evaluation · {ownership.latest.season} ·{" "}
						{ownership.latest.verdict}
					</summary>
					{ownership.latest.paragraphs.map((p, i) => (
						<p key={i}>{p}</p>
					))}
					<div className="ownership-objectives">
						{ownership.latest.objectives.map((o) => (
							<ObjectiveRow key={o.key} objective={o} final />
						))}
					</div>
					<p>
						Roster execution: {ownership.latest.strategyDelta >= 0 ? "+" : ""}
						{ownership.latest.strategyDelta.toFixed(2)} · Win-rate context
						allowance: {(ownership.latest.injuryCredit * 100).toFixed(1)}{" "}
						percentage points.
					</p>
				</details>
			) : null}
			{!ownership.evaluationEnabled ? (
				<p className="small text-body-secondary">
					God Mode: normal performance evaluation is informational.
				</p>
			) : ownership.season < ownership.gracePeriodEnd ? (
				<p className="small text-body-secondary">
					Normal job-security changes begin in {ownership.gracePeriodEnd}.{" "}
					{ownership.budget
						? "The $500M second-apron dismissal rule still applies."
						: null}
				</p>
			) : null}
		</section>
	);
};
