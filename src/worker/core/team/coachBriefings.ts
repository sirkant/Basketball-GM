import { PHASE } from "../../../common/constants.ts";
import {
	buildPlayoffBriefing,
	buildRosterBriefing,
	type BriefingTeam,
	type CoachMemo,
} from "../../../common/basketballBriefing.ts";
import { getNumericStat } from "../../../common/statValue.ts";
import type { Message } from "../../../common/types.ts";
import { idb } from "../../db/index.ts";
import { g, helpers } from "../../util/index.ts";

const escape = (text: string) =>
	text
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;");
const hash = (text: string) => {
	let result = 2166136261;
	for (const char of text) {
		result = Math.imul(result ^ char.charCodeAt(0), 16777619);
	}
	return (result >>> 0).toString(36);
};
export const visibleCoachMessage = <
	T extends { text: string; subject?: string; coach?: CoachMemo },
>(
	message: T,
): T =>
	message.coach && g.get("challengeNoRatings")
		? {
				...message,
				subject: "Coach briefing · ratings hidden",
				text: "<p>Scouting briefs are unavailable while live ratings are hidden.</p>",
				coach: undefined,
			}
		: message;

const snapshots = async () => {
	const { team } = await import("../index.ts");
	const { addPowerRankingsStuffToTeams } = await import("./powerRankings.ts");
	const teams = await team.getFormattedAll({
		attrs: ["tid", "playThroughInjuries"],
		seasonAttrs: ["lastTen", "region", "name"],
		stats: ["gp", "mov", "pts", "oppPts", "tpa", "tpp"],
		season: g.get("season"),
		showNoStats: true,
		active: true,
	});
	const rankings = await addPowerRankingsStuffToTeams(
		teams,
		g.get("season"),
		g.get("phase") === PHASE.PLAYOFFS ? "playoffs" : "regularSeason",
	);
	const players = await idb.cache.players.indexGetAll("playersByTid", [
		0,
		Infinity,
	]);
	const teamsByTid = new Map<number, BriefingTeam>(
		rankings.map((t) => [
			t.tid,
			{
				tid: t.tid,
				name: `${t.seasonAttrs.region} ${t.seasonAttrs.name}`,
				powerRank: t.powerRankings.rank,
				ovr: t.powerRankings.ovr,
				availableOvr: t.powerRankings.ovrCurrent,
				ranks: t.powerRankings.otherCurrent,
				healthyRanks: t.powerRankings.other,
				gp: getNumericStat(t.stats.gp) ?? 0,
				mov: getNumericStat(t.stats.mov) ?? 0,
				tpa: getNumericStat(t.stats.tpa) ?? 0,
				tpp: getNumericStat(t.stats.tpp) ?? 0,
				injuries: players.filter(
					(p) => p.tid === t.tid && p.injury.gamesRemaining > 0,
				).length,
			},
		]),
	);
	return { teamsByTid, size: rankings.length, players };
};

let inFlight: Promise<number | undefined> | undefined;
export const ensureCoachBriefings = (
	options: { manual?: boolean; playoffOnly?: boolean } = {},
): Promise<number | undefined> => {
	if (inFlight) {
		return inFlight;
	}
	inFlight = generate(options).finally(() => {
		inFlight = undefined;
	});
	return inFlight;
};

const generate = async ({
	manual = false,
	playoffOnly = false,
}: {
	manual?: boolean;
	playoffOnly?: boolean;
}) => {
	if (
		__SPORT !== "basketball" ||
		g.get("challengeNoRatings") ||
		g.get("spectator") ||
		g.get("gameOver") ||
		g.get("userTid") < 0 ||
		g.get("phase") < 0
	) {
		return;
	}
	const tid = g.get("userTid"),
		year = g.get("season");
	const messages = (await idb.merged.messages.getAll()).filter(
		(m) => m.tid === tid && m.year === year,
	);
	const ts = await idb.cache.teamSeasons.indexGet("teamSeasonsBySeasonTid", [
		year,
		tid,
	]);
	if (!ts) {
		return;
	}
	const gamesPlayed = ts.won + ts.lost + ts.tied + ts.otl;
	let key = `roster:${year}:${tid}:${g.get("phase")}:${Math.floor(gamesPlayed / 10)}`;
	let playoffGame;
	if (g.get("phase") === PHASE.PLAYOFFS) {
		playoffGame = (await idb.cache.schedule.getAll())
			.filter((game) => game.homeTid === tid || game.awayTid === tid)
			.sort((a, b) => a.day - b.day || a.gid - b.gid)[0];
		if (!playoffGame) {
			return;
		}
		key = `playoff:${year}:${tid}:${playoffGame.gid}`;
	} else if (playoffOnly) {
		return;
	}
	const existing = messages.find((m) => m.coach?.key === key);
	if (existing && !manual) {
		return existing.mid;
	}
	const { teamsByTid, size, players } = await snapshots();
	const ours = teamsByTid.get(tid);
	if (!ours) {
		return;
	}
	const opponentTid = playoffGame
		? playoffGame.homeTid === tid
			? playoffGame.awayTid
			: playoffGame.homeTid
		: undefined;
	const opponent =
		opponentTid !== undefined ? teamsByTid.get(opponentTid) : undefined;
	const fingerprint = hash(
		JSON.stringify({
			ours,
			opponent,
			players: players
				.filter((p) => p.tid === tid)
				.map((p) => p.pid)
				.sort((a, b) => a - b),
		}),
	);
	const duplicate = messages.findLast(
		(m) => m.coach?.key.startsWith(key) && m.coach.fingerprint === fingerprint,
	);
	if (duplicate) {
		return duplicate.mid;
	}
	if (existing) {
		key += `:update:${fingerprint}`;
	}
	let previousRoster: Message | undefined;
	let subject: string, paragraphs: string[], memo: CoachMemo;
	if (playoffGame && opponent) {
		const playoffs = await idb.cache.playoffSeries.get(year);
		const round = playoffs?.currentRound ?? 0;
		const series = playoffs?.series[round]?.find(
			(s) =>
				s.away &&
				[s.home.tid, s.away.tid].includes(tid) &&
				[s.home.tid, s.away.tid].includes(opponent.tid),
		);
		const oursWon = series
			? series.home.tid === tid
				? series.home.won
				: series.away!.won
			: undefined;
		const theirsWon = series
			? series.home.tid === tid
				? series.away!.won
				: series.home.won
			: undefined;
		const result = buildPlayoffBriefing(ours, opponent, size, {
			number: series ? series.home.won + series.away!.won + 1 : 1,
			home: playoffGame.homeTid === tid,
			series: oursWon !== undefined ? `${oursWon}–${theirsWon}` : undefined,
			stage:
				round < 0
					? "Play-in"
					: round === g.get("numGamesPlayoffSeries", "current").length - 1
						? "Finals"
						: `Playoffs round ${round + 1}`,
		});
		subject = result.subject;
		paragraphs = result.paragraphs;
		memo = {
			kind: "playoff",
			key,
			gamesPlayed,
			fingerprint,
			opponentTid: opponent.tid,
			gid: playoffGame.gid,
		};
	} else {
		const prior = messages.findLast(
			(m) => m.coach?.kind === "roster" && m.coach.request,
		);
		const priorRequest = prior?.coach?.request;
		previousRoster = prior;
		const result = buildRosterBriefing(ours, size, priorRequest);
		if (priorRequest && prior) {
			priorRequest.reviewedRank = ours.ranks[priorRequest.area];
			priorRequest.resolved =
				priorRequest.reviewedRank! <= priorRequest.targetRank;
			await idb.cache.messages.put(prior);
		}
		subject = result.subject;
		paragraphs = result.paragraphs;
		memo = {
			kind: "roster",
			key,
			gamesPlayed,
			fingerprint,
			request: result.request,
		};
	}
	const links = `<p><a href="${helpers.leagueUrl(["power_rankings"])}#current">Power Rankings (current roster)</a> · <a href="${helpers.leagueUrl(["roster"])}">Court &amp; Depth</a> · <a href="${helpers.leagueUrl(memo.kind === "playoff" ? ["playoffs"] : ["free_agents"])}">${memo.kind === "playoff" ? "Playoff bracket" : "Scout free agents"}</a></p>`;
	const mid = await idb.cache.messages.add({
		from: "Head coach",
		year,
		tid,
		read: false,
		advisory: true,
		subject,
		text: paragraphs.map((p) => `<p>${escape(p)}</p>`).join("") + links,
		coach: memo,
	});
	if (previousRoster?.coach?.request) {
		previousRoster.coach.request.supersededBy = memo.key;
		await idb.cache.messages.put(previousRoster);
	}
	return mid;
};

export const respondCoachRequest = async ({
	mid,
	decision,
}: {
	mid: number;
	decision: "prioritize" | "decline";
}) => {
	if (decision !== "prioritize" && decision !== "decline") {
		throw new Error("Unknown coach response.");
	}
	const message = await idb.merged.messages.get(mid);
	if (
		!message?.coach?.request ||
		message.coach.request.supersededBy !== undefined ||
		message.coach.request.resolved ||
		message.tid !== g.get("userTid") ||
		message.year !== g.get("season") ||
		g.get("spectator") ||
		g.get("challengeNoRatings")
	) {
		throw new Error(
			"This coach request is not available for your current team.",
		);
	}
	message.coach.request.decision = decision;
	await idb.cache.messages.put(message);
	await idb.cache.flush();
	return decision;
};
