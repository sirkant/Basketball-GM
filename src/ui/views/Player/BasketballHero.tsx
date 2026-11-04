import type { View } from "../../../common/types.ts";
import { PHASE, PLAYER } from "../../../common/constants.ts";
import { PlayerPicture } from "../../components/PlayerPicture.tsx";
import { CountryFlag } from "../../components/CountryFlag.tsx";
import { ContractSchedule } from "../../components/contract.tsx";
import { helpers } from "../../util/helpers.ts";
import { useLocal } from "../../util/local.ts";

export const BasketballHero = ({
	player,
	teamColors,
	teamJersey,
	teamName,
	teamURL,
	bestPos,
	currentSeason,
	season,
}: Pick<
	View<"player">,
	"player" | "teamColors" | "teamJersey" | "teamName" | "teamURL" | "bestPos"
> & { currentSeason: number; season?: number }) => {
	const { teamInfoCache, phase } = useLocal(["teamInfoCache", "phase"]);
	const team = teamInfoCache[player.tid];
	const retired = player.tid === PLAYER.RETIRED;
	const selectedSeason = season ?? currentSeason;
	const stats =
		retired && season === undefined
			? player.careerStats
			: (player.stats.findLast(
					(s) => !s.playoffs && s.season === selectedSeason,
				) ??
				(phase === PHASE.PRESEASON && season === undefined
					? player.stats.findLast(
							(s) => !s.playoffs && s.season === currentSeason - 1,
						)
					: undefined));
	const contractYear = currentSeason + (phase > PHASE.PLAYOFFS ? 1 : 0);
	const years = Math.max(0, player.contract.exp - contractYear + 1);
	return (
		<section
			className="player-identity-stage"
			aria-label="Player identity and production"
		>
			<div className="dossier-portrait">
				<span className="dossier-jersey" aria-hidden="true">
					{player.jerseyNumber}
				</span>
				<PlayerPicture
					face={player.face}
					imgURL={player.imgURL}
					colors={teamColors}
					jersey={teamJersey}
				/>
			</div>
			<div className="dossier-identity">
				<span className="dossier-eyebrow">
					PLAYER DOSSIER /{" "}
					{retired && season === undefined ? "CAREER" : selectedSeason}
				</span>
				<h2>{player.name}</h2>
				<div className="dossier-identity-meta">
					<span>{bestPos}</span>
					<span>{player.age} years old</span>
					<CountryFlag country={player.born.loc} />
					<span>{player.jerseyNumber ? `#${player.jerseyNumber}` : ""}</span>
				</div>
				<div className="dossier-club">
					{team?.imgURL || team?.imgURLSmall ? (
						<img src={team.imgURLSmall ?? team.imgURL} alt="" />
					) : null}
					{teamURL ? <a href={teamURL}>{teamName}</a> : <span>{teamName}</span>}
				</div>
				<p
					className={
						player.injury.gamesRemaining > 0
							? "dossier-availability is-injured"
							: "dossier-availability"
					}
				>
					{player.injury.gamesRemaining > 0
						? `${player.injury.type} · ${player.injury.gamesRemaining} games remaining`
						: retired
							? "Retired"
							: player.tid === PLAYER.FREE_AGENT
								? "Healthy · Free agent"
								: player.tid < 0
									? "Draft prospect"
									: "Available for selection"}
				</p>
				<div className="dossier-production">
					{(["pts", "trb", "ast", "min", "per"] as const).map((stat, i) => (
						<div key={stat}>
							<strong>
								{stats && (stats.gp ?? 0) > 0
									? helpers.roundStat(stats[stat], stat)
									: "—"}
							</strong>
							<span>
								{["POINTS", "REBOUNDS", "ASSISTS", "MINUTES", "PER"][i]}
							</span>
						</div>
					))}
				</div>
				<small className="dossier-production-caption">
					{stats && (stats.gp ?? 0) > 0
						? `${retired && season === undefined ? "Career" : stats.season} · ${stats.gp} games · Per-game production; PER is an efficiency rating`
						: "No games recorded for the selected season"}
				</small>
			</div>
			<aside className="dossier-contract">
				<span className="dossier-eyebrow">
					{player.tid >= 0
						? "CURRENT ANNUAL SALARY"
						: retired
							? "CAREER APPEARANCES"
							: "CONTRACT STATUS"}
				</span>
				<strong>
					{player.tid >= 0
						? helpers.formatCurrency(player.contract.amount, "M")
						: retired
							? player.careerStats.gp
							: player.tid === PLAYER.FREE_AGENT
								? "Free agent"
								: "Prospect"}
				</strong>
				{player.tid >= 0 ? (
					<>
						<div className="dossier-contract-term">
							<span>
								Signed through <b>{player.contract.exp}</b>
							</span>
							<span>
								{years > 0
									? `${years} year${years === 1 ? "" : "s"} remaining`
									: "Renewal pending"}
							</span>
						</div>
						<ContractSchedule p={player} />
					</>
				) : null}
				<a href="#player-details">Personal details & actions ↓</a>
				<a href="#player-career-record">Career statistics & history ↓</a>
			</aside>
		</section>
	);
};
