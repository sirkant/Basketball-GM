const nbaTeams = new Map<string, [region: string, name: string, nbaId: number]>(
	[
		["ATL", ["Atlanta", "Hawks", 1610612737]],
		["BOS", ["Boston", "Celtics", 1610612738]],
		["BRK", ["Brooklyn", "Nets", 1610612751]],
		["CHI", ["Chicago", "Bulls", 1610612741]],
		["CHO", ["Charlotte", "Hornets", 1610612766]],
		["CLE", ["Cleveland", "Cavaliers", 1610612739]],
		["DAL", ["Dallas", "Mavericks", 1610612742]],
		["DEN", ["Denver", "Nuggets", 1610612743]],
		["DET", ["Detroit", "Pistons", 1610612765]],
		["GSW", ["Golden State", "Warriors", 1610612744]],
		["HOU", ["Houston", "Rockets", 1610612745]],
		["IND", ["Indiana", "Pacers", 1610612754]],
		["LAC", ["LA", "Clippers", 1610612746]],
		["LAL", ["Los Angeles", "Lakers", 1610612747]],
		["MEM", ["Memphis", "Grizzlies", 1610612763]],
		["MIA", ["Miami", "Heat", 1610612748]],
		["MIL", ["Milwaukee", "Bucks", 1610612749]],
		["MIN", ["Minnesota", "Timberwolves", 1610612750]],
		["NOP", ["New Orleans", "Pelicans", 1610612740]],
		["NYK", ["New York", "Knicks", 1610612752]],
		["OKC", ["Oklahoma City", "Thunder", 1610612760]],
		["ORL", ["Orlando", "Magic", 1610612753]],
		["PHI", ["Philadelphia", "76ers", 1610612755]],
		["PHO", ["Phoenix", "Suns", 1610612756]],
		["POR", ["Portland", "Trail Blazers", 1610612757]],
		["SAC", ["Sacramento", "Kings", 1610612758]],
		["SAS", ["San Antonio", "Spurs", 1610612759]],
		["TOR", ["Toronto", "Raptors", 1610612761]],
		["UTA", ["Utah", "Jazz", 1610612762]],
		["WAS", ["Washington", "Wizards", 1610612764]],
	],
);

type TeamIdentity = {
	srID?: string;
	region?: string;
	name?: string;
	imgURL?: string;
	imgURLSmall?: string;
};

// Current marks are sourced from the NBA team directory. Apply them only to
// modern real-roster snapshots so historical identities keep their season context.
export const applyCurrentNbaBranding = (team: TeamIdentity, season: number) => {
	const brand =
		team.srID && season >= 2026 ? nbaTeams.get(team.srID) : undefined;
	if (!brand) {
		return;
	}

	const [region, name, nbaId] = brand;
	team.region = region;
	team.name = name;
	team.imgURL = `https://cdn.nba.com/logos/nba/${nbaId}/primary/L/logo.svg`;
	delete team.imgURLSmall;
};
