import type { ReactNode } from "react";
import type { View } from "../../../common/types.ts";
import { helpers } from "../../util/helpers.ts";
import { useLocal } from "../../util/local.ts";
import { ClubhouseMessages } from "../../components/ClubhouseMessages.tsx";
import { FinancialStrip } from "../../components/FinancialStrip.tsx";
import { PlayerPicture } from "../../components/PlayerPicture.tsx";
import { NewsBlock } from "../../components/NewsBlock.tsx";
import { PlayoffMatchup } from "../../components/PlayoffMatchup.tsx";
import StartingLineup from "./StartingLineup.tsx";
import TeamStats from "./TeamStats.tsx";
import Leaders from "./Leaders.tsx";

const Panel = ({
	title,
	href,
	children,
	className = "",
}: {
	title: string;
	href?: string;
	children: ReactNode;
	className?: string;
}) => (
	<section className={`clubhouse-panel ${className}`}>
		<header>
			<h2>{title}</h2>
			{href ? (
				<a href={href} aria-label={`Open ${title}`}>
					↗
				</a>
			) : null}
		</header>
		{children}
	</section>
);

const ClubhouseDashboard = (p: View<"leagueDashboard">) => {
	const { season, userTid, teamInfoCache, challengeNoRatings } = useLocal([
		"season",
		"userTid",
		"teamInfoCache",
		"challengeNoRatings",
	]);
	const money = (amount: number) => helpers.formatCurrency(amount / 1000, "M");
	const club = teamInfoCache[userTid];
	const next = p.upcomingGames[0];
	const opponent = next
		? teamInfoCache[next.homeTid === userTid ? next.awayTid : next.homeTid]
		: undefined;
	return (
		<div className="clubhouse-dashboard">
			<div className="clubhouse-desk-heading">
				<div>
					<span className="clubhouse-eyebrow">
						BASKETBALL OPERATIONS / {season}
					</span>
					<h2>The daily briefing</h2>
				</div>
				<div className="clubhouse-record">
					<strong>
						{p.won}–{p.lost}
					</strong>
					<span>
						{p.playoffRoundsWon < 0
							? `${helpers.ordinal(p.rank)} in ${p.playoffsByConf ? "conference" : "league"}`
							: p.roundsWonText}
					</span>
				</div>
			</div>
			<div className="clubhouse-desk-grid">
				<Panel
					title="Inbox"
					href={helpers.leagueUrl(["inbox"])}
					className="clubhouse-desk-inbox"
				>
					<ClubhouseMessages messages={p.messages} compact />
					<a
						className="clubhouse-panel-footer"
						href={helpers.leagueUrl(["inbox"])}
					>
						All correspondence →
					</a>
				</Panel>
				<div className="clubhouse-desk-editorial">
					<Panel
						title="Around the league"
						href={helpers.leagueUrl(["news"])}
						className="clubhouse-editorial-news"
					>
						{p.events.length ? (
							p.events.slice(0, 5).map((event, i) => (
								<div
									key={event.eid}
									className={
										i === 0 ? "clubhouse-lead-story" : "clubhouse-short-story"
									}
								>
									{i === 0 &&
									!event.p &&
									event.tid !== undefined &&
									p.teams[event.tid]?.imgURL ? (
										<img
											className="clubhouse-story-crest"
											src={p.teams[event.tid]!.imgURL}
											alt=""
										/>
									) : null}
									<NewsBlock
										event={event}
										season={season}
										teams={p.teams}
										userTid={userTid}
									/>
								</div>
							))
						) : (
							<div className="clubhouse-season-opening">
								{club?.imgURL ? <img src={club.imgURL} alt="" /> : null}
								<span className="clubhouse-eyebrow">A NEW CHAPTER</span>
								<h3>
									{p.region} {p.name}
								</h3>
								<p>The roster is assembled. The story starts on the court.</p>
								<a href={helpers.leagueUrl(["roster"])}>
									Review your rotation →
								</a>
							</div>
						)}
					</Panel>
					<Panel title="Coming up" href={helpers.leagueUrl(["schedule"])}>
						<div className="clubhouse-fixture-list">
							{p.upcomingGames.length ? (
								p.upcomingGames.map((game) => {
									const home = game.homeTid === userTid;
									const t = teamInfoCache[home ? game.awayTid : game.homeTid];
									return (
										<a key={game.gid} href={helpers.leagueUrl(["schedule"])}>
											<span>Day {game.day}</span>
											{t?.imgURLSmall || t?.imgURL ? (
												<img src={t.imgURLSmall ?? t.imgURL} alt="" />
											) : null}
											<strong>{t?.abbrev ?? "TBD"}</strong>
											<span>{home ? "Home" : "Away"}</span>
										</a>
									);
								})
							) : (
								<p className="clubhouse-empty">
									No games scheduled in the current phase.
								</p>
							)}
						</div>
					</Panel>
				</div>
				<Panel
					title={p.playoffsByConf ? "Conference standings" : "League standings"}
					href={helpers.leagueUrl(["standings"])}
					className="clubhouse-desk-standings"
				>
					<div className="table-responsive">
						<table className="table table-sm mb-0">
							<thead>
								<tr>
									<th>#</th>
									<th>Team</th>
									<th>W</th>
									<th>L</th>
									<th>{p.usePts ? "PTS" : "GB"}</th>
								</tr>
							</thead>
							<tbody>
								{p.confOrAllTeams.map((t, i) => {
									const info = teamInfoCache[t.tid];
									return (
										<tr
											key={t.tid}
											className={`${t.tid === userTid ? "table-info" : ""} ${i === p.maxPlayoffSeed - 1 || i === p.maxPlayoffSeedNoPlayIn - 1 ? "separator" : ""}`}
										>
											<td>{t.rank}</td>
											<td>
												<a
													className="clubhouse-table-team"
													href={helpers.leagueUrl([
														"roster",
														`${info?.abbrev}_${t.tid}`,
													])}
												>
													{info?.imgURLSmall || info?.imgURL ? (
														<img src={info.imgURLSmall ?? info.imgURL} alt="" />
													) : null}
													<span>{info?.region ?? t.tid}</span>
												</a>
											</td>
											<td>{t.seasonAttrs.won}</td>
											<td>{t.seasonAttrs.lost}</td>
											<td>{p.usePts ? Math.round(t.seasonAttrs.pts) : t.gb}</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
					<a
						className="clubhouse-panel-footer"
						href={helpers.leagueUrl(["standings"])}
					>
						Full standings & tiebreakers →
					</a>
				</Panel>
				<div className="clubhouse-desk-context">
					<Panel title="Next on court" href={helpers.leagueUrl(["schedule"])}>
						{next ? (
							<div className="clubhouse-opponent">
								{opponent?.imgURL ? <img src={opponent.imgURL} alt="" /> : null}
								<div>
									<span className="clubhouse-eyebrow">
										{next.homeTid === userTid ? "HOME" : "AWAY"} · DAY{" "}
										{next.day}
									</span>
									<strong>
										{opponent?.region} {opponent?.name}
									</strong>
								</div>
							</div>
						) : (
							<p className="clubhouse-empty">Awaiting the next schedule.</p>
						)}
						{p.showPlayoffSeries && p.series ? (
							<PlayoffMatchup
								expandTeamNames
								numGamesToWinSeries={p.numGamesToWinSeries}
								season={season}
								series={p.series}
								userTid={userTid}
							/>
						) : null}
					</Panel>
					<Panel
						title="Club finances"
						href={helpers.leagueUrl(["team_finances"])}
					>
						<dl className="clubhouse-finance-ledger">
							<div>
								<dt>Payroll</dt>
								<dd>{money(p.payroll)}</dd>
							</div>
							<div>
								<dt>Salary + luxury tax</dt>
								<dd>
									{p.financialStatus ? money(p.financialStatus.total) : "—"}
								</dd>
							</div>
							<div>
								<dt>Cash</dt>
								<dd>{money(p.cash)}</dd>
							</div>
							<div>
								<dt>Revenue YTD</dt>
								<dd>{helpers.formatCurrency(p.revenue, "M")}</dd>
							</div>
							<div>
								<dt>Profit YTD</dt>
								<dd>{helpers.formatCurrency(p.profit, "M")}</dd>
							</div>
							<div>
								<dt>Avg attendance</dt>
								<dd>{helpers.numberWithCommas(Math.round(p.att))}</dd>
							</div>
						</dl>
						<FinancialStrip status={p.financialStatus} />
					</Panel>
					<Panel title="The rotation" href={helpers.leagueUrl(["roster"])}>
						<div className="clubhouse-core-list">
							{p.starters.slice(0, 3).map((player) => (
								<a
									key={player.pid}
									href={helpers.leagueUrl(["player", player.pid])}
								>
									<div className="clubhouse-core-portrait">
										<PlayerPicture face={player.face} imgURL={player.imgURL} />
									</div>
									<div>
										<strong>
											{player.firstName} {player.lastName}
										</strong>
										<span>
											{player.ratings.pos} · {player.age} years
											{!challengeNoRatings
												? ` · OVR ${player.ratings.ovr}`
												: ""}
										</span>
										<span>
											{money(player.contract.amount * 1000)} /{" "}
											{player.contract.exp}
										</span>
									</div>
								</a>
							))}
						</div>
					</Panel>
				</div>
			</div>
			<div className="clubhouse-desk-detail">
				<Panel
					title="Rotation & production"
					href={helpers.leagueUrl(["roster"])}
				>
					<StartingLineup
						numPlayersOnCourt={p.numPlayersOnCourt}
						starters={p.starters}
						startersStats={p.startersStats}
					/>
				</Panel>
				<Panel title="Performance">
					<TeamStats teamStats={p.teamStats} />
					<Leaders
						leagueLeaders={p.leagueLeaders}
						teamLeaders={p.teamLeaders}
					/>
				</Panel>
			</div>
		</div>
	);
};
export default ClubhouseDashboard;
