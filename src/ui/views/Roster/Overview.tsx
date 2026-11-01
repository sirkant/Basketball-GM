import { useState } from "react";

import type { View } from "../../../common/types.ts";

import { Contract, ContractSchedule } from "../../components/contract.tsx";

import { Mood } from "../../components/Mood.tsx";

import { PlayerNameLabels } from "../../components/PlayerNameLabels.tsx";

import { PlayerPicture } from "../../components/PlayerPicture.tsx";

import { RatingWithChange } from "../../components/RatingWithChange.tsx";

import { helpers } from "../../util/helpers.ts";

import { useLocal } from "../../util/local.ts";

import { toWorker } from "../../util/toWorker.ts";

type Filter = "all" | "expiring" | "injured" | "locked";

const Overview = ({
	players,

	numPlayersOnCourt,

	season,

	showTradeFor,

	showTradingBlock,
}: Pick<
	View<"roster">,
	| "players"
	| "numPlayersOnCourt"
	| "season"
	| "showTradeFor"
	| "showTradingBlock"
>) => {
	const [filter, setFilter] = useState<Filter>("all");

	const [search, setSearch] = useState("");

	const { challengeNoRatings, salaryCap, salaryCapType } = useLocal([
		"challengeNoRatings",

		"salaryCap",

		"salaryCapType",
	]);

	const matches = {
		all: () => true,

		expiring: (p: (typeof players)[number]) => p.contract.exp <= season,

		injured: (p: (typeof players)[number]) => p.injury.gamesRemaining > 0,

		locked: (p: (typeof players)[number]) => Boolean(p.untradable),
	};

	const filters = [
		["all", "Everyone"],

		["expiring", "Expiring contracts"],

		["injured", "Injured"],

		["locked", "Trade restricted"],
	] as const;

	const visible = players

		.map((p, index) => ({ p, index }))

		.filter(
			({ p }) =>
				matches[filter](p) &&
				`${p.firstName} ${p.lastName} ${p.ratings.pos}`

					.toLowerCase()

					.includes(search.trim().toLowerCase()),
		);

	return (
		<section aria-label="Roster overview" className="squad-view mb-4">
			<div className="squad-toolbar">
				<div
					className="squad-filters"
					role="group"
					aria-label="Player situation"
				>
					{filters.map(([key, label]) => (
						<button
							key={key}
							type="button"
							className={
								filter === key ? "squad-filter active" : "squad-filter"
							}
							aria-pressed={filter === key}
							onClick={() => setFilter(key)}
						>
							{label} <span>{players.filter(matches[key]).length}</span>
						</button>
					))}
				</div>

				<input
					type="search"
					className="form-control squad-search"
					aria-label="Find a player by name or position"
					placeholder="Find a player or position…"
					value={search}
					onChange={(event) => setSearch(event.target.value)}
				/>
			</div>

			<div className="squad-column-head" aria-hidden="true">
				<span>Player / lineup order</span>
				<span>Ability & production</span>
				<span>Contract & availability</span>
			</div>

			<div className="squad-list">
				{visible.map(({ p, index }) => (
					<article
						key={p.pid}
						className={`squad-player ${index < numPlayersOnCourt ? "squad-starter" : ""}`}
						aria-label={`${p.firstName} ${p.lastName}`}
					>
						<div className="squad-player-main">
							<div className="squad-identity">
								<span className="squad-order" title="Lineup order">
									{String(index + 1).padStart(2, "0")}
								</span>

								<div className="squad-portrait" aria-hidden="true">
									<PlayerPicture face={p.face} imgURL={p.imgURL} lazy />
								</div>

								<div className="squad-name">
									<div className="squad-role">
										{index < numPlayersOnCourt ? "Starter" : "Bench"}{" "}
										<span>
											· {p.ratings.pos} · Age {p.age}
										</span>
									</div>

									<PlayerNameLabels
										pid={p.pid}
										firstName={p.firstName}
										lastName={p.lastName}
										fullNames
										season={season}
										injury={p.injury}
										skills={challengeNoRatings ? undefined : p.ratings.skills}
										defaultWatch={p.watch}
										awards={p.awards}
										neverShowCountry
									/>
								</div>
							</div>

							<div className="squad-performance">
								{!challengeNoRatings ? (
									<div className="squad-ratings">
										<div>
											<span>OVR</span>
											<strong>
												<RatingWithChange change={p.ratings.dovr}>
													{p.ratings.ovr}
												</RatingWithChange>
											</strong>
										</div>

										<div>
											<span>POT</span>
											<strong>
												<RatingWithChange change={p.ratings.dpot}>
													{p.ratings.pot}
												</RatingWithChange>
											</strong>
										</div>
									</div>
								) : null}

								<div className="squad-production">
									{p.stats.gp > 0 ? (
										<>
											<strong>{helpers.roundStat(p.stats.pts, "pts")}</strong>{" "}
											PTS{" "}
											<strong>{helpers.roundStat(p.stats.trb, "trb")}</strong>{" "}
											REB{" "}
											<strong>{helpers.roundStat(p.stats.ast, "ast")}</strong>{" "}
											AST <span> / game · {p.stats.gp} GP</span>
										</>
									) : (
										<span>No games played yet</span>
									)}
								</div>
							</div>

							<div className="squad-contract">
								<div className="squad-salary">
									<Contract p={p} />
								</div>

								<div className="squad-availability">
									{p.injury.gamesRemaining > 0 ? (
										<span className="text-danger">
											{p.injury.type} · {p.injury.gamesRemaining} games
										</span>
									) : (
										<span>Healthy</span>
									)}
									{p.contract.exp <= season ? (
										<span className="text-warning-emphasis">
											{" "}
											·{" "}
											{p.contract.exp < season ? "Renewal pending" : "Expiring"}
										</span>
									) : null}
									{p.untradable ? (
										<span className="text-warning-emphasis">
											{" "}
											· Trade restricted
										</span>
									) : null}
								</div>
							</div>
						</div>

						<details className="squad-player-details">
							<summary>Player details & actions</summary>

							<div className="squad-player-expanded">
								<div>
									<ContractSchedule p={p} />
									{salaryCapType !== "none" && salaryCap > 0 ? (
										<div>
											{(((p.contract.amount * 1000) / salaryCap) * 100).toFixed(
												1,
											)}
											% of salary cap
										</div>
									) : null}
									{p.untradableMsg ? <div>{p.untradableMsg}</div> : null}
								</div>

								{p.mood ? (
									<div>
										<span className="text-body-secondary">
											Renewal interest
										</span>
										<Mood p={p} defaultType="current" />
									</div>
								) : null}

								<div className="d-flex flex-wrap gap-2 align-items-start">
									<a
										className="btn btn-sm btn-light-bordered"
										href={helpers.leagueUrl(["player", p.pid])}
									>
										Player profile
									</a>

									{showTradeFor || showTradingBlock ? (
										<button
											type="button"
											className="btn btn-sm btn-light-bordered"
											disabled={p.untradable}
											onClick={() => {
												if (showTradeFor) {
													toWorker("actions", "tradeFor", { pid: p.pid });
												} else {
													toWorker("actions", "addToTradingBlock", {
														pids: [p.pid],
													});
												}
											}}
										>
											{showTradeFor ? "Trade for" : "Find a trade"}
										</button>
									) : null}
								</div>
							</div>
						</details>
					</article>
				))}
			</div>

			{visible.length === 0 ? (
				<p className="squad-empty" role="status">
					No players match these filters. Try another situation or clear your
					search.
				</p>
			) : null}

			<p className="squad-footnote">
				Lineup order determines starters. Use Lineup & full table to change the
				rotation, playing time and manage releases.
			</p>
		</section>
	);
};

export default Overview;
