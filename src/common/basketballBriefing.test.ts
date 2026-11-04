import { expect, test } from "vitest";
import {
	buildPlayoffBriefing,
	buildRosterBriefing,
	isBlockingMessage,
	type BriefingTeam,
} from "./basketballBriefing.ts";
const team = (overrides: Partial<BriefingTeam> = {}): BriefingTeam => ({
	tid: 0,
	name: "Home",
	powerRank: 4,
	ovr: 70,
	availableOvr: 68,
	ranks: { tp: 10, reb: 26, diq: 10, pss: 10, ins: 10 },
	healthyRanks: { tp: 10, reb: 12, diq: 10, pss: 10, ins: 10 },
	gp: 20,
	mov: 3.5,
	tpa: 32,
	tpp: 37,
	injuries: 1,
	...overrides,
});
test("coach requests cite the actual weakest Power Rankings grade and distinguish injury cover", () => {
	const brief = buildRosterBriefing(team(), 30);
	expect(brief.request).toMatchObject({
		area: "reb",
		baselineRank: 26,
		targetRank: 15,
	});
	expect(brief.paragraphs.join(" ")).toContain("Temporary cover");
	expect(
		buildRosterBriefing(
			team({ ranks: { tp: 1, reb: 1, diq: 1, pss: 1, ins: 1 } }),
			30,
		).request,
	).toBeUndefined();
});
test("follow-ups retain a selected priority and acknowledge progress rather than inventing a completed trade", () => {
	const previous = {
		...buildRosterBriefing(team(), 30).request!,
		decision: "prioritize" as const,
	};
	const progress = buildRosterBriefing(
		team({ ranks: { tp: 10, reb: 18, diq: 10, pss: 10, ins: 10 } }),
		30,
		previous,
	);
	expect(progress.request).toMatchObject({
		area: "reb",
		baselineRank: 26,
		reviewedRank: 18,
		decision: "prioritize",
	});
	const declined = buildRosterBriefing(team(), 30, {
		...previous,
		decision: "decline",
		supersededBy: "roster:2026:0:1:2",
	});
	expect(declined.request?.decision).toBe("decline");
	expect(declined.request?.supersededBy).toBeUndefined();
	const resolved = buildRosterBriefing(
		team({ ranks: { tp: 10, reb: 8, diq: 10, pss: 10, ins: 10 } }),
		30,
		previous,
	);
	expect(resolved.request).toBeUndefined();
	expect(resolved.paragraphs.join(" ")).toContain("meets that target");
});
test("a weaker opponent can still be a shooting threat; balanced does not mean uniformly poor", () => {
	const opponent = team({
		tid: 1,
		name: "Golden State",
		powerRank: 8,
		availableOvr: 60,
		ranks: { tp: 2, reb: 8, diq: 9, pss: 8, ins: 8 },
		injuries: 0,
	});
	const preview = buildPlayoffBriefing(team(), opponent, 30, {
		number: 3,
		home: true,
		series: "1–1",
		stage: "Playoffs",
	});
	expect(preview.paragraphs.join(" ")).toContain("players rate stronger");
	expect(preview.paragraphs.join(" ")).toContain(
		"three-point shooting is a real scouting threat: #2",
	);
	expect(preview.paragraphs.join(" ")).toContain("well-balanced");
	expect(
		buildPlayoffBriefing(
			team(),
			team({ ranks: { tp: 29, reb: 29, diq: 29, pss: 29, ins: 29 } }),
			30,
			{ number: 1, home: false, stage: "Finals" },
		).paragraphs.join(" "),
	).not.toContain("well-balanced");
});
test("advisory coach messages never replace mandatory owner correspondence", () => {
	expect(isBlockingMessage({ read: false, advisory: true })).toBe(false);
	expect(isBlockingMessage({ read: false })).toBe(true);
	expect(isBlockingMessage({ read: true })).toBe(false);
});
