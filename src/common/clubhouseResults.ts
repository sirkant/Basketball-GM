import getWinner from "./getWinner.ts";

type ResultTeam = {
	tid: number;
	pts: number;
	sPts?: number;
	players?: readonly { pid?: number; name?: string; pts?: number }[];
};

type ResultGame = {
	gid: number;
	overtimes: number;
	teams: readonly [ResultTeam, ResultTeam];
	neutralSite?: boolean;
};

export const getClubhouseResults = (
	games: readonly ResultGame[],
	tid: number,
) => {
	const results = [];
	for (const game of games) {
		const [home, away] = game.teams;
		const index = home.tid === tid ? 0 : away.tid === tid ? 1 : undefined;
		if (index === undefined) {
			continue;
		}
		const ourTeam = game.teams[index];
		const opponent = game.teams[index === 0 ? 1 : 0];
		const winner = getWinner([home, away]);
		if (opponent.tid < 0 || winner === undefined) {
			continue;
		}

		let leader: { pid: number; name: string; pts: number } | undefined;
		for (const p of ourTeam.players ?? []) {
			if (
				typeof p.pid === "number" &&
				typeof p.name === "string" &&
				typeof p.pts === "number" &&
				p.pts > (leader?.pts ?? 0)
			) {
				leader = { pid: p.pid, name: p.name, pts: p.pts };
			}
		}
		const outcome = winner === -1 ? "T" : winner === index ? "W" : "L";
		results.push({
			gid: game.gid,
			opponentTid: opponent.tid,
			home: index === 0,
			...(game.neutralSite ? { neutralSite: true } : {}),
			points: ourTeam.pts,
			opponentPoints: opponent.pts,
			outcome,
			overtimes: game.overtimes,
			leader,
		});
		if (results.length === 5) {
			break;
		}
	}
	return results;
};
