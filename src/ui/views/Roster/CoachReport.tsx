import type { CoachReport as Report } from "../../../common/basketballCoach.ts";

const CoachReport = ({ report }: { report: Report }) => {
	const weaknesses = report.areas
		.filter((area) => area.level === "weakness")
		.sort((a, b) => b.rank - a.rank)
		.slice(0, 2);
	const strengths = report.areas
		.filter((area) => area.level === "strength")
		.sort((a, b) => a.rank - b.rank)
		.slice(0, 2);
	return (
		<section
			className="court-coach-report"
			aria-label="Assistant coach scouting report"
		>
			<div className="court-panel-heading">
				<div>
					<span className="basketball-kicker">Assistant coach</span>
					<h3>The roster, on the floor</h3>
				</div>
				<span>League comparison</span>
			</div>
			<p className="court-coaching-note">
				Scouted outlook · First {report.rotationSize} players in lineup order ·{" "}
				{report.leagueSize} teams. Equal weight per player; includes injured
				players, not actual minutes or team results.
			</p>
			<div className="coach-area-grid">
				{report.areas.map((area) => (
					<div className="coach-area" data-level={area.level} key={area.key}>
						<span>{area.label}</span>
						<strong>
							#{area.rank}
							<small> / {report.leagueSize}</small>
						</strong>
						<span>
							{area.level === "strength"
								? "League strength"
								: area.level === "weakness"
									? "Needs cover"
									: "In the mix"}
						</span>
					</div>
				))}
			</div>
			<div className="coach-verdicts">
				<div>
					<h4>Build around</h4>
					{strengths.length ? (
						strengths.map((area) => (
							<p key={area.key}>
								<strong>{area.label}:</strong> our rotation projects in the
								league’s top quarter. Preserve that advantage when changing the
								lineup.
							</p>
						))
					) : (
						<p>
							No clear top-quarter advantage in these areas. Build complementary
							lineups rather than relying on one standout team skill.
						</p>
					)}
				</div>
				<div>
					<h4>Cover the gaps</h4>
					{weaknesses.length ? (
						weaknesses.map((area) => (
							<p key={area.key}>
								<strong>{area.label}:</strong> {area.advice}
							</p>
						))
					) : (
						<p>
							No clear bottom-quarter weakness in these areas. Check positional
							fit and actual production before spending to upgrade.
						</p>
					)}
				</div>
			</div>
			{report.injuredRotation > 0 ? (
				<p className="coach-availability">
					{report.injuredRotation} of these rotation players currently injured.
					This is the full-strength outlook; check available alternatives by
					position above.
				</p>
			) : null}
		</section>
	);
};
export default CoachReport;
