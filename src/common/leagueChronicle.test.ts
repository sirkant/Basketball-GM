import { expect, test } from "vitest";
import { getChapterContext } from "./leagueChronicle.ts";

test("recognizes consecutive titles without depending on sorting or franchise names", () => {
	const chapters = [2024, 2026, 2025].map((season) => ({
		season,
		champ: { tid: 7 },
	}));
	expect(getChapterContext(chapters, 2026)).toMatchObject({
		type: "repeat",
		streak: 3,
	});
	expect(getChapterContext(chapters, 2025)).toMatchObject({
		title: "Back to back",
		streak: 2,
	});
});
test("missing seasons or results break streaks and do not imply droughts", () => {
	const chapters = [
		{ season: 2024, champ: { tid: 7 } },
		{ season: 2026, champ: { tid: 7 } },
	];
	expect(getChapterContext(chapters, 2026)).toMatchObject({
		type: "recorded",
		streak: 1,
	});
	expect(getChapterContext(chapters, 2025)).toMatchObject({
		type: "incomplete",
		streak: 0,
	});
	expect(
		getChapterContext(
			[...chapters, { season: 2025, champ: { tid: 7, missing: true } }],
			2026,
		),
	).toMatchObject({ type: "recorded", streak: 1 });
});
test("describes a Finals reversal only when both archived matchups establish it", () => {
	const chapters = [
		{ season: 2025, champ: { tid: 1 }, runnerUp: { tid: 2 } },
		{ season: 2026, champ: { tid: 2 }, runnerUp: { tid: 1 } },
	];
	expect(getChapterContext(chapters, 2026).type).toBe("reversal");
	expect(
		getChapterContext(
			[{ ...chapters[0]!, runnerUp: undefined }, chapters[1]!],
			2026,
		).type,
	).toBe("change");
	expect(
		getChapterContext(
			[{ ...chapters[0]!, runnerUp: { tid: 2, missing: true } }, chapters[1]!],
			2026,
		).type,
	).toBe("change");
});
test("deleted team metadata does not support claims about repeat titles", () => {
	expect(
		getChapterContext(
			[{ season: 2026, champ: { tid: 1, missing: true } }],
			2026,
		),
	).toMatchObject({ type: "recorded", title: "A championship on record" });
});
