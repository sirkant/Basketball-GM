import { describe, expect, test } from "vitest";
import {
	assignCourtSlots,
	COURT_POSITIONS,
	getListedPositions,
	getPositionProfiles,
	replaceStarter,
	ROLE_ATTRIBUTES,
	type RoleAttributes,
} from "./basketballPositions.ts";

const ratings = (changes: Partial<RoleAttributes> = {}) =>
	({
		...Object.fromEntries(ROLE_ATTRIBUTES.map((key) => [key, 50])),
		...changes,
	}) as RoleAttributes;
describe("basketball positional scouting", () => {
	test("small-ball centers can compensate for height while slow creators need perimeter mobility", () => {
		const smallBall = getPositionProfiles(
			ratings({
				hgt: 50,
				stre: 80,
				spd: 60,
				reb: 80,
				diq: 90,
				jmp: 70,
				ins: 60,
			}),
			"PF",
		);
		expect(smallBall.find((p) => p.position === "C")?.fit).toBe("comfortable");
		const slowCreator = getPositionProfiles(
			ratings({ hgt: 90, drb: 90, pss: 90, spd: 20 }),
			"C",
		);
		expect(slowCreator.find((p) => p.position === "PG")?.fit).toBe("emergency");
		expect(
			getPositionProfiles(ratings(), "PG").find((p) => p.position === "SF")
				?.fit,
		).toBe("situational");
	});
	test("hybrid positions cover adjacent basketball roles", () => {
		expect(getListedPositions("GF")).toEqual(["SG", "SF"]);
		expect(getListedPositions("FC")).toEqual(["PF", "C"]);
		expect(getListedPositions("unknown")).toEqual([]);
	});
	test("a small creator and a slow center have different secondary roles", () => {
		const guard = getPositionProfiles(
			ratings({ hgt: 20, drb: 90, pss: 90, spd: 80, reb: 20 }),
			"PG",
		);
		const center = getPositionProfiles(
			ratings({
				hgt: 90,
				stre: 85,
				reb: 90,
				diq: 80,
				spd: 20,
				drb: 20,
				pss: 25,
			}),
			"C",
		);
		expect(guard.find((p) => p.position === "C")?.fit).toBe("emergency");
		expect(guard[0]?.strengths).toContain("Ball handling");
		expect(center[0]?.fit).toBe("emergency");
		expect(center[4]?.fit).toBe("listed");
		expect(center[4]?.score).toBeGreaterThan(center[0]!.score);
	});
	test("a mobile wing can cover more than its listed position", () => {
		const fits = getPositionProfiles(
			ratings({
				hgt: 60,
				spd: 75,
				drb: 65,
				pss: 60,
				tp: 75,
				diq: 70,
				stre: 60,
			}),
			"SF",
		);
		expect(fits.find((p) => p.position === "SG")?.fit).toBe("comfortable");
		expect(fits.find((p) => p.position === "SF")?.fit).toBe("listed");
	});
	test("projections are finite and bounded for imported ratings", () => {
		for (const p of getPositionProfiles(
			ratings({ drb: Number.NaN, hgt: Infinity, pss: -20, spd: 150 }),
			"G",
		)) {
			expect(p.score).toBeGreaterThanOrEqual(0);
			expect(p.score).toBeLessThanOrEqual(100);
		}
	});
	test("court assignments use each starter once and respect known roles without ratings", () => {
		const players = COURT_POSITIONS.map((pos, pid) => ({
			pid,
			ratings: { pos },
		}));
		const result = assignCourtSlots(players);
		expect(COURT_POSITIONS.map((pos) => result[pos]?.ratings.pos)).toEqual(
			COURT_POSITIONS,
		);
		expect(new Set(Object.values(result).map((p) => p.pid)).size).toBe(5);
	});
	test("short rosters and unknown positions leave honest vacancies", () => {
		const result = assignCourtSlots([{ pid: 1, ratings: { pos: "C" } }]);
		expect(Object.keys(result)).toHaveLength(1);
		expect(result.C?.pid).toBe(1);
		expect(assignCourtSlots([])).toEqual({});
	});
	test("duplicate starters cannot occupy multiple court slots", () => {
		expect(() =>
			assignCourtSlots([
				{ pid: 1, ratings: { pos: "PG" } },
				{ pid: 1, ratings: { pos: "C" } },
			]),
		).toThrow();
	});
	test("court projection finds the best overall assignment rather than greedily taking a role", () => {
		const players = ["GF", "G", "SF", "PF", "C"].map((pos, pid) => ({
			pid,
			ratings: { pos },
		}));
		const scores = [
			[90, 89, 0, 0, 0],
			[88, 60, 0, 0, 0],
			[0, 0, 99, 0, 0],
			[0, 0, 0, 99, 0],
			[0, 0, 0, 0, 99],
		];
		const profiles = Object.fromEntries(
			players.map((p) => [
				p.pid,
				COURT_POSITIONS.map((position, i) => ({
					position,
					score: scores[p.pid]![i]!,
					fit: "comfortable" as const,
					strengths: [],
					limitations: [],
				})),
			]),
		);
		const result = assignCourtSlots(players, profiles);
		expect(result.PG?.pid).toBe(1);
		expect(result.SG?.pid).toBe(0);
		expect(Object.values(result)).toHaveLength(5);
	});
	test("starter replacement preserves all assets and the original order elsewhere", () => {
		const original = Object.freeze([1, 2, 3, 4, 5, 6, 7]);
		expect(replaceStarter(original, 2, 7, 5)).toEqual([1, 7, 3, 4, 5, 6, 2]);
		expect(original).toEqual([1, 2, 3, 4, 5, 6, 7]);
		expect(() => replaceStarter(original, 2, 3, 5)).toThrow();
		expect(() => replaceStarter(original, 9, 7, 5)).toThrow();
	});
});
