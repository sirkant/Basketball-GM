import { describe, expect, test } from "vitest";
import {
	createOwnerMandate,
	judgeOwnerTrade,
	ownershipRoster,
	reviewOwnerMandate,
	type OwnershipPlayer,
} from "./ownership.ts";

const players = (age = 28, ovr = 55): OwnershipPlayer[] =>
	Array.from({ length: 8 }, (_, pid) => ({
		pid,
		name: `Player ${pid}`,
		age,
		ovr,
		pot: 60,
		order: pid,
	}));
const mandate = (rebuilding = true, hidden = false) =>
	createOwnerMandate({
		season: 2026,
		priority: "balanced",
		rebuilding,
		roster: ownershipRoster(players(), 3, hidden),
		salaryCap: 150000,
		games: 0,
		wins: 0,
		hidden,
	});
const results = {
	games: 82,
	wins: 30,
	playoffRounds: -1,
	cost: 150000,
	profit: 20000,
	budget: true,
};

describe("ownership mandates", () => {
	test("adopting a mandate after the trading window does not punish unavailable roster changes", () => {
		const m = mandate();
		m.issuedGames = 60;
		m.issuedWins = 20;
		m.deferRosterAssessment = true;
		const r = reviewOwnerMandate(m, m.baseline, results, true);
		expect(r.strategyDelta).toBe(0);
		expect(r.objectives.find((o) => o.key === "age")?.status).toBe(
			"unassessed",
		);
		expect(r.paragraphs.join(" ")).toContain(
			"trading window was already closed",
		);
	});
	test("cutting weak players does not inflate a short rotation's talent score", () => {
		const full = ownershipRoster(players(), 3, false);
		const short = ownershipRoster(players().slice(0, 5), 3, false);
		expect(short.talent).toBeLessThan(full.talent!);
	});
	test("short custom seasons have a reachable sample threshold", () => {
		const m = createOwnerMandate({
			season: 2026,
			priority: "balanced",
			rebuilding: false,
			roster: ownershipRoster(players(), 3, false),
			salaryCap: 150000,
			games: 0,
			wins: 0,
			hidden: false,
			numGames: 6,
		});
		const r = reviewOwnerMandate(
			m,
			m.baseline,
			{ ...results, games: 6, wins: 6 },
			true,
		);
		expect(r.objectives.find((o) => o.key === "wins")?.status).toBe("met");
	});
	test("rebuilding fixes concrete age, talent, core and pick milestones up front", () => {
		const m = mandate();
		expect(m.targets.talent).toBe(58);
		expect(m.targets.maxAge).toBe(27);
		expect(m.targets.youngCore).toBe(2);
		expect(m.targets.firsts).toBe(3);
		expect(m.targets.winPct).toBe(0.35);
		expect(m.targets.playoffRounds).toBe(-1);
	});
	test("young bench filler cannot change the best-eight metrics", () => {
		const before = ownershipRoster(players(), 3, false);
		const after = ownershipRoster(
			[
				...players(),
				...players(18, 5).map((p) => ({
					...p,
					pid: p.pid + 10,
					order: p.order + 10,
				})),
			],
			3,
			false,
		);
		expect(after.talent).toBe(before.talent);
		expect(after.age).toBe(before.age);
		expect(after.youngCore).toBe(before.youngCore);
	});
	test("a rebuild can make progress without pretending it was a playoff campaign", () => {
		const m = mandate();
		const good = reviewOwnerMandate(
			m,
			ownershipRoster(players(24, 60), 3, false),
			results,
			true,
		);
		const bad = reviewOwnerMandate(m, m.baseline, results, true);
		expect(good.strategyDelta).toBeGreaterThan(0);
		expect(bad.strategyDelta).toBeLessThan(0);
		expect(good.objectives.some((o) => o.key === "playoffs")).toBe(false);
		expect(good.paragraphs[0]).toContain("rebuilding mandate");
	});
	test("routine contender maintenance earns no free execution bonus", () => {
		const m = mandate(false);
		expect(reviewOwnerMandate(m, m.baseline, results, true).strategyDelta).toBe(
			0,
		);
	});
	test("injury context is bounded and changes only the win-rate assessment", () => {
		const m = mandate(false);
		const before = reviewOwnerMandate(
			m,
			m.baseline,
			{ ...results, wins: 10, cost: 550000 },
			true,
		);
		m.injuries.games = 82;
		m.injuries.keyMissed = 246;
		const after = reviewOwnerMandate(
			m,
			m.baseline,
			{ ...results, wins: 10, cost: 550000 },
			true,
		);
		expect(after.injuryCredit).toBe(0.08);
		expect(after.winsDelta).toBeGreaterThan(before.winsDelta);
		expect(after.objectives.find((o) => o.key === "cost")?.status).toBe(
			"missed",
		);
		expect(after.strategyDelta).toBe(before.strategyDelta);
		expect(after.paragraphs.join(" ")).toContain("not proof");
	});
	test("no new win-rate judgment from a small late-import sample", () => {
		const m = mandate();
		m.issuedGames = 75;
		m.issuedWins = 20;
		const r = reviewOwnerMandate(m, m.baseline, { ...results, wins: 21 }, true);
		expect(r.winsDelta).toBe(0);
		expect(r.strategyDelta).toBe(0);
		expect(r.objectives.find((o) => o.key === "wins")?.status).toBe(
			"unassessed",
		);
		expect(r.paragraphs.join(" ")).toContain("not retroactively");
	});
	test("spending first-round capital on old win-now talent conflicts with a rebuild", () => {
		const m = mandate();
		const veteran = { ...players(32, 70)[0]!, pid: 90 };
		const after = { ...m.baseline, firsts: 2 };
		const opinion = judgeOwnerTrade(
			m,
			m.baseline,
			after,
			[],
			[veteran],
			150000,
			160000,
		);
		expect(opinion.concerns.join(" ")).toContain("veteran");
		m.decisions.push({
			eid: 1,
			season: 2026,
			phase: 1,
			sent: [],
			received: [veteran.name],
			...opinion,
		});
		expect(
			reviewOwnerMandate(m, m.baseline, results, true).strategyDelta,
		).toBeLessThan(
			reviewOwnerMandate({ ...m, decisions: [] }, m.baseline, results, true)
				.strategyDelta,
		);
	});
	test("a documented young-core instruction accepts young talent or net first-round gain", () => {
		const m = mandate();
		m.baseline = ownershipRoster(players(23, 65), 3, false);
		const out = m.baseline.rotation[0]!;
		const veteran = { ...players(32, 65)[0]!, pid: 99 };
		expect(
			judgeOwnerTrade(
				m,
				m.baseline,
				m.baseline,
				[out],
				[veteran],
				100000,
				100000,
			).concerns.join(" "),
		).toContain("without comparable young talent");
		expect(
			judgeOwnerTrade(
				m,
				m.baseline,
				{ ...m.baseline, firsts: 4 },
				[out],
				[veteran],
				100000,
				100000,
			).concerns,
		).toHaveLength(0);
		expect(
			judgeOwnerTrade(
				m,
				m.baseline,
				m.baseline,
				[out],
				[{ ...out, pid: 98 }],
				100000,
				100000,
			).concerns,
		).toHaveLength(0);
	});
	test("budget compliance can justify contender talent loss, but disabled budgets never create financial conflicts", () => {
		const m = mandate(false);
		const after = { ...m.baseline, talent: m.baseline.talent! - 4 };
		expect(
			judgeOwnerTrade(m, m.baseline, after, [], [], 300000, 150000).concerns,
		).toHaveLength(0);
		expect(
			judgeOwnerTrade(m, m.baseline, after, [], [], 300000, 270000).concerns,
		).toHaveLength(0);
		expect(
			judgeOwnerTrade(m, m.baseline, after, [], [], 300000, 299999).concerns,
		).toHaveLength(1);
		expect(
			judgeOwnerTrade(m, m.baseline, after, [], [], 150000, 150000).concerns,
		).toHaveLength(1);
		expect(
			judgeOwnerTrade(m, m.baseline, m.baseline, [], [], 100000, 500000, false)
				.concerns,
		).toHaveLength(0);
	});
	test("hidden-rating mandates use known rotation and age rather than talent thresholds", () => {
		const m = mandate(true, true);
		expect(m.targets.talent).toBeUndefined();
		expect(m.baseline.talent).toBeUndefined();
		expect(
			reviewOwnerMandate(m, m.baseline, results, true).objectives.some(
				(o) => o.key === "talent",
			),
		).toBe(false);
	});
});
