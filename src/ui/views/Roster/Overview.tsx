import { useState } from "react";
import type { View } from "../../../common/types.ts";
import { Contract } from "../../components/contract.tsx";
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
		<section aria-label="Roster overview" className="mb-4">
			<div className="d-flex flex-wrap gap-2 align-items-center mb-3">
				<div
					className="d-flex flex-wrap gap-2"
					role="group"
					aria-label="Player situation"
				>
					{filters.map(([key, label]) => (
						<button
							key={key}
							type="button"
							className={`btn btn-sm ${filter === key ? "btn-primary" : "btn-light-bordered"}`}
							aria-pressed={filter === key}
							onClick={() => setFilter(key)}
						>
							{label}{" "}
							<span className="ms-1">
								{players.filter(matches[key]).length}
							</span>
						</button>
					))}
				</div>
				<input
					type="search"
					className="form-control form-control-sm ms-sm-auto"
					style={{ width: "min(100%, 16rem)" }}
					aria-label="Find a player by name or position"
					placeholder="Find a player or position…"
					value={search}
					onChange={(event) => setSearch(event.target.value)}
				/>
			</div>
			<p className="small text-body-secondary">
				Roles follow the lineup order. Open the full table to manage the lineup
				and playing time for your team.
			</p>
			<div className="row g-3">
				{visible.map(({ p, index }) => (
					<div className="col-12 col-md-6 col-xl-4" key={p.pid}>
						<article
							className="card h-100"
							aria-label={`${p.firstName} ${p.lastName}`}
						>
							<div className="card-body d-flex flex-column gap-3">
								<div className="d-flex gap-3 align-items-start">
									<div
										className="rounded bg-body-tertiary flex-shrink-0"
										style={{ width: 64, height: 96 }}
										aria-hidden="true"
									>
										<PlayerPicture face={p.face} imgURL={p.imgURL} lazy />
									</div>
									<div style={{ minWidth: 0 }}>
										<div className="small text-body-secondary mb-1">
											{index < numPlayersOnCourt ? "Starting lineup" : "Bench"}{" "}
											· Age {p.age}
										</div>
										<div className="small fw-semibold mb-1">
											{p.ratings.pos}
										</div>
										<div
											className="fw-bold"
											style={{ overflowWrap: "anywhere" }}
										>
											<PlayerNameLabels
												pid={p.pid}
												firstName={p.firstName}
												lastName={p.lastName}
												fullNames
												season={season}
												injury={p.injury}
												skills={
													challengeNoRatings ? undefined : p.ratings.skills
												}
												defaultWatch={p.watch}
												awards={p.awards}
												neverShowCountry
											/>
										</div>
									</div>
								</div>
								{!challengeNoRatings ? (
									<div className="d-flex gap-4">
										<div>
											<div className="small text-body-secondary">Overall</div>
											<span className="fs-4 fw-bold">
												<RatingWithChange change={p.ratings.dovr}>
													{p.ratings.ovr}
												</RatingWithChange>
											</span>
										</div>
										<div>
											<div className="small text-body-secondary">Potential</div>
											<span className="fs-4">
												<RatingWithChange change={p.ratings.dpot}>
													{p.ratings.pot}
												</RatingWithChange>
											</span>
										</div>
									</div>
								) : null}
								<div className="small">
									{p.stats.gp > 0 ? (
										<>
											{helpers.roundStat(p.stats.pts, "pts")} PTS ·{" "}
											{helpers.roundStat(p.stats.trb, "trb")} REB ·{" "}
											{helpers.roundStat(p.stats.ast, "ast")} AST{" "}
											<span className="text-body-secondary">
												/ game · {p.stats.gp} GP
											</span>
										</>
									) : (
										"No games played in this view yet."
									)}
								</div>
								<div className="border-top pt-3">
									<div className="fw-semibold">
										<Contract p={p} />
									</div>
									{salaryCapType !== "none" && salaryCap > 0 ? (
										<div className="small text-body-secondary">
											{(((p.contract.amount * 1000) / salaryCap) * 100).toFixed(
												1,
											)}
											% of salary cap
										</div>
									) : null}
									{p.contract.exp <= season ? (
										<div className="text-warning-emphasis small fw-semibold">
											{p.contract.exp < season
												? "Expired contract · renewal pending"
												: "Expiring contract · plan the next offseason"}
										</div>
									) : null}
								</div>
								<div className="small">
									{p.injury.gamesRemaining > 0 ? (
										<div className="text-danger">
											{p.injury.type} · {p.injury.gamesRemaining} games
											remaining
										</div>
									) : (
										<div>Healthy</div>
									)}
									{p.untradable ? (
										<div className="text-warning-emphasis">
											Trade restricted
											{p.untradableMsg ? ` · ${p.untradableMsg}` : ""}
										</div>
									) : null}
									{p.mood ? (
										<div className="mt-2">
											<div className="text-body-secondary">
												Renewal interest
											</div>
											<Mood p={p} defaultType="current" />
										</div>
									) : null}
								</div>
								<div className="mt-auto d-flex flex-wrap gap-2">
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
						</article>
					</div>
				))}
			</div>
			{visible.length === 0 ? (
				<p className="border rounded p-4 mt-3" role="status">
					No players match these filters. Try another situation or clear your
					search.
				</p>
			) : null}
		</section>
	);
};

export default Overview;
