import { useMemo, useState } from "react";
import { getChapterContext } from "../../common/leagueChronicle.ts";
import type { View } from "../../common/types.ts";
import { helpers } from "../util/helpers.ts";
import { useLocal } from "../util/local.ts";
import { TeamLogoInline } from "./TeamLogoInline.tsx";

type Season = View<"historyAll">["seasons"][number];
type Team = Season["champ"];
const teamName = (t: Team) =>
	t
		? t.missing
			? (t.region ?? "Unknown franchise")
			: `${t.region ?? ""} ${t.name ?? ""}`.trim()
		: "Result unavailable";
const rosterUrl = (t: Exclude<Team, undefined>, year: number) =>
	!t.missing
		? helpers.leagueUrl(["roster", `${t.abbrev}_${t.tid}`, year])
		: undefined;

const Finalist = ({
	t,
	year,
	label,
}: {
	t: Team;
	year: number;
	label: string;
}) => (
	<div className="chronicle-finalist">
		<span className="chronicle-eyebrow">{label}</span>
		{t && !t.missing ? (
			<>
				<TeamLogoInline
					imgURL={t.imgURL}
					imgURLSmall={t.imgURLSmall}
					size={52}
				/>
				<a className="chronicle-team-name" href={rosterUrl(t, year)}>
					{teamName(t)}
				</a>
				<span>
					{t.won + t.lost + (t.tied ?? 0) + (t.otl ?? 0) > 0
						? `${helpers.formatRecord(t)} regular season`
						: "Record unavailable"}
				</span>
				<span>
					{t.count}{" "}
					{label === "Champion"
						? t.count === 1
							? "title"
							: "titles"
						: t.count === 1
							? "runner-up finish"
							: "runner-up finishes"}{" "}
					recorded through {year}
				</span>
				<a href={helpers.leagueUrl(["team_history", `${t.abbrev}_${t.tid}`])}>
					Franchise history ↗
				</a>
			</>
		) : (
			<p>{teamName(t)}</p>
		)}
	</div>
);

const LeagueChronicle = ({ seasons }: Pick<View<"historyAll">, "seasons">) => {
	const { userTid } = useLocal(["userTid"]);
	const [search, setSearch] = useState("");
	const [decade, setDecade] = useState("all");
	const [yourFinals, setYourFinals] = useState(false);
	const [selectedYear, setSelectedYear] = useState<number>();
	const [page, setPage] = useState(0);
	const ordered = useMemo(
		() => [...seasons].sort((a, b) => b.season - a.season),
		[seasons],
	);
	const decades = [
		...new Set(ordered.map((row) => Math.floor(row.season / 10) * 10)),
	];
	const filtered = ordered.filter(
		(row) =>
			(decade === "all" ||
				Math.floor(row.season / 10) * 10 === Number(decade)) &&
			(!yourFinals ||
				row.champ?.tid === userTid ||
				row.runnerUp?.tid === userTid) &&
			`${row.season} ${teamName(row.champ)} ${teamName(row.runnerUp)} ${row.awards.map((award) => `${award.name} ${award.awardName}`).join(" ")}`
				.toLowerCase()
				.includes(search.trim().toLowerCase()),
	);
	const pageSize = 16;
	const currentPage = Math.min(
		page,
		Math.max(0, Math.ceil(filtered.length / pageSize) - 1),
	);
	const visible = filtered.slice(
		currentPage * pageSize,
		(currentPage + 1) * pageSize,
	);
	const selected =
		visible.find((row) => row.season === selectedYear) ?? visible[0];
	const context = selected
		? getChapterContext(ordered, selected.season)
		: undefined;
	const previous = ordered.find(
		(row) => row.season === (selected?.season ?? 0) - 1,
	);
	const resetFilters = () => {
		setSearch("");
		setDecade("all");
		setYourFinals(false);
		setPage(0);
	};
	const champions = new Set(
		ordered
			.filter((row) => row.champ && !row.champ.missing)
			.map((row) => row.champ!.tid),
	);
	const groups = Object.groupBy(
		selected?.awards ?? [],
		(award) => award.awardName,
	);
	return (
		<section className="league-chronicle" aria-label="League chronicle">
			<header className="chronicle-heading">
				<div>
					<span className="basketball-kicker">The league archive</span>
					<p>
						{ordered.length
							? `${ordered.at(-1)!.season}–${ordered[0]!.season} · ${ordered.length} seasons · ${champions.size} recorded champion franchises`
							: "Your league’s story starts here."}
					</p>
				</div>
				<a href={helpers.leagueUrl(["team_history"])}>
					Your franchise history ↗
				</a>
			</header>
			{ordered.length ? (
				<>
					<div className="chronicle-filters">
						<label>
							Find a chapter
							<input
								className="form-control"
								type="search"
								value={search}
								placeholder="Season, franchise, player or award…"
								onChange={(event) => {
									setSearch(event.target.value);
									setPage(0);
								}}
							/>
						</label>
						<label>
							Era
							<select
								className="form-select"
								value={decade}
								onChange={(event) => {
									setDecade(event.target.value);
									setPage(0);
								}}
							>
								<option value="all">All eras</option>
								{decades.map((value) => (
									<option key={value} value={value}>
										{value}s
									</option>
								))}
							</select>
						</label>
						<label className="chronicle-your-finals">
							<input
								type="checkbox"
								checked={yourFinals}
								onChange={(event) => {
									setYourFinals(event.target.checked);
									setPage(0);
								}}
							/>{" "}
							Your franchise in the final
						</label>
					</div>
					{selected && context ? (
						<div className="chronicle-workspace">
							<nav className="chronicle-seasons" aria-label="Choose a season">
								<span className="chronicle-eyebrow">
									{filtered.length} chapters
								</span>
								<div className="chronicle-season-list">
									{visible.map((row) => (
										<button
											key={row.season}
											type="button"
											aria-pressed={row.season === selected.season}
											onClick={() => setSelectedYear(row.season)}
										>
											<strong>{row.season}</strong>
											<span>
												{row.champ && !row.champ.missing
													? row.champ.abbrev
													: "—"}
											</span>
										</button>
									))}
								</div>
								<div className="chronicle-paging">
									<button
										type="button"
										disabled={currentPage === 0}
										onClick={() => setPage(currentPage - 1)}
										aria-label="Newer chapters"
									>
										←
									</button>
									<span>
										{currentPage + 1} / {Math.ceil(filtered.length / pageSize)}
									</span>
									<button
										type="button"
										disabled={(currentPage + 1) * pageSize >= filtered.length}
										onClick={() => setPage(currentPage + 1)}
										aria-label="Older chapters"
									>
										→
									</button>
								</div>
							</nav>
							<article
								className="chronicle-chapter"
								aria-label={`${selected.season} season chapter`}
							>
								<div className="chronicle-chapter-title">
									<span className="chronicle-year">{selected.season}</span>
									<div>
										<span className="chronicle-eyebrow">
											{selected.champ ? "Championship chapter" : "Archive gap"}
										</span>
										<h2>{context.title}</h2>
									</div>
								</div>
								<p className="chronicle-lede">
									{context.type === "repeat"
										? `${teamName(selected.champ)} won a ${helpers.ordinal(context.streak)} consecutive championship. Follow the rosters to see who carried this run.`
										: context.type === "reversal"
											? `${teamName(selected.champ)} beat ${teamName(selected.runnerUp)} to reverse the previous season’s championship matchup.`
											: context.type === "change"
												? `${teamName(selected.champ)} followed ${teamName(previous?.champ)} as league champion.`
												: context.type === "incomplete"
													? "The championship result is missing from this archive. Available honours are preserved below."
													: `${teamName(selected.champ)} holds the ${selected.season} championship in the league record.`}
								</p>
								{selected.finalsScore ? (
									<p className="chronicle-finals-result">
										Finals ·{" "}
										<strong>
											{selected.finalsScore.champ}–
											{selected.finalsScore.runnerUp}
										</strong>
									</p>
								) : null}
								<div className="chronicle-finalists">
									<Finalist
										t={selected.champ}
										year={selected.season}
										label="Champion"
									/>
									<Finalist
										t={selected.runnerUp}
										year={selected.season}
										label="Runner-up"
									/>
								</div>
								<nav
									className="chronicle-season-links"
									aria-label="Explore this season"
								>
									{selected.awards.length > 0 ? (
										<a href={helpers.leagueUrl(["history", selected.season])}>
											Season summary ↗
										</a>
									) : null}
									<a href={helpers.leagueUrl(["playoffs", selected.season])}>
										Playoff bracket ↗
									</a>
									<a
										href={helpers.leagueUrl(["draft_history", selected.season])}
									>
										Draft class ↗
									</a>
									<a href={helpers.leagueUrl(["standings", selected.season])}>
										Standings ↗
									</a>
								</nav>
								<div className="chronicle-honours">
									<div className="chronicle-section-heading">
										<h4>The people who defined it</h4>
										<span>Recorded individual honours</span>
									</div>
									{selected.awards.length ? (
										<div className="chronicle-awards">
											{Object.entries(groups).map(([name, winners]) => (
												<section key={name} aria-label={name}>
													<h5>{name}</h5>
													{winners?.map((winner, index) => (
														<div key={`${winner.pid}-${index}`}>
															<a
																href={helpers.leagueUrl(["player", winner.pid])}
															>
																{winner.name}
															</a>
															<span>
																{winner.abbrev} · {winner.count} recorded{" "}
																{winner.count === 1 ? "win" : "wins"} through{" "}
																{selected.season}
																{previous?.awards.some(
																	(award) =>
																		award.awardName === name &&
																		award.pid === winner.pid,
																)
																	? " · Also won last season"
																	: ""}
															</span>
														</div>
													))}
												</section>
											))}
										</div>
									) : (
										<p>
											No individual award records are available for this season.
										</p>
									)}
								</div>
							</article>
						</div>
					) : (
						<div className="chronicle-empty" role="status">
							<h3>No chapters match</h3>
							<p>Try another season, franchise or player.</p>
							<button
								type="button"
								className="btn btn-light-bordered"
								onClick={resetFilters}
							>
								Clear filters
							</button>
						</div>
					)}
				</>
			) : (
				<div className="chronicle-empty">
					<h3>The first chapter is still being written.</h3>
					<p>
						Finish a season to revisit its champion, finalists and individual
						honours here.
					</p>
					<a href={helpers.leagueUrl(["league_dashboard"])}>
						Back to your team ↗
					</a>
				</div>
			)}
		</section>
	);
};

export default LeagueChronicle;
