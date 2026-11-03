import type {
	MenuItemHeader,
	MenuItemLink,
	MenuItemText,
} from "../../common/types.ts";

export const clubhouseGroups = [
	{
		name: "Squad & coaching",
		icon: "users",
		keys: ["roster", "injuries", "game_log"],
	},
	{
		name: "Transfers & contracts",
		icon: "arrow-left-right",
		keys: [
			"trade",
			"free_agents",
			"upcoming_free_agents",
			"negotiation",
			"trading_block",
			"trade_proposals",
			"saved_trades",
			"transactions",
		],
	},
	{
		name: "Scouting & draft",
		icon: "scan-search",
		keys: [
			"draft_scouting",
			"draft",
			"draft_history",
			"draft_lottery",
			"draft_picks",
			"draft_team_history",
			"watch_list",
			"compare_players",
			"advanced_player_search",
			"player_ratings",
			"player_rating_dists",
			"player_bios",
		],
	},
	{
		name: "Finances & ownership",
		icon: "landmark",
		keys: ["team_finances", "league_finances"],
	},
	{
		name: "Competition",
		icon: "trophy",
		keys: [
			"standings",
			"playoffs",
			"daily_schedule",
			"power_rankings",
			"season_preview",
			"head2head",
			"head2head_all",
		],
	},
	{
		name: "Statistics",
		icon: "chart-no-axes-combined",
		keys: [
			"leaders",
			"leaders_progressive",
			"leaders_years",
			"player_stats",
			"player_stat_dists",
			"player_graphs",
			"team_stats",
			"team_stat_dists",
			"team_graphs",
			"league_stats",
			"award_races",
			"player_feats",
		],
	},
	{
		name: "History & records",
		icon: "book-open",
		keys: [
			"history_all",
			"team_history",
			"gm_history",
			"team_records",
			"awards_records",
			"all_star",
			"hall_of_fame",
			"notes",
		],
	},
];

export const menuPathKey = (item: MenuItemLink) =>
	Array.isArray(item.path) ? String(item.path[0] ?? "") : item.path;

export const getClubhouseLinks = (
	items: (MenuItemHeader | MenuItemLink | MenuItemText)[],
	godMode: boolean,
) => {
	const links: MenuItemLink[] = [];
	const seenPaths = new Set<string>();
	for (const item of items) {
		if (item.type === "text" || !item.league || item.commandPaletteOnly) {
			continue;
		}
		if (item.type === "header") {
			links.push(...getClubhouseLinks(item.children, godMode));
		} else if (!item.godMode || godMode) {
			const key =
				item.path === undefined ? undefined : JSON.stringify(item.path);
			if (key !== undefined && seenPaths.has(key)) {
				continue;
			}
			if (key !== undefined) {
				seenPaths.add(key);
			}
			links.push(item);
		}
	}
	return links.filter(
		(item, index) =>
			item.path === undefined ||
			links.findIndex(
				(other) => JSON.stringify(other.path) === JSON.stringify(item.path),
			) === index,
	);
};
