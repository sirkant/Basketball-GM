import { expect, test } from "vitest";
import { getClubhouseLinks } from "./clubhouseNavigation.ts";
import type { MenuItemLink } from "../../common/types.ts";

test("keeps distinct destinations and actions while deduplicating the same destination", () => {
	const first: MenuItemLink = {
		type: "link",
		league: true,
		path: ["player_stats"],
		text: "Stats",
	};
	const action: MenuItemLink = {
		type: "link",
		league: true,
		text: "Screenshot",
		onClick: () => {},
	};
	const links = getClubhouseLinks(
		[
			first,
			{
				type: "header",
				long: "Statistics",
				short: "S",
				league: true,
				children: [
					{ ...first },
					{ ...first, path: ["player_stats", "career"] },
					action,
					{ ...action, text: "Auto play" },
				],
			},
		],
		false,
	);
	expect(links).toHaveLength(4);
	expect(links[0]).toBe(first);
	expect(links).toContain(action);
});
test("retains God Mode gating and excludes out-of-league and command-only items", () => {
	const hidden: MenuItemLink = {
		type: "link",
		league: true,
		godMode: true,
		path: ["edit"],
		text: "Edit",
	};
	const links: MenuItemLink[] = [
		hidden,
		{ type: "link", nonLeague: true, text: "Other" },
		{ type: "link", league: true, commandPaletteOnly: true, text: "Command" },
	];
	expect(getClubhouseLinks(links, false)).toEqual([]);
	expect(getClubhouseLinks(links, true)).toEqual([hidden]);
});
