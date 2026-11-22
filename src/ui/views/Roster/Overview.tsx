import { type FormEvent, useRef, useState } from "react";
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
type Player = View<"roster">["players"][number];

const filters = [
	["all", "Everyone"],
	["expiring", "Expiring contracts"],
	["injured", "Injured"],
	["locked", "Trade restricted"],
] as const;

const productionStats = [
	["min", "MIN"],
	["pts", "PTS"],
	["trb", "REB"],
	["ast", "AST"],
] as const;

const Overview = ({
	players,
	numPlayersOnCourt,
	season,
	editable,
	showTradeFor,
	showTradingBlock,
	onMakeStarter,
}: Pick<
	View<"roster">,
	| "players"
	| "numPlayersOnCourt"
	| "season"
	| "editable"
	| "showTradeFor"
	| "showTradingBlock"
> & {
	onMakeStarter: (starterPid: number, benchPid: number) => Promise<void>;
}) => {
	const [filter, setFilter] = useState<Filter>("all");
	const [search, setSearch] = useState("");
	const [selectedBenchPid, setSelectedBenchPid] = useState<number>();
	const [saving, setSaving] = useState(false);
	const [notice, setNotice] = useState<{ text: string; error?: boolean }>();
	const status = useRef<HTMLParagraphElement>(null);
	const { challengeNoRatings, salaryCap, salaryCapType } = useLocal([
		"challengeNoRatings",
		"salaryCap",
		"salaryCapType",
	]);

	const starters = players.slice(0, numPlayersOnCourt);
	const matches = {
		all: () => true,
		expiring: (p: Player) => p.contract.exp <= season,
		injured: (p: Player) => p.injury.gamesRemaining > 0,
		locked: (p: Player) => Boolean(p.untradable),
	};
	const query = search.trim().toLowerCase();
	const visible = players
		.map((p, index) => ({ p, index }))
		.filter(
			({ p }) =>
				matches[filter](p) &&
				`${p.firstName} ${p.lastName} ${p.ratings.pos}`
					.toLowerCase()
					.includes(query),
		);
	const groups = [
		{
			title: "Starters",
			rows: visible.filter(({ index }) => index < numPlayersOnCourt),
		},
		{
			title: "Bench",
			rows: visible.filter(({ index }) => index >= numPlayersOnCourt),
		},
	];

	const submitSwap = async (
		event: FormEvent<HTMLFormElement>,
		bench: Player,
	) => {
		event.preventDefault();
		if (saving) {
			return;
		}

		const starterPid = new FormData(event.currentTarget).get("starter");
		const starter = starters.find((p) => String(p.pid) === starterPid);
		if (!starter) {
			return;
		}

		setSaving(true);
		setNotice({ text: "Saving lineup…" });
		try {
			await onMakeStarter(starter.pid, bench.pid);
			setSelectedBenchPid(undefined);
			setNotice({
				text: `${bench.firstName} ${bench.lastName} now starts in place of ${starter.firstName} ${starter.lastName}.`,
			});
		} catch {
			setNotice({ text: "Couldn’t save the lineup. Try again.", error: true });
		} finally {
			setSaving(false);
			status.current?.focus();
		}
	};

	const renderPlayer = ({ p, index }: (typeof visible)[number]) => {
		const name = `${p.firstName} ${p.lastName}`;
		const canStart =
			editable && numPlayersOnCourt > 0 && index >= numPlayersOnCourt;
		const selectingStarter = canStart && selectedBenchPid === p.pid;
		const formId = `rotation-start-${p.pid}`;

		return (
			<article key={p.pid} className="squad-player" aria-label={name}>
				<div className="squad-player-main">
					<div className="squad-identity">
						<span className="squad-order" title="Lineup order">
							{index + 1}
						</span>
						<div className="squad-portrait" aria-hidden="true">
							<PlayerPicture face={p.face} imgURL={p.imgURL} lazy />
						</div>
						<div className="squad-name">
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
							<div className="squad-role">
								{p.ratings.pos} · Age {p.age}
							</div>
						</div>
					</div>

					<div className="squad-performance">
						<div className="squad-production">
							{p.stats.gp > 0 ? (
								<>
									{productionStats.map(([stat, label]) => (
										<span key={stat}>
											<strong>{helpers.roundStat(p.stats[stat], stat)}</strong>{" "}
											{label}
										</span>
									))}
									<span>/ game · {p.stats.gp} GP</span>
								</>
							) : (
								<span>No games played yet</span>
							)}
						</div>
						{!challengeNoRatings ? (
							<div className="squad-ratings">
								<span>
									OVR{" "}
									<strong>
										<RatingWithChange change={p.ratings.dovr}>
											{p.ratings.ovr}
										</RatingWithChange>
									</strong>
								</span>
								<span>
									POT{" "}
									<strong>
										<RatingWithChange change={p.ratings.dpot}>
											{p.ratings.pot}
										</RatingWithChange>
									</strong>
								</span>
							</div>
						) : null}
					</div>

					<div className="squad-contract">
						<div className="squad-salary">
							<Contract p={p} />
						</div>
						<div className="squad-availability">
							{p.injury.gamesRemaining > 0 ? (
								<span className="text-danger">
									{p.injury.type} · {p.injury.gamesRemaining}{" "}
									{helpers.plural("game", p.injury.gamesRemaining)}
								</span>
							) : (
								<span>Healthy</span>
							)}
							{p.contract.exp <= season ? (
								<span className="text-warning-emphasis">
									{" "}
									· {p.contract.exp < season ? "Renewal pending" : "Expiring"}
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

					{canStart ? (
						<button
							type="button"
							className="btn btn-sm btn-light-bordered squad-start"
							aria-label={
								selectingStarter ? `Cancel starting ${name}` : `Start ${name}`
							}
							aria-expanded={selectingStarter}
							aria-controls={selectingStarter ? formId : undefined}
							disabled={saving}
							onClick={() => {
								setSelectedBenchPid(selectingStarter ? undefined : p.pid);
								setNotice(undefined);
							}}
						>
							{selectingStarter ? "Cancel" : "Start"}
						</button>
					) : null}
				</div>

				{selectingStarter ? (
					<form
						className="squad-swap"
						id={formId}
						onSubmit={(event) => submitSwap(event, p)}
					>
						<label className="squad-swap-choice">
							Starter to replace
							<select
								name="starter"
								className="form-select form-select-sm"
								defaultValue=""
								required
								disabled={saving}
							>
								<option value="" disabled>
									Select a starter
								</option>
								{starters.map((starter) => (
									<option key={starter.pid} value={starter.pid}>
										{starter.firstName} {starter.lastName} (
										{starter.ratings.pos})
									</option>
								))}
							</select>
						</label>
						<button
							type="submit"
							className="btn btn-sm btn-primary"
							disabled={saving}
						>
							Save lineup
						</button>
					</form>
				) : null}

				<details className="squad-player-details">
					<summary>Player details & actions</summary>
					<div className="squad-player-expanded">
						<div>
							<ContractSchedule p={p} />
							{salaryCapType !== "none" && salaryCap > 0 ? (
								<div>
									{(((p.contract.amount * 1000) / salaryCap) * 100).toFixed(1)}%
									of salary cap
								</div>
							) : null}
							{p.untradableMsg ? <div>{p.untradableMsg}</div> : null}
						</div>
						{p.mood ? (
							<div>
								<span className="text-body-secondary">Renewal interest</span>
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
		);
	};

	return (
		<section aria-label="Rotation" className="squad-view mb-4">
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

			<p
				ref={status}
				tabIndex={-1}
				className={notice?.error ? "squad-notice text-danger" : "squad-notice"}
				role="status"
			>
				{notice?.text}
			</p>

			{groups.map(({ title, rows }) =>
				rows.length > 0 ? (
					<section className="squad-group" key={title} aria-label={title}>
						<h3>{title}</h3>
						<div className="squad-list">{rows.map(renderPlayer)}</div>
					</section>
				) : null,
			)}

			{visible.length === 0 ? (
				<p className="squad-empty" role="status">
					{players.length === 0
						? "There are no players on this roster."
						: "No players match these filters. Try another situation or clear your search."}
				</p>
			) : null}
		</section>
	);
};

export default Overview;
