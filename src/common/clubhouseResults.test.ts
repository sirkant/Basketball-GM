import { expect, test } from "vitest";
import { getClubhouseResults } from "./clubhouseResults.ts";

test("shows the club's latest opponent, result and scoring leader in either venue", () => {
	const games = [
		{
			gid: 20,
			overtimes: 1,
			teams: [
				{ tid: 4, pts: 104, players: [] },
				{
					tid: 7,
					pts: 112,
					players: [
						{ pid: 1, name: "A. Young", pts: 12 },
						{ pid: 2, name: "J. Cole", pts: 32 },
					],
				},
			] as const,
		},
		{
			gid: 19,
			overtimes: 0,
			teams: [
				{ tid: 7, pts: 96, players: [] },
				{ tid: 5, pts: 100, players: [] },
			] as const,
		},
	];
	expect(getClubhouseResults(games, 7)).toEqual([
		{
			gid: 20,
			opponentTid: 4,
			home: false,
			points: 112,
			opponentPoints: 104,
			outcome: "W",
			overtimes: 1,
			leader: { pid: 2, name: "J. Cole", pts: 32 },
		},
		{
			gid: 19,
			opponentTid: 5,
			home: true,
			points: 96,
			opponentPoints: 100,
			outcome: "L",
			overtimes: 0,
			leader: undefined,
		},
	]);
});

test("keeps five valid results and handles ties and missing legacy player details", () => {
	const result = {
		overtimes: 0,
		teams: [
			{ tid: 2, pts: 105, players: [{ pts: 18 }] },
			{ tid: 1, pts: 105, players: [] },
		] as const,
	};
	const games = Array.from({ length: 7 }, (_, index) => ({
		...result,
		gid: 20 - index,
	}));
	expect(
		getClubhouseResults(games, 2).map(({ gid, outcome, leader }) => [
			gid,
			outcome,
			leader,
		]),
	).toEqual([
		[20, "T", undefined],
		[19, "T", undefined],
		[18, "T", undefined],
		[17, "T", undefined],
		[16, "T", undefined],
	]);
	expect(getClubhouseResults(games, 3)).toEqual([]);
});
