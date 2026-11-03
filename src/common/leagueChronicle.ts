type TitleTeam = { tid: number; missing?: boolean };
type Chapter = { season: number; champ?: TitleTeam; runnerUp?: TitleTeam };

// Historical gaps break streaks. We describe recorded results, never invent
// dynasties, droughts or rivalry intensity when seasons are missing.
export const getChapterContext = (
	chapters: readonly Chapter[],
	year: number,
) => {
	const bySeason = new Map(
		chapters.map((chapter) => [chapter.season, chapter]),
	);
	const current = bySeason.get(year);
	const previous = bySeason.get(year - 1);
	if (!current?.champ) {
		return {
			type: "incomplete" as const,
			streak: 0,
			title: "A gap in the record",
		};
	}
	if (current.champ.missing) {
		return {
			type: "recorded" as const,
			streak: 1,
			title: "A championship on record",
		};
	}
	let streak = 1;
	while (true) {
		const earlier = bySeason.get(year - streak)?.champ;
		if (!earlier || earlier.missing || earlier.tid !== current.champ.tid) {
			break;
		}
		streak += 1;
	}
	if (streak >= 2) {
		return {
			type: "repeat" as const,
			streak,
			title:
				streak === 2
					? "Back to back"
					: streak === 3
						? "The three-peat"
						: `${streak} straight titles`,
		};
	}
	if (
		previous?.champ &&
		!previous.champ.missing &&
		previous.champ.tid !== current.champ.tid
	) {
		if (
			current.runnerUp &&
			!current.runnerUp.missing &&
			previous.runnerUp &&
			!previous.runnerUp.missing &&
			previous.champ.tid === current.runnerUp.tid &&
			previous.runnerUp.tid === current.champ.tid
		) {
			return { type: "reversal" as const, streak, title: "The Finals flipped" };
		}
		return { type: "change" as const, streak, title: "A new champion" };
	}
	return { type: "recorded" as const, streak, title: "A season to remember" };
};
