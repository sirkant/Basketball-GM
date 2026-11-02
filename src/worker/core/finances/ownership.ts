import {
	createOwnerMandate,
	judgeOwnerTrade,
	ownershipRoster,
	reviewOwnerMandate,
	type OwnerMandate,
	type OwnerReview,
	type OwnershipPlayer,
} from "../../../common/ownership.ts";
import { idb } from "../../db/index.ts";
import { g, local, helpers } from "../../util/index.ts";
import fuzzRating from "../player/fuzzRating.ts";
import getPayroll from "../team/getPayroll.ts";
import type { Player, TradeTeams } from "../../../common/types.ts";
import {
	apronsEnabled,
	ownerExpectations,
	projectedTax,
	salaryYear,
} from "./nbaAprons.ts";
import { getContractSalary } from "../../../common/contractSalary.ts";
import { PHASE } from "../../../common/constants.ts";

const enabled = () =>
	apronsEnabled() && !g.get("spectator") && g.get("userTids").length === 1;
const escape = (text: string) =>
	text.replace(
		/["&'<>]/g,
		(character) =>
			({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
				character
			]!,
	);
const playerInfo = (p: Player, year: number): OwnershipPlayer => {
	const r = p.ratings.at(-1)!;
	return {
		pid: p.pid,
		name: `${p.firstName} ${p.lastName}`,
		age: year - p.born.year,
		ovr: g.get("challengeNoRatings")
			? 0
			: fuzzRating(r?.ovr ?? 0, r?.fuzz ?? 0),
		pot: g.get("challengeNoRatings")
			? 0
			: fuzzRating(r?.pot ?? 0, r?.fuzz ?? 0),
		order: p.rosterOrder,
	};
};
const valid = (mandate: OwnerMandate | undefined): mandate is OwnerMandate =>
	Boolean(
		mandate?.version === 1 &&
		["rebuild", "compete"].includes(mandate.mode) &&
		Number.isInteger(mandate.season) &&
		mandate.targets &&
		mandate.weights &&
		Array.isArray(mandate.instructions) &&
		mandate.instructions.every((text) => typeof text === "string") &&
		typeof mandate.opening === "string" &&
		Number.isFinite(mandate.issuedGames) &&
		Number.isFinite(mandate.issuedWins) &&
		Number.isFinite(mandate.targets.winPct) &&
		Number.isFinite(mandate.targets.maxCost) &&
		Number.isFinite(mandate.targets.rotationSize) &&
		Number.isFinite(mandate.weights.wins) &&
		Number.isFinite(mandate.weights.money) &&
		Array.isArray(mandate.baseline?.rotation) &&
		mandate.baseline.rotation.every(
			(p) =>
				Number.isFinite(p.pid) &&
				typeof p.name === "string" &&
				Number.isFinite(p.age),
		) &&
		Array.isArray(mandate.decisions) &&
		mandate.decisions.every(
			(d) =>
				Number.isFinite(d.eid) &&
				Array.isArray(d.concerns) &&
				Array.isArray(d.positives) &&
				Array.isArray(d.sent) &&
				Array.isArray(d.received) &&
				[...d.concerns, ...d.positives, ...d.sent, ...d.received].every(
					(text) => typeof text === "string",
				),
		) &&
		Array.isArray(mandate.injuries?.gids) &&
		Array.isArray(mandate.injuries.players) &&
		[
			mandate.injuries.games,
			mandate.injuries.keyMissed,
			mandate.injuries.rotationMissed,
			mandate.injuries.playoffs,
			mandate.injuries.playoffMissed,
		].every(Number.isFinite),
	);
const firstsFor = async (tid: number, year: number) =>
	(await idb.cache.draftPicks.indexGetAll("draftPicksByTid", tid)).filter(
		(dp) =>
			dp.round === 1 &&
			typeof dp.season === "number" &&
			dp.season >= year &&
			dp.season < year + 3,
	).length;
const snapshot = async (tid: number, year: number) =>
	ownershipRoster(
		(await idb.cache.players.indexGetAll("playersByTid", tid)).map((p) =>
			playerInfo(p, year),
		),
		await firstsFor(tid, year),
		g.get("challengeNoRatings"),
	);
const costFor = async (tid: number) => {
	const payroll = await getPayroll(tid);
	return payroll + (await projectedTax(tid, payroll));
};

const issueOwnerMandate = async () => {
	if (!enabled()) {
		return undefined;
	}
	const t = await idb.cache.teams.get(g.get("userTid"));
	if (!t) {
		return undefined;
	}
	const year = salaryYear();
	if (valid(t.ownerMandate) && t.ownerMandate.season === year) {
		return t.ownerMandate;
	}
	const ts = await idb.cache.teamSeasons.indexGet("teamSeasonsByTidSeason", [
		t.tid,
		year,
	]);
	const roster = await snapshot(t.tid, year);
	const mandate = createOwnerMandate({
		season: year,
		priority: ownerExpectations(t).priority,
		rebuilding: t.strategy === "rebuilding",
		roster,
		salaryCap: g.get("salaryCap"),
		games: ts ? ts.won + ts.lost + ts.otl + ts.tied : 0,
		wins: ts?.won ?? 0,
		hidden: g.get("challengeNoRatings"),
		numGames: g.get("numGames"),
	});
	mandate.deferRosterAssessment =
		year === g.get("season") &&
		mandate.issuedGames > 0 &&
		g.get("phase") >= PHASE.AFTER_TRADE_DEADLINE &&
		g.get("phase") <= PHASE.PLAYOFFS;
	const previous = await idb.cache.teamSeasons.indexGet(
		"teamSeasonsByTidSeason",
		[t.tid, year - 1],
	);
	if (previous?.ownerReview) {
		mandate.opening += ` Last year's review: ${previous.ownerReview.verdict}. This is the next step in that story.`;
	}
	t.ownerMandate = mandate;
	await idb.cache.teams.put(t);
	if (!local.autoPlayUntil) {
		const targets = [
			`Win at least ${(mandate.targets.winPct * 100).toFixed(0)}% of games after this mandate.`,
			mandate.targets.talent === undefined
				? ""
				: `Best-eight rotation talent: at least ${mandate.targets.talent.toFixed(1)}.`,
			mandate.targets.maxAge === undefined
				? ""
				: `Rotation age: at most ${mandate.targets.maxAge.toFixed(1)}.`,
			mandate.targets.youngCore === undefined
				? ""
				: `At least ${mandate.targets.youngCore} young core candidates in the rotation.`,
			mandate.targets.firsts === undefined
				? ""
				: `Retain at least ${mandate.targets.firsts} first-round picks in the next three drafts.`,
			g.get("budget")
				? `Salaries + tax: at most ${helpers.formatCurrency(mandate.targets.maxCost / 1000, "M")}; profit: at least ${helpers.formatCurrency(mandate.targets.minProfit / 1000, "M")}.`
				: "",
		].filter(Boolean);
		await idb.cache.messages.add({
			read: false,
			from: "The Owner",
			year,
			tid: t.tid,
			subject:
				mandate.mode === "rebuild"
					? "The rebuild: our agreement"
					: "Our competitive window",
			text: `<p>${escape(mandate.opening)}</p>${mandate.deferRosterAssessment ? "<p>The trading window has already closed. New roster-building milestones are informational this season and will not be graded retroactively.</p>" : ""}<p>These targets are fixed for this mandate:</p><ul>${targets.map((text) => `<li>${escape(text)}</li>`).join("")}</ul><p>How I expect you to work:</p><ul>${mandate.instructions.map((text) => `<li>${escape(text)}</li>`).join("")}</ul><p>Review the targets and decision journal in <a href="/l/${g.get("lid")}/team_finances#ownership">Ownership</a>. Injuries will be recorded from now on; they do not excuse budget or trade-policy breaches.</p>${mandate.issuedGames ? `<p>This mandate begins after ${mandate.issuedGames} games. Earlier decisions will not be judged retroactively.</p>` : ""}`,
		});
	}
	return mandate;
};

const issuing = new Map<string, Promise<OwnerMandate | undefined>>();
export const ensureOwnerMandate = async () => {
	if (!enabled()) {
		return undefined;
	}
	const key = `${g.get("lid")}:${g.get("userTid")}:${salaryYear()}`;
	let pending = issuing.get(key);
	if (!pending) {
		pending = issueOwnerMandate();
		issuing.set(key, pending);
	}
	try {
		return await pending;
	} finally {
		if (issuing.get(key) === pending) {
			issuing.delete(key);
		}
	}
};

export const ownerTradeImpact = async (teams: TradeTeams) => {
	if (!enabled()) {
		return undefined;
	}
	const index = teams.findIndex((t) => t.tid === g.get("userTid"));
	if (index < 0) {
		return undefined;
	}
	const mine = teams[index]!,
		other = teams[index === 0 ? 1 : 0]!;
	if (
		mine.pids.length +
			mine.dpids.length +
			other.pids.length +
			other.dpids.length ===
		0
	) {
		return undefined;
	}
	const mandate = await ensureOwnerMandate();
	if (!mandate) {
		return undefined;
	}
	const raw = await idb.cache.players.indexGetAll("playersByTid", mine.tid);
	const incoming = (
		await Promise.all(other.pids.map((pid) => idb.cache.players.get(pid)))
	).filter((p) => p !== undefined);
	const sent = raw
		.filter((p) => mine.pids.includes(p.pid))
		.map((p) => playerInfo(p, mandate.season));
	const received = incoming.map((p) => playerInfo(p, mandate.season));
	const picks = await idb.cache.draftPicks.getAll();
	const relevant = picks.filter(
		(p) =>
			p.round === 1 &&
			typeof p.season === "number" &&
			p.season >= mandate.season &&
			p.season < mandate.season + 3,
	);
	const before = ownershipRoster(
		raw.map((p) => playerInfo(p, mandate.season)),
		relevant.filter((p) => p.tid === mine.tid).length,
		g.get("challengeNoRatings"),
	);
	const after = ownershipRoster(
		[
			...raw
				.filter((p) => !mine.pids.includes(p.pid))
				.map((p) => playerInfo(p, mandate.season)),
			...received,
		],
		before.firsts -
			relevant.filter((p) => mine.dpids.includes(p.dpid)).length +
			relevant.filter((p) => other.dpids.includes(p.dpid)).length,
		g.get("challengeNoRatings"),
	);
	const payroll = await getPayroll(mine.tid);
	const afterPayroll =
		payroll -
		raw
			.filter((p) => mine.pids.includes(p.pid))
			.reduce(
				(sum, p) => sum + getContractSalary(p.contract, mandate.season),
				0,
			) +
		incoming.reduce(
			(sum, p) => sum + getContractSalary(p.contract, mandate.season),
			0,
		);
	return {
		tid: mine.tid,
		partnerName:
			`${g.get("teamInfoCache")[other.tid]?.region ?? ""} ${g.get("teamInfoCache")[other.tid]?.name ?? "trading partner"}`.trim(),
		mandateSeason: mandate.season,
		mode: mandate.mode,
		sent: sent.map((p) => p.name),
		received: received.map((p) => p.name),
		...judgeOwnerTrade(
			mandate,
			before,
			after,
			sent,
			received,
			payroll + (await projectedTax(mine.tid, payroll)),
			afterPayroll + (await projectedTax(mine.tid, afterPayroll)),
			g.get("budget"),
		),
	};
};

export const recordOwnerTrade = async (
	eid: number,
	impact: Awaited<ReturnType<typeof ownerTradeImpact>>,
) => {
	if (!impact) {
		return;
	}
	const t = await idb.cache.teams.get(impact.tid);
	if (
		valid(t?.ownerMandate) &&
		t.ownerMandate.season === impact.mandateSeason &&
		!t.ownerMandate.decisions.some((d) => d.eid === eid)
	) {
		t.ownerMandate.decisions.push({
			partnerName: impact.partnerName,
			eid,
			season: g.get("season"),
			phase: g.get("phase"),
			sent: impact.sent,
			received: impact.received,
			concerns: impact.concerns,
			positives: impact.positives,
		});
		await idb.cache.teams.put(t);
	}
};
export const undoOwnerTrade = async (eid: number, tid = g.get("userTid")) => {
	const t = await idb.cache.teams.get(tid);
	if (valid(t?.ownerMandate)) {
		t.ownerMandate.decisions = t.ownerMandate.decisions.filter(
			(d) => d.eid !== eid,
		);
		await idb.cache.teams.put(t);
	}
};

export const recordOwnerGame = async (
	gid: number,
	tid: number,
	playoffs: boolean,
	gamePlayers: { id: number; stat: { gp: number } }[],
	players: Record<number, Player>,
) => {
	if (!enabled() || tid !== g.get("userTid")) {
		return;
	}
	const mandate = await ensureOwnerMandate();
	if (
		!mandate ||
		!Number.isFinite(gid) ||
		mandate.season !== g.get("season") ||
		mandate.injuries.gids.includes(gid)
	) {
		return;
	}
	const injury = mandate.injuries;
	injury.gids.push(gid);
	const keyPids = new Set(
		mandate.baseline.rotation.slice(0, 3).map((p) => p.pid),
	);
	const rotationPids = new Set(mandate.baseline.rotation.map((p) => p.pid));
	if (playoffs) {
		injury.playoffs += 1;
	} else {
		injury.games += 1;
	}
	for (const gp of gamePlayers) {
		const p = players[gp.id];
		if (
			!p ||
			p.tid !== tid ||
			p.injury.gamesRemaining <= 0 ||
			gp.stat.gp > 0 ||
			!rotationPids.has(p.pid)
		) {
			continue;
		}
		if (playoffs) {
			injury.playoffMissed += 1;
		} else {
			injury.rotationMissed += 1;
			if (keyPids.has(p.pid)) {
				injury.keyMissed += 1;
			}
		}
		let row = injury.players.find((row) => row.pid === p.pid);
		if (!row) {
			row = { pid: p.pid, name: `${p.firstName} ${p.lastName}`, games: 0 };
			injury.players.push(row);
		}
		row.games += 1;
	}
	const t = await idb.cache.teams.get(tid);
	if (t) {
		t.ownerMandate = mandate;
		await idb.cache.teams.put(t);
	}
};

export const assessOwner = async (
	final = false,
): Promise<OwnerReview | undefined> => {
	const mandate = await ensureOwnerMandate();
	if (!mandate) {
		return undefined;
	}
	const ts = await idb.cache.teamSeasons.indexGet("teamSeasonsByTidSeason", [
		g.get("userTid"),
		mandate.season,
	]);
	const cost =
		final && ts && ts.payrollEndOfSeason >= 0
			? Math.max(ts.expenses.salary, ts.payrollEndOfSeason) +
				ts.expenses.luxuryTax
			: await costFor(g.get("userTid"));
	const profit = ts
		? Object.values(ts.revenues).reduce((a, b) => a + b, 0) -
			Object.values(ts.expenses).reduce((a, b) => a + b, 0)
		: 0;
	return reviewOwnerMandate(
		mandate,
		await snapshot(g.get("userTid"), mandate.season),
		{
			games: ts ? ts.won + ts.lost + ts.otl + ts.tied : 0,
			wins: ts?.won ?? 0,
			playoffRounds: ts?.playoffRoundsWon ?? -1,
			cost,
			profit,
			budget: g.get("budget"),
		},
		final,
	);
};

export const getOwnershipBoard = async (tid: number) => {
	if (!enabled() || tid !== g.get("userTid")) {
		return undefined;
	}
	const current = await assessOwner();
	const rows = await idb.merged.teamSeasons.getAll({
		tid,
		seasons: [g.get("season") - 2, g.get("season")],
	});
	const latest = rows
		.map((ts) => ts.ownerReview)
		.filter((r): r is OwnerReview =>
			Boolean(Array.isArray(r?.objectives) && Array.isArray(r?.paragraphs)),
		)
		.at(-1);
	// Scouted attributes and hidden objective values never enter the UI payload.
	const sanitize = (review: OwnerReview | undefined) => {
		if (!review || !g.get("challengeNoRatings")) {
			return review;
		}
		const hidden = structuredClone(review);
		hidden.mandate.ratingsHidden = true;
		hidden.objectives = hidden.objectives.filter((o) => o.key !== "talent");
		delete hidden.roster.talent;
		delete hidden.mandate.baseline.talent;
		delete hidden.mandate.targets.talent;
		for (const p of [
			...hidden.roster.rotation,
			...hidden.mandate.baseline.rotation,
		]) {
			p.ovr = 0;
			p.pot = 0;
		}
		return hidden;
	};
	return {
		current: sanitize(current),
		latest: sanitize(latest),
		evaluationEnabled: !g.get("godMode"),
		gracePeriodEnd: g.get("gracePeriodEnd"),
		season: g.get("season"),
		budget: g.get("budget"),
	};
};

export const ownerReviewHtml = (review: OwnerReview) =>
	`<h3>${escape(review.verdict)}</h3>${review.paragraphs.map((p) => `<p>${escape(p)}</p>`).join("")}<ul>${review.mandate.decisions
		.filter((d) => d.concerns.length)
		.map(
			(d) =>
				`<li>Trade${d.partnerName ? ` with ${escape(d.partnerName)}` : ""}: ${d.concerns.map(escape).join(" ")}</li>`,
		)
		.join(
			"",
		)}</ul><p>Full targets and decision evidence: <a href="/l/${g.get("lid")}/team_finances#ownership">Ownership</a>.</p>`;
