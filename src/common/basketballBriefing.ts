export const coachAreas = [
	{
		key: "tp",
		label: "Three-point shooting",
		request: "Find another credible floor spacer in the rotation.",
	},
	{
		key: "reb",
		label: "Rebounding",
		request:
			"Give the rotation more reliable rebounding and finish defensive possessions.",
	},
	{
		key: "diq",
		label: "Defensive awareness",
		request:
			"Improve defensive coverage without leaving a weak link in the rotation.",
	},
	{
		key: "pss",
		label: "Passing",
		request:
			"Find a second creator so the offense does not depend on one passer.",
	},
	{
		key: "ins",
		label: "Interior scoring",
		request: "Improve the rotation's ability to finish inside.",
	},
] as const;
export type CoachArea = (typeof coachAreas)[number]["key"];
export type CoachRequest = {
	area: CoachArea;
	label: string;
	baselineRank: number;
	targetRank: number;
	decision?: "prioritize" | "decline";
	reviewedRank?: number;
	resolved?: boolean;
	supersededBy?: string;
};
export type CoachMemo = {
	kind: "roster" | "playoff";
	key: string;
	gamesPlayed: number;
	fingerprint?: string;
	request?: CoachRequest;
	opponentTid?: number;
	gid?: number;
};
export type BriefingTeam = {
	tid: number;
	name: string;
	powerRank: number;
	ovr: number;
	availableOvr: number;
	ranks: Record<string, number>;
	healthyRanks: Record<string, number>;
	gp: number;
	mov: number;
	tpa: number;
	tpp: number;
	injuries: number;
};

export const buildRosterBriefing = (
	team: BriefingTeam,
	size: number,
	previous?: CoachRequest,
) => {
	const paragraphs = [
		`We are #${team.powerRank} of ${size} in Power Rankings. Our available roster rates ${team.availableOvr}, compared with ${team.ovr} at full strength.`,
	];
	if (team.injuries > 0) {
		paragraphs.push(
			`${team.injuries} player(s) are carrying injuries. Current grades account for injuries and the team's play-through settings; this is not automatically a reason to make a permanent trade.`,
		);
	}
	if (team.gp > 0) {
		paragraphs.push(
			`Through ${team.gp} regular-season games, our average scoring margin is ${team.mov.toFixed(1)} points. Roster grades describe our tools, not a guarantee of results.`,
		);
	}
	const areas = coachAreas.toSorted(
		(a, b) => team.ranks[b.key]! - team.ranks[a.key]!,
	);
	let request: CoachRequest | undefined;
	if (previous) {
		const rank = team.ranks[previous.area]!;
		paragraphs.push(
			`Last priority: ${previous.label}, originally #${previous.baselineRank}. It is now #${rank}; the target was #${previous.targetRank} or better.${previous.decision === "decline" ? " You chose to keep the current plan." : previous.decision === "prioritize" ? " You asked us to prioritize this." : ""}${rank <= previous.targetRank ? " The current coverage meets that target." : " The gap remains open."}`,
		);
		if (rank > previous.targetRank) {
			request = {
				...previous,
				reviewedRank: rank,
				resolved: false,
				supersededBy: undefined,
			};
		}
	}
	if (
		!request &&
		size >= 4 &&
		team.ranks[areas[0]!.key]! > Math.ceil((size * 2) / 3)
	) {
		const area = areas[0]!;
		request = {
			area: area.key,
			label: area.label,
			baselineRank: team.ranks[area.key]!,
			targetRank: Math.ceil(size / 2),
		};
	}
	if (request) {
		const area = coachAreas.find((a) => a.key === request.area)!;
		paragraphs.push(
			`My request: ${area.request} We currently rank #${team.ranks[area.key]} in ${area.label.toLowerCase()} on the injury-adjusted Power Rankings grades; aim for the top half (#${request.targetRank} or better). Start by comparing the players already on the roster, then scout additions if internal cover is insufficient.`,
		);
		if (
			team.healthyRanks[area.key]! <= request.targetRank &&
			team.ranks[area.key]! > request.targetRank
		) {
			paragraphs.push(
				`At full strength this area is #${team.healthyRanks[area.key]}. Temporary cover while players recover may be more appropriate than changing the core.`,
			);
		}
	} else {
		paragraphs.push(
			"There is no clear bottom-third gap in these core scouting grades. Keep the rotation balanced and protect what is already working rather than chasing a change for its own sake.",
		);
	}
	const best = coachAreas.toSorted(
		(a, b) => team.ranks[a.key]! - team.ranks[b.key]!,
	)[0]!;
	paragraphs.push(
		`Our strongest of these grades is ${best.label.toLowerCase()}, #${team.ranks[best.key]} of ${size}.`,
	);
	return {
		subject: request
			? `Roster priority: ${request.label.toLowerCase()}`
			: "Coach's roster assessment",
		paragraphs,
		request,
	};
};

export const buildPlayoffBriefing = (
	ours: BriefingTeam,
	opponent: BriefingTeam,
	size: number,
	game: { number: number; home: boolean; series?: string; stage: string },
) => {
	const difference = ours.availableOvr - opponent.availableOvr;
	const paragraphs = [
		`${game.stage}, game ${game.number} ${game.home ? "at home" : "away"} against ${opponent.name}.${game.series ? ` Series: ${game.series}.` : ""}`,
		`Power Rankings: we are #${ours.powerRank}; ${opponent.name} is #${opponent.powerRank} of ${size}. Available roster ratings are ${ours.availableOvr} versus ${opponent.availableOvr}.`,
	];
	paragraphs.push(
		difference >= 4
			? "Our available players rate stronger on paper. We still have to turn that talent edge into good possessions; this is not a comfortable win by default."
			: difference <= -4
				? "Their available roster has the talent edge. We need to lean into our best matchups and avoid giving them extra possessions."
				: "Available talent is closely matched. Small lineup advantages, availability and execution can swing this game.",
	);
	const top = Math.max(1, Math.ceil(size / 4));
	if (opponent.ranks.tp! <= top) {
		paragraphs.push(
			`Their three-point shooting is a real scouting threat: #${opponent.ranks.tp} of ${size} on current roster grades. Avoid combinations that concede easy perimeter looks and keep a credible perimeter defender alongside our scorers.${opponent.gp > 0 ? ` Their regular-season production was ${opponent.tpa.toFixed(1)} three-point attempts per game at ${opponent.tpp.toFixed(1)}%.` : " There is no regular-season shooting sample yet."}`,
		);
	}
	if (opponent.ranks.reb! <= top && ours.ranks.reb! > Math.ceil(size / 2)) {
		paragraphs.push(
			`The glass is another risk: their rebounding grade is #${opponent.ranks.reb}, ours #${ours.ranks.reb}. Consider a lineup with stronger rebounding coverage to finish defensive possessions.`,
		);
	}
	const ranks = coachAreas.map((a) => opponent.ranks[a.key]!);
	if (
		size >= 4 &&
		Math.max(...ranks) <= Math.ceil((size * 2) / 3) &&
		Math.max(...ranks) - Math.min(...ranks) <= Math.max(3, Math.ceil(size / 3))
	) {
		paragraphs.push(
			"They are a well-balanced opponent across these core grades, with no bottom-third scouting weakness to target. Build around our strongest combination rather than assuming they have an obvious weak link.",
		);
	}
	if (ours.injuries || opponent.injuries) {
		paragraphs.push(
			`Injury context: ${ours.injuries} player(s) on our roster and ${opponent.injuries} on theirs carry injuries. Healthy roster ratings are ${ours.ovr} versus ${opponent.ovr}; the available ratings above use the same injury treatment as Power Rankings.`,
		);
	}
	const edge = coachAreas.toSorted(
		(a, b) =>
			opponent.ranks[b.key]! -
			ours.ranks[b.key]! -
			(opponent.ranks[a.key]! - ours.ranks[a.key]!),
	)[0]!;
	paragraphs.push(
		`Our clearest relative scouting matchup is ${edge.label.toLowerCase()}: we rank #${ours.ranks[edge.key]}, they rank #${opponent.ranks[edge.key]}. Check Court & Depth for personnel that can support the plan. These are scouting assessments, not simulated coaching orders.`,
	);
	return {
		subject: `Game ${game.number} v ${opponent.name}: coach's preview`,
		paragraphs,
	};
};

export const isBlockingMessage = (message: {
	read: boolean;
	advisory?: boolean;
}) => !message.read && !message.advisory;
