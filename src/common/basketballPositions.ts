export const COURT_POSITIONS = ["PG", "SG", "SF", "PF", "C"] as const;
export type CourtPosition = (typeof COURT_POSITIONS)[number];
export const ROLE_ATTRIBUTES = [
	"hgt",
	"stre",
	"spd",
	"jmp",
	"drb",
	"pss",
	"oiq",
	"diq",
	"tp",
	"reb",
	"ins",
] as const;
type Attribute = (typeof ROLE_ATTRIBUTES)[number];
export type RoleAttributes = Record<Attribute, number>;
export type PositionFit =
	| "listed"
	| "comfortable"
	| "situational"
	| "emergency";
export type PositionProfile = {
	position: CourtPosition;
	score: number;
	fit: PositionFit;
	strengths: string[];
	limitations: string[];
};
export type PositionProfiles = Record<number, PositionProfile[]>;

export const ROLE_NAMES: Record<CourtPosition, string> = {
	PG: "Point guard",
	SG: "Shooting guard",
	SF: "Small forward",
	PF: "Power forward",
	C: "Center",
};
export const FIT_LABELS: Record<PositionFit, string> = {
	listed: "Listed role",
	comfortable: "Strong fit",
	situational: "Situational",
	emergency: "Emergency",
};
const listed: Record<string, readonly CourtPosition[]> = {
	PG: ["PG"],
	G: ["PG", "SG"],
	SG: ["SG"],
	GF: ["SG", "SF"],
	SF: ["SF"],
	F: ["SF", "PF"],
	PF: ["PF"],
	FC: ["PF", "C"],
	C: ["C"],
};
export const getListedPositions = (
	position: string,
): readonly CourtPosition[] => listed[position] ?? [];

const attributeNames: Record<Attribute, string> = {
	hgt: "Size / reach",
	stre: "Strength",
	spd: "Mobility",
	jmp: "Verticality",
	drb: "Ball handling",
	pss: "Passing",
	oiq: "Offensive reads",
	diq: "Defensive reads",
	tp: "Floor spacing",
	reb: "Rebounding",
	ins: "Interior scoring",
};
// Scouting projections, not simulation multipliers. Inputs must already be fuzzed.
const weights: Record<CourtPosition, Partial<Record<Attribute, number>>> = {
	PG: { drb: 0.28, pss: 0.28, oiq: 0.16, spd: 0.14, tp: 0.08, diq: 0.06 },
	SG: { tp: 0.26, spd: 0.2, drb: 0.16, diq: 0.16, oiq: 0.14, hgt: 0.08 },
	SF: {
		hgt: 0.16,
		spd: 0.18,
		diq: 0.2,
		tp: 0.18,
		drb: 0.1,
		stre: 0.1,
		reb: 0.08,
	},
	PF: { hgt: 0.23, stre: 0.18, reb: 0.22, diq: 0.17, ins: 0.1, spd: 0.1 },
	C: { hgt: 0.3, stre: 0.18, reb: 0.24, diq: 0.18, jmp: 0.1 },
};
const roleMinimums: Record<
	CourtPosition,
	Partial<Record<Attribute, number>>
> = {
	PG: { drb: 40, pss: 40, spd: 45 },
	SG: { spd: 45, drb: 30 },
	SF: { hgt: 35, spd: 40 },
	PF: { hgt: 45, stre: 35 },
	C: { hgt: 55, reb: 35 },
};

export const getPositionProfiles = (
	ratings: RoleAttributes,
	position: string,
): PositionProfile[] => {
	const bounded = Object.fromEntries(
		ROLE_ATTRIBUTES.map((key) => [
			key,
			Number.isFinite(ratings[key])
				? Math.max(0, Math.min(100, ratings[key]))
				: 0,
		]),
	) as RoleAttributes;
	const scores = COURT_POSITIONS.map((role) =>
		Object.entries(weights[role]).reduce(
			(sum, [key, weight]) => sum + bounded[key as Attribute] * weight,
			0,
		),
	);
	const best = Math.max(...scores);
	return COURT_POSITIONS.map((role, index) => {
		const entries = Object.keys(weights[role]) as Attribute[];
		const smallBallCenter =
			role === "C" &&
			bounded.hgt >= 45 &&
			bounded.stre >= 65 &&
			bounded.reb >= 60 &&
			bounded.diq >= 60;
		const meetsMinimums =
			smallBallCenter ||
			Object.entries(roleMinimums[role]).every(
				([key, minimum]) => bounded[key as Attribute] >= minimum,
			);
		const score = Math.round(scores[index]!);
		const fit: PositionFit = getListedPositions(position).includes(role)
			? "listed"
			: !meetsMinimums
				? "emergency"
				: scores[index]! >= 55 && scores[index]! >= best - 8
					? "comfortable"
					: scores[index]! >= 40 && scores[index]! >= best - 18
						? "situational"
						: "emergency";
		return {
			position: role,
			score,
			fit,
			strengths: entries
				.filter((key) => bounded[key] >= 60)
				.sort((a, b) => bounded[b] - bounded[a])
				.slice(0, 2)
				.map((key) => attributeNames[key]),
			limitations: entries
				.filter((key) => bounded[key] < 45)
				.sort((a, b) => bounded[a] - bounded[b])
				.slice(0, 2)
				.map((key) => attributeNames[key]),
		};
	});
};

type CourtPlayer = { pid: number; ratings: { pos: string } };

// Assign only the selected starters. Each player occupies exactly one court slot.
export const assignCourtSlots = <P extends CourtPlayer>(
	starters: readonly P[],
	profiles?: PositionProfiles,
): Partial<Record<CourtPosition, P>> => {
	const players = starters.slice(0, 5);
	if (new Set(players.map((p) => p.pid)).size !== players.length) {
		throw new Error("Duplicate starters");
	}
	let bestScore = -Infinity;
	let best: Partial<Record<CourtPosition, P>> = {};
	const visit = (
		slot: number,
		used: Set<number>,
		current: Partial<Record<CourtPosition, P>>,
		score: number,
	) => {
		if (slot === COURT_POSITIONS.length) {
			if (score > bestScore) {
				bestScore = score;
				best = { ...current };
			}
			return;
		}
		const role = COURT_POSITIONS[slot]!;
		for (const p of players) {
			if (used.has(p.pid)) {
				continue;
			}
			const profile = profiles?.[p.pid]?.find((row) => row.position === role);
			const natural = getListedPositions(p.ratings.pos).includes(role);
			const roleScore = profile
				? profile.score + (natural ? 6 : 0)
				: natural
					? 100
					: 0;
			used.add(p.pid);
			current[role] = p;
			visit(slot + 1, used, current, score + roleScore);
			used.delete(p.pid);
			delete current[role];
		}
		if (COURT_POSITIONS.length - slot > players.length - used.size) {
			visit(slot + 1, used, current, score);
		}
	};
	visit(0, new Set(), {}, 0);
	return best;
};

export const replaceStarter = (
	pids: readonly number[],
	starterPid: number,
	benchPid: number,
	numStarters: number,
): number[] => {
	const starterIndex = pids.indexOf(starterPid),
		benchIndex = pids.indexOf(benchPid);
	if (
		new Set(pids).size !== pids.length ||
		starterIndex < 0 ||
		starterIndex >= numStarters ||
		benchIndex < numStarters ||
		benchIndex < 0
	) {
		throw new Error(
			"Select a current starter and a bench player from this roster",
		);
	}
	const result = [...pids];
	[result[starterIndex], result[benchIndex]] = [
		result[benchIndex]!,
		result[starterIndex]!,
	];
	return result;
};
