import { getOwnerExpectations, type OwnerPriority } from "./nbaAprons.ts";

export type OwnershipPlayer = {
	pid: number;
	name: string;
	age: number;
	ovr: number;
	pot: number;
	order: number;
};
export type OwnershipRoster = {
	talent?: number;
	age: number;
	youngCore: number;
	firsts: number;
	rotation: OwnershipPlayer[];
};
export type OwnerDecision = {
	partnerName?: string;
	eid: number;
	season: number;
	phase: number;
	sent: string[];
	received: string[];
	concerns: string[];
	positives: string[];
};
export type OwnerMandate = {
	version: 1;
	season: number;
	mode: "rebuild" | "compete";
	priority: OwnerPriority;
	issuedGames: number;
	issuedWins: number;
	ratingsHidden: boolean;
	baseline: OwnershipRoster;
	targets: {
		winPct: number;
		talent?: number;
		maxAge?: number;
		youngCore?: number;
		firsts?: number;
		rotationSize: number;
		maxCost: number;
		minProfit: number;
		playoffRounds: number;
		minimumGames?: number;
	};
	weights: { wins: number; money: number };
	opening: string;
	instructions: string[];
	injuries: {
		games: number;
		playoffs: number;
		keyMissed: number;
		rotationMissed: number;
		playoffMissed: number;
		players: { pid: number; name: string; games: number }[];
		gids: number[];
	};
	decisions: OwnerDecision[];
};
export type OwnerObjective = {
	key: string;
	label: string;
	target: number;
	actual?: number;
	unit: "pct" | "rating" | "age" | "count" | "money";
	direction: "min" | "max";
	status: "met" | "missed" | "unassessed";
};
export type OwnerReview = {
	season: number;
	mandate: OwnerMandate;
	roster: OwnershipRoster;
	objectives: OwnerObjective[];
	verdict: string;
	paragraphs: string[];
	injuryCredit: number;
	strategyDelta: number;
	winsDelta: number;
	applied?: boolean;
};

export const ownershipRoster = (
	players: OwnershipPlayer[],
	firsts: number,
	hidden: boolean,
): OwnershipRoster => {
	const rotation = [...players]
		.sort((a, b) =>
			hidden ? a.order - b.order : b.ovr - a.ovr || a.order - b.order,
		)
		.slice(0, 8);
	return {
		talent:
			!hidden && rotation.length
				? rotation.reduce((sum, p) => sum + p.ovr, 0) / 8
				: undefined,
		age: rotation.length
			? rotation.reduce((sum, p) => sum + p.age, 0) / rotation.length
			: 0,
		youngCore: rotation.filter(
			(p) => p.age <= 25 && (hidden || p.ovr >= 50 || p.pot >= 60),
		).length,
		firsts,
		rotation,
	};
};

export const createOwnerMandate = ({
	season,
	priority,
	rebuilding,
	roster,
	salaryCap,
	games,
	wins,
	hidden,
	numGames = 82,
}: {
	season: number;
	priority: OwnerPriority;
	rebuilding: boolean;
	roster: OwnershipRoster;
	salaryCap: number;
	games: number;
	wins: number;
	hidden: boolean;
	numGames?: number;
}): OwnerMandate => {
	const owner = getOwnerExpectations(priority, salaryCap);
	const stance = {
		winning:
			"I will fund ambition, but I expect a route to winning playoff series.",
		profit:
			"The franchise must generate a return; a long-term plan cannot depend on permanent losses.",
		lowPayroll:
			"Build affordable depth and develop our own talent before paying for expensive names.",
		balanced:
			"Build something we can sustain, without mortgaging the next competitive window.",
	}[priority];
	const names =
		roster.rotation
			.slice(0, 3)
			.map((p) => p.name)
			.join(", ") || "the next core";
	const instructions = rebuilding
		? [
				"Protect the young core: move an established young rotation player only for comparable young talent or a net first-round pick gain.",
				"Do not spend a net first-round pick on players aged 28 or older.",
				"Improve the best eight players, not the average age of the end of the bench.",
			]
		: [
				"Keep the rotation competitive: do not lose three or more points of rotation talent unless the move gets inside the owner's budget or materially closes an existing budget gap.",
				"Results matter, but the roster budget and apron restrictions still apply.",
			];
	return {
		version: 1,
		season,
		mode: rebuilding ? "rebuild" : "compete",
		priority,
		issuedGames: games,
		issuedWins: wins,
		ratingsHidden: hidden,
		baseline: roster,
		targets: {
			minimumGames: Math.max(1, Math.min(10, numGames)),
			rotationSize: Math.max(1, roster.rotation.length),
			winPct: rebuilding ? 0.35 : owner.winPct,
			talent:
				roster.talent === undefined
					? undefined
					: Math.min(95, roster.talent + (rebuilding ? 3 : -1)),
			maxAge: rebuilding ? Math.max(22, roster.age - 1) : undefined,
			youngCore: rebuilding
				? Math.min(
						6,
						Math.max(2, roster.youngCore + (roster.youngCore < 4 ? 1 : 0)),
					)
				: undefined,
			firsts: rebuilding ? roster.firsts : undefined,
			maxCost: owner.maxCost,
			minProfit: owner.minProfit,
			playoffRounds: rebuilding ? -1 : priority === "winning" ? 1 : 0,
		},
		weights: { wins: owner.winsWeight, money: owner.moneyWeight },
		opening:
			(rebuilding
				? `I am backing a rebuild in ${season}. Our rotation averages ${roster.age.toFixed(1)} years; the priority is a stronger, younger core and enough draft capital to keep building. ${names} give us a starting point. Losing games alone is not progress.`
				: `We are here to compete in ${season}. The window around ${names} needs a competitive rotation that can survive the season. I will judge results, the quality you keep on the floor and the resources you use.`) +
			` ${stance}`,
		instructions,
		injuries: {
			games: 0,
			playoffs: 0,
			keyMissed: 0,
			rotationMissed: 0,
			playoffMissed: 0,
			players: [],
			gids: [],
		},
		decisions: [],
	};
};

export const judgeOwnerTrade = (
	mandate: OwnerMandate,
	before: OwnershipRoster,
	after: OwnershipRoster,
	sent: OwnershipPlayer[],
	received: OwnershipPlayer[],
	beforeCost: number,
	afterCost: number,
	budget = true,
): Pick<OwnerDecision, "concerns" | "positives"> => {
	const concerns: string[] = [],
		positives: string[] = [];
	const netFirsts = after.firsts - before.firsts;
	if (mandate.mode === "rebuild") {
		if (netFirsts < 0 && received.some((p) => p.age >= 28)) {
			concerns.push(
				"Spent net first-round capital on a veteran aged 28 or older, against the rebuild instruction.",
			);
		}
		const core = sent.filter((p) =>
			mandate.baseline.rotation.some(
				(base) =>
					base.pid === p.pid &&
					base.age <= 25 &&
					(mandate.ratingsHidden || base.ovr >= 50 || base.pot >= 60),
			),
		);
		if (
			core.length > 0 &&
			netFirsts <= 0 &&
			!core.every((out) =>
				received.some(
					(p) =>
						p.age <= 25 &&
						(mandate.ratingsHidden
							? true
							: p.ovr >= out.ovr - 5 || p.pot >= out.pot - 5),
				),
			)
		) {
			concerns.push(
				`Moved ${core.map((p) => p.name).join(", ")} without comparable young talent or a net first-round gain.`,
			);
		}
		if (netFirsts > 0) {
			positives.push(
				`Added ${netFirsts} net first-round ${netFirsts === 1 ? "pick" : "picks"} in the next three drafts.`,
			);
		}
		if (after.youngCore > before.youngCore) {
			positives.push("Added to the young rotation core.");
		}
	} else if (
		before.talent !== undefined &&
		after.talent !== undefined &&
		before.talent - after.talent >= 3
	) {
		if (
			budget &&
			beforeCost > mandate.targets.maxCost &&
			beforeCost - afterCost >=
				Math.min(
					beforeCost - mandate.targets.maxCost,
					mandate.targets.maxCost * 0.05,
				)
		) {
			positives.push(
				"Accepted a rotation setback to make material progress toward the owner's budget.",
			);
		} else {
			concerns.push(
				"Reduced rotation talent by at least three points against the compete-now instruction.",
			);
		}
	}
	if (
		budget &&
		beforeCost <= mandate.targets.maxCost &&
		afterCost > mandate.targets.maxCost
	) {
		concerns.push(
			"Took the roster above the owner's salaries-plus-tax budget.",
		);
	}
	if (
		budget &&
		beforeCost > mandate.targets.maxCost &&
		afterCost < beforeCost
	) {
		positives.push("Reduced the cost of an over-budget roster.");
	}
	if (concerns.length === 0 && positives.length === 0) {
		positives.push(
			"No explicit ownership instruction is breached by this package.",
		);
	}
	return { concerns, positives };
};

export const reviewOwnerMandate = (
	mandate: OwnerMandate,
	roster: OwnershipRoster,
	results: {
		games: number;
		wins: number;
		playoffRounds: number;
		cost: number;
		profit: number;
		budget: boolean;
	},
	final = false,
): OwnerReview => {
	const sample = Math.max(0, results.games - mandate.issuedGames);
	const winPct = sample
		? Math.max(0, results.wins - mandate.issuedWins) / sample
		: undefined;
	const enoughGames = sample >= (mandate.targets.minimumGames ?? 10);
	const assessRoster = mandate.issuedGames === 0 || enoughGames;
	const objectives: OwnerObjective[] = [];
	const add = (
		key: string,
		label: string,
		target: number | undefined,
		actual: number | undefined,
		unit: OwnerObjective["unit"],
		direction: OwnerObjective["direction"],
		assess = true,
	) => {
		if (target === undefined) {
			return;
		}
		objectives.push({
			key,
			label,
			target,
			actual,
			unit,
			direction,
			status:
				!assess || actual === undefined
					? "unassessed"
					: (direction === "min" ? actual >= target : actual <= target)
						? "met"
						: "missed",
		});
	};
	add(
		"wins",
		"Win rate after the mandate",
		mandate.targets.winPct,
		winPct,
		"pct",
		"min",
		enoughGames,
	);
	add(
		"rotation",
		"Rotation depth",
		mandate.targets.rotationSize,
		roster.rotation.length,
		"count",
		"min",
		assessRoster,
	);
	add(
		"talent",
		"Scouted best-eight rotation talent",
		mandate.targets.talent,
		roster.talent,
		"rating",
		"min",
		assessRoster,
	);
	add(
		"age",
		"Best-eight rotation age",
		mandate.targets.maxAge,
		roster.age,
		"age",
		"max",
		assessRoster,
	);
	add(
		"core",
		mandate.ratingsHidden
			? "Young rotation players (25 or under)"
			: "Young core candidates (25 or under)",
		mandate.targets.youngCore,
		roster.youngCore,
		"count",
		"min",
		assessRoster,
	);
	add(
		"picks",
		"First-round picks in the next three drafts",
		mandate.targets.firsts,
		roster.firsts,
		"count",
		"min",
		assessRoster,
	);
	if (mandate.targets.playoffRounds >= 0) {
		add(
			"playoffs",
			"Playoff series won (0 means qualify)",
			mandate.targets.playoffRounds,
			results.playoffRounds,
			"count",
			"min",
			final,
		);
	}
	if (results.budget) {
		add(
			"cost",
			"Salaries + luxury tax",
			mandate.targets.maxCost,
			results.cost,
			"money",
			"max",
		);
		add(
			"profit",
			"Season profit",
			mandate.targets.minProfit,
			results.profit,
			"money",
			"min",
			final,
		);
	}
	const strategy = objectives.filter(
		(o) =>
			(mandate.mode === "rebuild"
				? ["talent", "age", "core"]
				: ["rotation", "talent"]
			).includes(o.key) && o.status !== "unassessed",
	);
	const breaches = mandate.decisions.filter(
		(d) => d.concerns.length > 0,
	).length;
	const progress = strategy.length
		? strategy.filter((o) => o.status === "met").length / strategy.length
		: 0.5;
	const strategyDelta =
		(!strategy.length
			? 0
			: mandate.mode === "rebuild"
				? (progress - 0.5) * 0.7
				: Math.min(0, (progress - 1) * 0.35)) -
		Math.min(0.32, breaches * 0.08) -
		objectives.filter(
			(o) => ["rotation", "picks"].includes(o.key) && o.status === "missed",
		).length *
			0.08;
	const injuryCredit =
		enoughGames && mandate.injuries.games > 0 && winPct !== undefined
			? Math.min(
					Math.max(0, mandate.targets.winPct - winPct),
					0.08,
					(0.12 * mandate.injuries.keyMissed) / (3 * mandate.injuries.games),
				)
			: 0;
	const winsDelta =
		enoughGames && winPct !== undefined
			? (winPct + injuryCredit - mandate.targets.winPct) * mandate.weights.wins
			: 0;
	const verdict = !final
		? breaches > 0
			? "Your decisions need an explanation"
			: "The plan is in progress"
		: !assessRoster && breaches === 0
			? "Insufficient time to judge this mandate"
			: breaches > 0
				? "Results with a mandate conflict"
				: progress >= 0.75
					? "The plan is taking shape"
					: progress <= 0.25
						? "The plan needs a response"
						: "Mixed progress on the plan";
	const paragraphs = [
		mandate.mode === "rebuild"
			? `This was a rebuilding mandate. I am judging whether the rotation became younger and stronger, not treating a missed playoff berth as a failed championship run.`
			: "This was a compete-now mandate. Winning and playoff progress matter alongside the rotation and resources you retained.",
	];
	paragraphs.push(
		`${strategy.filter((o) => o.status === "met").length} of ${strategy.length} assessed roster-building milestones are on target. ${breaches} executed ${breaches === 1 ? "trade conflicts" : "trades conflict"} with explicit instructions.`,
	);
	if (mandate.injuries.games > 0) {
		paragraphs.push(
			`Across ${mandate.injuries.games} tracked regular-season games, the named core missed ${mandate.injuries.keyMissed} player-games through injury and the tracked rotation missed ${mandate.injuries.rotationMissed}. Played-through injuries and healthy DNPs do not count as full absences.${injuryCredit > 0 ? ` A ${(injuryCredit * 100).toFixed(1)}-percentage-point allowance applies to the win-rate assessment.` : ""} Injuries provide context, not proof that particular losses were unavoidable.`,
		);
	}
	if (mandate.injuries.playoffs > 0) {
		paragraphs.push(
			`Playoff context: ${mandate.injuries.playoffMissed} tracked rotation player-games missed through injury in ${mandate.injuries.playoffs} games. No automatic playoff-result credit is awarded.`,
		);
	}
	if (!enoughGames) {
		paragraphs.push(
			`Fewer than ${mandate.targets.minimumGames ?? 10} games have been played since this mandate was issued. The new win-rate target is not graded yet.`,
		);
	}
	if (mandate.issuedGames > 0) {
		paragraphs.push(
			`The mandate was issued after ${mandate.issuedGames} games. Earlier games, trades and injuries are not retroactively attributed to this mandate.`,
		);
	}
	return {
		season: mandate.season,
		mandate,
		roster,
		objectives,
		verdict,
		paragraphs,
		injuryCredit,
		strategyDelta,
		winsDelta,
	};
};
