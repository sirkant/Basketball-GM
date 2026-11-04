import {
	getPositionProfiles,
	FIT_LABELS,
	type RoleAttributes,
} from "../../../common/basketballPositions.ts";
import { AttributePolygon } from "./AttributePolygon.tsx";
import { RatingWithChange } from "../../components/RatingWithChange.tsx";

type Ratings = RoleAttributes & {
	pos: string;
	season?: number;
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
				<AttributePolygon current={current} previous={previous} />
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
