import { useState, type ComponentProps } from "react";
import AssetList from "./AssetList.tsx";
import { PlayerPicture } from "../../components/PlayerPicture.tsx";
import { PlayerNameLabels } from "../../components/PlayerNameLabels.tsx";
import { Contract, ContractSchedule } from "../../components/contract.tsx";
import { SafeHtml } from "../../components/SafeHtml.tsx";
import { helpers } from "../../util/helpers.ts";

const AssetSelector = (props: ComponentProps<typeof AssetList>) => {
	const [tab, setTab] = useState<"players" | "picks" | "table">("players");
	const [query, setQuery] = useState("");
	if (__SPORT !== "basketball") {
		return <AssetList {...props} />;
	}
	const { roster, picks, handleToggle, userOrOther, challengeNoRatings } =
		props;
	const filtered = roster.filter((p) =>
		`${p.firstName} ${p.lastName} ${p.ratings.pos}`
			.toLowerCase()
			.includes(query.trim().toLowerCase()),
	);
	const tabs = [
		[
			"players",
			`Players (${roster.filter((p) => p.included).length}/${roster.length})`,
		],
		[
			"picks",
			`Draft picks (${picks.filter((p) => p.included).length}/${picks.length})`,
		],
		["table", "Full table"],
	] as const;
	return (
		<>
			<div
				className="d-flex flex-wrap gap-2 mb-3"
				role="group"
				aria-label="Asset display"
			>
				{tabs.map(([key, label]) => (
					<button
						key={key}
						type="button"
						className={`btn btn-sm ${tab === key ? "btn-primary" : "btn-light-bordered"}`}
						aria-pressed={tab === key}
						onClick={() => setTab(key)}
					>
						{label}
					</button>
				))}
			</div>
			{tab === "table" ? (
				<AssetList {...props} />
			) : tab === "players" ? (
				<>
					<input
						type="search"
						className="form-control form-control-sm mb-3"
						placeholder="Find a player or position…"
						aria-label="Find trade players"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
					/>
					<div className="d-flex flex-column gap-2">
						{filtered.map((p) => {
							const name = `${p.firstName} ${p.lastName}`;
							return (
								<article
									className={`card ${p.included ? "border-primary" : ""}`}
									key={p.pid}
									aria-label={name}
								>
									<div className="card-body p-3">
										<div className="d-flex gap-3">
											<div
												className="flex-shrink-0 bg-body-tertiary rounded"
												style={{ width: 48, height: 72 }}
												aria-hidden="true"
											>
												<PlayerPicture face={p.face} imgURL={p.imgURL} lazy />
											</div>
											<div className="flex-grow-1" style={{ minWidth: 0 }}>
												<div
													className="fw-bold"
													style={{ overflowWrap: "anywhere" }}
												>
													<PlayerNameLabels
														pid={p.pid}
														firstName={p.firstName}
														lastName={p.lastName}
														fullNames
														injury={p.injury}
														defaultWatch={p.watch}
														skills={
															challengeNoRatings ? undefined : p.ratings.skills
														}
														neverShowCountry
													/>
												</div>
												<div className="small text-body-secondary">
													{p.ratings.pos} · Age {p.age}
													{!challengeNoRatings
														? ` · ${p.ratings.ovr} OVR / ${p.ratings.pot} POT`
														: ""}
												</div>
												<div className="small fw-semibold mt-1">
													<Contract p={p} />
												</div>
												<ContractSchedule p={p} />
												{(p.stats.gp ?? 0) > 0 ? (
													<div className="small text-body-secondary">
														{helpers.roundStat(p.stats.pts, "pts")} PTS ·{" "}
														{helpers.roundStat(p.stats.trb, "trb")} REB ·{" "}
														{helpers.roundStat(p.stats.ast, "ast")} AST
													</div>
												) : null}
											</div>
										</div>
										{p.untradable ? (
											<div className="small text-warning-emphasis mt-2">
												{p.untradableMsg ?? "Currently unavailable for trades"}
											</div>
										) : null}
										<div className="d-flex flex-wrap align-items-center gap-3 mt-2">
											<button
												type="button"
												className={`btn btn-sm ${p.included ? "btn-primary" : "btn-light-bordered"}`}
												aria-label={`${p.included ? "Remove" : "Add"} ${name}`}
												aria-pressed={p.included}
												disabled={p.untradable && !p.included}
												onClick={() =>
													handleToggle(userOrOther, "player", "include", p.pid)
												}
											>
												{p.included ? "Selected · Remove" : "Add to offer"}
											</button>
											<label className="small mb-0">
												<input
													type="checkbox"
													className="form-check-input me-1"
													aria-label={`Exclude ${name} from counteroffers`}
													checked={p.excluded || p.untradable}
													disabled={p.untradable}
													onChange={() =>
														handleToggle(
															userOrOther,
															"player",
															"exclude",
															p.pid,
														)
													}
												/>
												Keep out of counteroffers
											</label>
										</div>
									</div>
								</article>
							);
						})}
					</div>
					{filtered.length === 0 ? (
						<p className="text-body-secondary" role="status">
							No players match your search.
						</p>
					) : null}
				</>
			) : (
				<div className="d-flex flex-column gap-2">
					{picks.map((pick) => (
						<article
							className={`card ${pick.included ? "border-primary" : ""}`}
							key={pick.dpid}
							aria-label={`${pick.season} round ${pick.round} pick ${pick.dpid}`}
						>
							<div className="card-body p-3">
								<div className="fw-semibold">
									<SafeHtml dirty={pick.desc} />
								</div>
								<div className="d-flex flex-wrap align-items-center gap-3 mt-2">
									<button
										type="button"
										className={`btn btn-sm ${pick.included ? "btn-primary" : "btn-light-bordered"}`}
										aria-label={`${pick.included ? "Remove" : "Add"} pick ${pick.dpid}`}
										aria-pressed={pick.included}
										onClick={() =>
											handleToggle(userOrOther, "pick", "include", pick.dpid)
										}
									>
										{pick.included ? "Selected · Remove" : "Add to offer"}
									</button>
									<label className="small mb-0">
										<input
											type="checkbox"
											className="form-check-input me-1"
											aria-label={`Exclude pick ${pick.dpid} from counteroffers`}
											checked={pick.excluded}
											onChange={() =>
												handleToggle(userOrOther, "pick", "exclude", pick.dpid)
											}
										/>
										Keep out of counteroffers
									</label>
								</div>
							</div>
						</article>
					))}
					{picks.length === 0 ? (
						<p className="text-body-secondary">
							No future draft picks available.
						</p>
					) : null}
				</div>
			)}
		</>
	);
};

export default AssetSelector;
