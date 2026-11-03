import type { RoleAttributes } from "./basketballPositions.ts";

const areas = [
	{
		key: "size",
		label: "Size & reach",
		weights: { hgt: 1 },
		advice:
			"Add length to the rotation; protect smaller lineups with a true interior presence.",
	},
	{
		key: "rebounding",
		label: "Rebounding",
		weights: { hgt: 2, stre: 0.1, jmp: 0.1, reb: 2, oiq: 0.5, diq: 0.5 },
		advice:
			"Prioritize a rebounder with size. Avoid pairing multiple weak rebounders in the frontcourt.",
	},
	{
		key: "shooting",
		label: "Three-point shooting",
		weights: { oiq: 0.1, tp: 1 },
		advice:
			"Find another credible shooter to open driving lanes and give your creators space.",
	},
	{
		key: "perimeter",
		label: "Perimeter defense",
		weights: { hgt: 0.5, stre: 0.5, spd: 2, jmp: 0.5, diq: 1 },
		advice:
			"Look for a mobile perimeter defender; balance scoring guards with someone who can contain the ball.",
	},
	{
		key: "interior",
		label: "Interior defense",
		weights: { hgt: 2.5, stre: 1, spd: 0.5, jmp: 0.5, diq: 2 },
		advice:
			"Add size and defensive awareness inside; surround small-ball centers with help on the glass.",
	},
	{
		key: "creation",
		label: "Ball handling & passing",
		weights: { drb: 1, pss: 1, oiq: 0.5 },
		advice:
			"Add a second ball handler and passer so the offense does not depend on one creator.",
	},
] as const;

export type CoachPlayer = {
	pid: number;
	rosterOrder: number;
	injured: boolean;
	ratings: RoleAttributes;
};
export type CoachReport = {
	rotationSize: number;
	injuredRotation: number;
	leagueSize: number;
	areas: {
		key: string;
		label: string;
		score: number;
		rank: number;
		level: "strength" | "weakness" | "balanced";
		advice: string;
	}[];
};

// Equal-weight first eight in lineup order, not minutes or a prediction of wins.
// Pass only scouted inputs. Tied scores share rank, including a fully tied league.
export const getCoachReport = (
	teams: { tid: number; players: CoachPlayer[] }[],
	tid: number,
): CoachReport | undefined => {
	const rotations = teams
		.filter((t) => t.players.length > 0)
		.map((t) => ({
			tid: t.tid,
			players: [...t.players]
				.sort((a, b) => a.rosterOrder - b.rosterOrder || a.pid - b.pid)
				.slice(0, 8),
		}));
	const rotation = rotations.find((t) => t.tid === tid);
	if (!rotation) {
		return;
	}
	return {
		rotationSize: rotation.players.length,
		injuredRotation: rotation.players.filter((p) => p.injured).length,
		leagueSize: rotations.length,
		areas: areas.map((area) => {
			const scoreTeam = (players: CoachPlayer[]) => {
				const entries = Object.entries(area.weights) as [
					keyof RoleAttributes,
					number,
				][];
				return (
					players.reduce(
						(sum, p) =>
							sum +
							entries.reduce(
								(s, [key, weight]) =>
									s + Math.max(0, Math.min(100, p.ratings[key])) * weight,
								0,
							) /
								entries.reduce((s, [, weight]) => s + weight, 0),
						0,
					) / players.length
				);
			};
			const score = scoreTeam(rotation.players);
			const scores = rotations.map((t) => scoreTeam(t.players));
			const above = scores.filter((s) => s > score + 0.01).length;
			const below = scores.filter((s) => s < score - 0.01).length;
			const threshold = Math.ceil(rotations.length * 0.75);
			const level =
				rotations.length < 4
					? "balanced"
					: below >= threshold
						? "strength"
						: above >= threshold
							? "weakness"
							: "balanced";
			return {
				key: area.key,
				label: area.label,
				score: Math.round(score),
				rank: above + 1,
				level,
				advice: area.advice,
			};
		}),
	};
};
