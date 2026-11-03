import { expect, test } from "vitest";
import { getCoachReport, type CoachPlayer } from "./basketballCoach.ts";
import { ROLE_ATTRIBUTES, type RoleAttributes } from "./basketballPositions.ts";

const makePlayer = (
	pid: number,
	value: number,
	changes: Partial<RoleAttributes> = {},
): CoachPlayer => ({
	pid,
	rosterOrder: pid,
	injured: false,
	ratings: {
		...Object.fromEntries(ROLE_ATTRIBUTES.map((key) => [key, value])),
		...changes,
	} as RoleAttributes,
});
const baseline = () =>
	Array.from({ length: 4 }, (_, tid) => ({
		tid,
		players: Array.from({ length: 8 }, (_, i) => makePlayer(i, 50)),
	}));

test("compares actual league rotations and provides actionable, area-specific gaps", () => {
	const teams = baseline();
	teams[0]!.players = Array.from({ length: 8 }, (_, i) =>
		makePlayer(i, 50, { hgt: 10, reb: 10, tp: 95, oiq: 60 }),
	);
	const report = getCoachReport(teams, 0)!;
	expect(report.areas.find((a) => a.key === "size")).toMatchObject({
		rank: 4,
		level: "weakness",
		score: 10,
	});
	expect(report.areas.find((a) => a.key === "rebounding")).toMatchObject({
		rank: 4,
		level: "weakness",
	});
	expect(report.areas.find((a) => a.key === "shooting")).toMatchObject({
		rank: 1,
		level: "strength",
	});
	expect(report.areas.find((a) => a.key === "size")!.advice).toContain(
		"length",
	);
});
test("tied leagues and small leagues do not manufacture strengths or weaknesses", () => {
	const teams = baseline();
	expect(
		getCoachReport(teams, 0)!.areas.every(
			(a) => a.rank === 1 && a.level === "balanced",
		),
	).toBe(true);
	teams[0]!.players = [makePlayer(0, 90)];
	expect(
		getCoachReport(teams.slice(0, 2), 0)!.areas.every(
			(a) => a.level === "balanced",
		),
	).toBe(true);
	expect(getCoachReport([], 0)).toBeUndefined();
});
test("only the first eight in lineup order count; injuries describe availability without silently changing the baseline", () => {
	const teams = baseline();
	teams[0]!.players.push(makePlayer(99, 100));
	teams[0]!.players[0]!.injured = true;
	expect(getCoachReport(teams, 0)).toMatchObject({
		rotationSize: 8,
		injuredRotation: 1,
	});
	expect(getCoachReport(teams, 0)!.areas.every((a) => a.score === 50)).toBe(
		true,
	);
	teams[0]!.players.at(-1)!.rosterOrder = -1;
	expect(getCoachReport(teams, 0)!.areas.every((a) => a.score > 50)).toBe(true);
});
test("uses simulation-aligned positive rebounding weights and reports shared ranks", () => {
	const teams = baseline();
	teams[0]!.players = [makePlayer(0, 0, { hgt: 100, reb: 100 })];
	teams[1]!.players = [makePlayer(0, 0, { hgt: 100, reb: 100 })];
	const rebounding = getCoachReport(teams, 0)!.areas.find(
		(a) => a.key === "rebounding",
	)!;
	expect(rebounding.score).toBe(Math.round(400 / 5.2));
	expect(rebounding.rank).toBe(1);
	expect(rebounding.level).toBe("balanced");
});
