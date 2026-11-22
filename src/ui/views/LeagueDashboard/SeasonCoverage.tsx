import { PHASE } from "../../../common/constants.ts";
import type { LocalStateUI, View } from "../../../common/types.ts";
import { PlayoffMatchup } from "../../components/PlayoffMatchup.tsx";
import { helpers } from "../../util/helpers.ts";
import { useLocal } from "../../util/local.ts";

type TeamInfo = LocalStateUI["teamInfoCache"][number];

const MatchTeam = ({ team, record }: { team?: TeamInfo; record?: string }) => {
	const logo = team?.imgURL ?? team?.imgURLSmall;
	return (
		<div className="season-coverage-team">
			{logo ? <img src={logo} alt="" /> : null}
			<strong>{team ? `${team.region} ${team.name}` : "TBD"}</strong>
			{record ? <span>{record}</span> : null}
		</div>
	);
};

const SeasonCoverage = (p: View<"leagueDashboard">) => {
	const {
		userTid,
		season,
		phase,
		teamInfoCache,
		showLeagueTopBar,
		liveGameInProgress,
	} = useLocal([
		"userTid",
		"season",
		"phase",
		"teamInfoCache",
		"showLeagueTopBar",
		"liveGameInProgress",
	]);
	const team = teamInfoCache[userTid];
	const next = p.upcomingGames[0];
	const home = next?.homeTid === userTid;
	const opponent = next
		? teamInfoCache[home ? next.awayTid : next.homeTid]
		: undefined;
	const showResults = showLeagueTopBar && !liveGameInProgress;
	const last = showResults ? p.recentResults[0] : undefined;
	const lastOpponent = last ? teamInfoCache[last.opponentTid] : undefined;
	const record = helpers.formatRecord(p);
	const boxScore = (gid: number) =>
		helpers.leagueUrl(["game_log", `${team?.abbrev}_${userTid}`, season, gid]);

	return (
		<section
			className="season-coverage"
			aria-labelledby="season-coverage-heading"
		>
			<header className="season-coverage-header">
				<div className="season-coverage-title">
					<span className="season-coverage-network">
						<img
							src="/img/clubhouse/espn-wordmark.svg"
							alt="ESPN"
							width="62"
							height="16"
						/>
					</span>
					<h2 id="season-coverage-heading">
						{phase === PHASE.PLAYOFFS ? "Playoffs" : "Regular season"}
					</h2>
				</div>
				<a href={helpers.leagueUrl(["schedule"])}>Schedule</a>
			</header>
			{next ? (
				<div className="season-coverage-fixture">
					<MatchTeam team={team} record={record} />
					<div className="season-coverage-venue">
						<strong>{home || next.neutralSite ? "vs" : "at"}</strong>
						<span>Day {next.day}</span>
						{next.neutralSite ? <span>Neutral site</span> : null}
					</div>
					<MatchTeam team={opponent} record={p.opponentRecord} />
				</div>
			) : (
				<p className="season-coverage-empty">
					No upcoming game on the schedule. <span>Club record {record}.</span>
				</p>
			)}
			{showResults && p.showPlayoffSeries && p.series ? (
				<div className="clubhouse-matchday-series">
					<PlayoffMatchup
						expandTeamNames
						numGamesToWinSeries={p.numGamesToWinSeries}
						season={season}
						series={p.series}
						userTid={userTid}
					/>
				</div>
			) : null}
			{last ? (
				<div className="season-coverage-results">
					<div className="season-coverage-final">
						<div>
							<h3>Last game</h3>
							<a className="season-coverage-score" href={boxScore(last.gid)}>
								<span data-outcome={last.outcome}>{last.outcome}</span>
								<strong>
									{last.points}–{last.opponentPoints}
								</strong>
								<span>
									{last.neutralSite || last.home ? "vs" : "at"}{" "}
									{lastOpponent
										? `${lastOpponent.region} ${lastOpponent.name}`
										: "Opponent"}
								</span>
								{last.overtimes > 0 ? (
									<span>
										{last.overtimes === 1 ? "OT" : `${last.overtimes}OT`}
									</span>
								) : null}
							</a>
						</div>
						{last.leader ? (
							<div className="season-coverage-leader">
								<span>Team scoring leader</span>
								<a href={helpers.leagueUrl(["player", last.leader.pid])}>
									{last.leader.name}
								</a>
								<strong>{last.leader.pts} pts</strong>
							</div>
						) : null}
					</div>
					<div className="season-coverage-form">
						<h3>Recent form</h3>
						<ol aria-label="Latest results first">
							{p.recentResults.map((game) => {
								const opponent = teamInfoCache[game.opponentTid];
								return (
									<li key={game.gid}>
										<a
											href={boxScore(game.gid)}
											aria-label={`${opponent?.abbrev ?? "Opponent"} ${game.outcome} ${game.points}–${game.opponentPoints}, ${opponent ? `${opponent.region} ${opponent.name}` : "opponent"}, box score`}
										>
											<strong data-outcome={game.outcome}>
												{game.outcome}
											</strong>{" "}
											{opponent?.abbrev ?? "—"}
										</a>
									</li>
								);
							})}
						</ol>
					</div>
				</div>
			) : null}
		</section>
	);
};

export default SeasonCoverage;
