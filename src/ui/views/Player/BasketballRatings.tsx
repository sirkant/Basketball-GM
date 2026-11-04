import {
	getPositionProfiles,
	FIT_LABELS,
	type RoleAttributes,
} from "../../../common/basketballPositions.ts";
import { RatingWithChange } from "../../components/RatingWithChange.tsx";

type Ratings = RoleAttributes & {
	pos: string;
	ovr: number;
	pot: number;
	endu: number;
	dnk: number;
	ft: number;
	fg: number;
};
const groups = [
	{
		title: "PHYSICAL",
		values: [
			["hgt", "Size / reach"],
			["stre", "Strength"],
			["spd", "Speed"],
			["jmp", "Vertical"],
			["endu", "Endurance"],
		],
	},
	{
		title: "SCORING",
		values: [
			["ins", "Inside scoring"],
			["dnk", "Dunks & layups"],
			["ft", "Free throws"],
			["fg", "Mid-range"],
			["tp", "Three-point shot"],
		],
	},
	{
		title: "BASKETBALL IQ & SKILL",
		values: [
			["oiq", "Offensive IQ"],
			["diq", "Defensive IQ"],
			["drb", "Ball handling"],
			["pss", "Passing"],
			["reb", "Rebounding"],
		],
	},
] as const;

export const BasketballRatings = ({
	current,
	previous,
}: {
	current: Ratings;
	previous: Ratings;
}) => {
	const mean = (keys: Exclude<keyof Ratings, "pos">[]) =>
		Math.round(keys.reduce((sum, key) => sum + current[key]!, 0) / keys.length);
	const axes = [
		{ label: "SHOOTING", value: mean(["ft", "fg", "tp"]) },
		{ label: "FINISHING", value: mean(["ins", "dnk"]) },
		{ label: "CREATION", value: mean(["oiq", "drb", "pss"]) },
		{ label: "DEFENSE", value: current.diq },
		{ label: "REBOUNDING", value: current.reb },
		{ label: "ATHLETICISM", value: mean(["stre", "spd", "jmp", "endu"]) },
	];
	const point = (i: number, r: number) => {
		const angle = (i * Math.PI) / 3 - Math.PI / 2;
		return `${140 + Math.cos(angle) * r},${122 + Math.sin(angle) * r}`;
	};
	const profiles = getPositionProfiles(current, current.pos);
	return (
		<section
			className="basketball-scouting-dossier"
			aria-label="Basketball scouting report"
		>
			<header>
				<div>
					<span className="dossier-eyebrow">SCOUTING REPORT</span>
					<h3>The player, on the floor</h3>
				</div>
				<div className="dossier-ability">
					<div>
						<span>OVERALL</span>
						<strong>
							<RatingWithChange change={current.ovr! - previous.ovr!}>
								{current.ovr}
							</RatingWithChange>
						</strong>
					</div>
					<div>
						<span>POTENTIAL</span>
						<strong>
							<RatingWithChange change={current.pot! - previous.pot!}>
								{current.pot}
							</RatingWithChange>
						</strong>
					</div>
				</div>
			</header>
			<div className="dossier-scouting-body">
				<div className="dossier-attributes">
					{groups.map((group) => (
						<section key={group.title}>
							<h4>{group.title}</h4>
							<dl>
								{group.values.map(([key, label]) => (
									<div key={key}>
										<dt>{label}</dt>
										<dd>
											<strong>{current[key!]}</strong>
											<span>
												<RatingWithChange
													change={current[key!]! - previous[key!]!}
												/>
											</span>
										</dd>
									</div>
								))}
							</dl>
						</section>
					))}
				</div>
				<div className="dossier-radar">
					<svg
						viewBox="0 0 280 258"
						role="img"
						aria-label="Scouted attribute profile"
					>
						<title>
							{axes.map((axis) => `${axis.label}: ${axis.value}`).join("; ")}.
							Composites of displayed scouting attributes, on a 0–100 scale.
						</title>
						{[0.25, 0.5, 0.75, 1].map((scale) => (
							<polygon
								key={scale}
								className="dossier-radar-grid"
								points={axes.map((_, i) => point(i, 82 * scale)).join(" ")}
							/>
						))}
						{axes.map((_, i) => (
							<line
								key={i}
								className="dossier-radar-axis"
								x1="140"
								y1="122"
								x2={point(i, 82).split(",")[0]}
								y2={point(i, 82).split(",")[1]}
							/>
						))}
						<polygon
							className="dossier-radar-fill"
							points={axes
								.map((axis, i) =>
									point(
										i,
										(82 * Math.max(0, Math.min(100, axis.value!))) / 100,
									),
								)
								.join(" ")}
						/>
						{axes.map((axis, i) => (
							<text
								key={axis.label}
								x={point(i, 108).split(",")[0]}
								y={point(i, 108).split(",")[1]}
								textAnchor="middle"
								dominantBaseline="middle"
							>
								{axis.label}
							</text>
						))}
					</svg>
					<span>Scouted attributes · 0–100</span>
				</div>
			</div>
			<div className="dossier-role-coverage">
				<span className="dossier-eyebrow">POSITIONAL COVERAGE</span>
				<div>
					{profiles.map((profile) => (
						<section key={profile.position} data-fit={profile.fit}>
							<strong>{profile.position}</strong>
							<span>{FIT_LABELS[profile.fit]}</span>
							<small>{profile.score} role score</small>
						</section>
					))}
				</div>
				<p>
					Suitability uses the displayed scouting ratings. Your roster's Court &
					Depth view compares available alternatives.
				</p>
			</div>
		</section>
	);
};
