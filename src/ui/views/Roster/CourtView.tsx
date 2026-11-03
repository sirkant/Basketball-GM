import { PHASE } from "../../../common/constants.ts";
import CoachReport from "./CoachReport.tsx";
import { useRef, useState } from "react";
import {
	assignCourtSlots,
	COURT_POSITIONS,
	FIT_LABELS,
	getListedPositions,
	ROLE_NAMES,
	type CourtPosition,
	type PositionProfiles,
} from "../../../common/basketballPositions.ts";
import type { View } from "../../../common/types.ts";
import { PlayerPicture } from "../../components/PlayerPicture.tsx";
import { Contract, ContractSchedule } from "../../components/contract.tsx";
import { helpers } from "../../util/helpers.ts";
import { useLocal } from "../../util/local.ts";

type RosterPlayer = View<"roster">["players"][number];
const roleTasks: Record<CourtPosition, string> = {
	PG: "Organize the offense. Handle pressure, create advantages and find teammates.",
	SG: "Stretch the floor. Attack closeouts and defend the perimeter.",
	SF: "Connect the lineup. Space the floor, defend wings and attack mismatches.",
	PF: "Balance size and mobility. Finish inside, rebound and support the interior defense.",
	C: "Anchor the paint. Protect the rim, finish inside and control the glass.",
};

const CourtView = ({
	players,
	positionProfiles,
	coachReport,
	editable,
	onMakeStarter,
}: Pick<
	View<"roster">,
	"players" | "positionProfiles" | "editable" | "coachReport"
> & {
	onMakeStarter: (starterPid: number, benchPid: number) => Promise<void>;
}) => {
	const { challengeNoRatings, season, phase, salaryCap, salaryCapType } =
		useLocal([
			"challengeNoRatings",
			"season",
			"phase",
			"salaryCap",
			"salaryCapType",
		]);
	const contractYear = season + (phase > PHASE.PLAYOFFS ? 1 : 0);
	const duration = (p: RosterPlayer) =>
		p.contract.exp < contractYear
			? "Renewal pending"
			: `${p.contract.exp - contractYear + 1} yr${p.contract.exp === contractYear ? " · Expiring" : " left"}`;
	const production = (p: RosterPlayer) =>
		p.stats.gp > 0
			? `${helpers.roundStat(p.stats.pts, "pts")} PTS · ${helpers.roundStat(p.stats.trb, "trb")} REB · ${helpers.roundStat(p.stats.ast, "ast")} AST`
			: "No games played";
	const starterSalary = players
		.slice(0, 5)
		.reduce((sum, p) => sum + p.contract.amount, 0);
	const [selected, setSelected] = useState<CourtPosition>("PG");
	const [search, setSearch] = useState("");
	const [pending, setPending] = useState(false);
	const [notice, setNotice] = useState("");
	const [error, setError] = useState("");
	const depthPanel = useRef<HTMLDivElement>(null);
	const selectPosition = (role: CourtPosition, fromCourt = false) => {
		setSelected(role);
		setNotice("");
		setError("");
		if (fromCourt && window.matchMedia("(max-width: 1050px)").matches) {
			requestAnimationFrame(() => {
				depthPanel.current?.scrollIntoView({
					behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
						.matches
						? "instant"
						: "smooth",
					block: "start",
				});
				depthPanel.current?.focus({ preventScroll: true });
			});
		}
	};
	const profiles: PositionProfiles | undefined = challengeNoRatings
		? undefined
		: positionProfiles;
	const assignments = assignCourtSlots(players.slice(0, 5), profiles);
	const starter = assignments[selected];
	const starterPids = new Set(players.slice(0, 5).map((p) => p.pid));
	const getProfile = (p: RosterPlayer, role: CourtPosition) =>
		profiles?.[p.pid]?.find((row) => row.position === role);
	const getRoles = (p: RosterPlayer) => {
		const listed = getListedPositions(p.ratings.pos);
		const secondary = (profiles?.[p.pid] ?? [])
			.filter(
				(row) => row.fit === "comfortable" && !listed.includes(row.position),
			)
			.sort((a, b) => b.score - a.score)
			.map((row) => row.position);
		return [...listed, ...secondary].slice(0, 4);
	};
	const candidates = players
		.filter((p) =>
			`${p.firstName} ${p.lastName} ${p.ratings.pos}`
				.toLowerCase()
				.includes(search.trim().toLowerCase()),
		)
		.map((p, index) => ({ p, index, profile: getProfile(p, selected) }))
		.sort((a, b) => {
			if (profiles) {
				return (
					(b.profile?.score ?? 0) - (a.profile?.score ?? 0) || a.index - b.index
				);
			}
			return (
				Number(getListedPositions(b.p.ratings.pos).includes(selected)) -
					Number(getListedPositions(a.p.ratings.pos).includes(selected)) ||
				a.index - b.index
			);
		});
	return (
		<section
			className="basketball-roster"
			aria-label="Court and positional depth"
		>
			<div className="court-workspace">
				<div className="court-lineup-panel">
					<div className="court-panel-heading">
						<div>
							<span className="basketball-kicker">Rotation</span>
							<h3>Starting five</h3>
						</div>
						<span>Select a position</span>
					</div>
					<div className="basketball-halfcourt">
						<svg
							className="basketball-court-lines"
							viewBox="0 0 600 500"
							preserveAspectRatio="none"
							aria-hidden="true"
						>
							<rect x="18" y="14" width="564" height="472" />
							<path d="M230 14V180H370V14M60 14V110A240 240 0 0 0 540 110V14M220 486a80 80 0 0 1 160 0M267 35h66" />
							<circle cx="300" cy="52" r="12" />
							<circle cx="300" cy="180" r="70" strokeDasharray="5 5" />
						</svg>
						{COURT_POSITIONS.map((role) => {
							const p = assignments[role];
							const profile = p ? getProfile(p, role) : undefined;
							return (
								<button
									key={role}
									type="button"
									data-position={role}
									className={`court-player ${selected === role ? "selected" : ""}`}
									aria-label={`${role}: ${p ? `${p.firstName} ${p.lastName}` : "Vacant"}`}
									aria-pressed={selected === role}
									onClick={() => selectPosition(role, true)}
								>
									<span className="court-position">{role}</span>
									{p ? (
										<>
											<span className="court-player-name">
												{p.firstName} {p.lastName}
											</span>
											<span className="court-player-meta">
												Age {p.age}
												{!challengeNoRatings ? ` · ${p.ratings.ovr} OVR` : ""}
											</span>
											<span className="court-contract">
												<Contract p={p} />
												<span>{duration(p)}</span>
											</span>
											{profile ? (
												<span className="court-strengths">
													{profile.strengths.join(" · ") ||
														"No standout role strengths"}
												</span>
											) : null}
											<span className="court-production">{production(p)}</span>
											<span className="court-fit">
												{profile ? FIT_LABELS[profile.fit] : p.ratings.pos}
												{p.injury.gamesRemaining > 0
													? ` · Injured (${p.injury.gamesRemaining})`
													: ""}
											</span>
										</>
									) : (
										<span className="court-player-name">Vacant</span>
									)}
								</button>
							);
						})}
					</div>
					<p className="court-coaching-note">
						<strong>
							Starting five: {helpers.formatCurrency(starterSalary, "M")}
						</strong>{" "}
						{salaryCapType !== "none" && salaryCap > 0
							? `· ${(((starterSalary * 1000) / salaryCap) * 100).toFixed(1)}% of salary cap. `
							: ""}
						Your selected starters, arranged by projected role. The coach
						adjusts for injuries, fatigue and lineup balance during games.
					</p>
				</div>
				<div
					className="position-depth-panel"
					ref={depthPanel}
					tabIndex={-1}
					aria-labelledby="position-depth-heading"
				>
					<div className="court-panel-heading">
						<div>
							<span className="basketball-kicker">Positional depth</span>
							<h3 id="position-depth-heading">{ROLE_NAMES[selected]}</h3>
						</div>
						<span className="depth-position-mark">{selected}</span>
					</div>
					<p className="depth-role-description">{roleTasks[selected]}</p>
					<div
						className="depth-position-tabs"
						role="group"
						aria-label="Depth by position"
					>
						{COURT_POSITIONS.map((role) => (
							<button
								key={role}
								type="button"
								aria-pressed={selected === role}
								className={selected === role ? "active" : ""}
								onClick={() => selectPosition(role)}
							>
								{role}
							</button>
						))}
					</div>
					<label className="visually-hidden" htmlFor="depth-player-search">
						Find a player for this position
					</label>
					<input
						id="depth-player-search"
						type="search"
						className="form-control depth-search"
						placeholder="Find a player…"
						value={search}
						onChange={(event) => setSearch(event.target.value)}
					/>
					<div
						className="depth-candidates"
						aria-label={`${selected} candidates`}
					>
						{candidates.map(({ p, profile }) => (
							<article
								className={`depth-candidate ${starter?.pid === p.pid ? "at-position" : ""}`}
								key={p.pid}
								aria-label={`${p.firstName} ${p.lastName}`}
							>
								<div className="depth-candidate-heading">
									<div className="depth-portrait" aria-hidden="true">
										<PlayerPicture face={p.face} imgURL={p.imgURL} lazy />
									</div>
									<div className="depth-candidate-identity">
										<a href={helpers.leagueUrl(["player", p.pid])}>
											{p.firstName} {p.lastName}
										</a>
										<span>
											{getRoles(p).join(" / ") || p.ratings.pos} · Age {p.age}
											{!challengeNoRatings ? ` · OVR ${p.ratings.ovr}` : ""}
										</span>
									</div>
									<span
										className="position-fit"
										data-fit={profile?.fit ?? "unscouted"}
									>
										{profile
											? FIT_LABELS[profile.fit]
											: getListedPositions(p.ratings.pos).includes(selected)
												? "Listed role"
												: "Unscouted"}
									</span>
								</div>
								<div className="depth-player-intel">
									<div className="depth-contract">
										<strong>
											<Contract p={p} />
										</strong>
										<span>
											{duration(p)}
											{salaryCapType !== "none" && salaryCap > 0
												? ` · ${(((p.contract.amount * 1000) / salaryCap) * 100).toFixed(1)}% of cap`
												: ""}
										</span>
									</div>
									<div className="depth-production">
										<strong>{production(p)}</strong>
										<span>
											{p.stats.gp > 0
												? `${p.stats.gp} GP · ${helpers.roundStat(p.stats.min, "min")} MIN per game`
												: "Production appears after the first game"}
										</span>
									</div>
								</div>
								{profile ? (
									<p className="depth-strengths">
										<strong>Brings:</strong>{" "}
										{profile.strengths.join(" · ") ||
											"No standout scouted attributes for this role"}
										{profile.limitations.length ? (
											<span>
												<strong>Cover:</strong>{" "}
												{profile.limitations.join(" · ")}
											</span>
										) : null}
									</p>
								) : null}

								<div className="depth-candidate-footer">
									<span>
										{starter?.pid === p.pid
											? "On court here"
											: starterPids.has(p.pid)
												? "Starting five"
												: "Bench"}
										{p.injury.gamesRemaining > 0
											? ` · ${p.injury.type} (${p.injury.gamesRemaining} games)`
											: ""}
									</span>
									{editable && starter && !starterPids.has(p.pid) ? (
										<button
											type="button"
											className="btn btn-sm btn-light-bordered"
											disabled={pending}
											onClick={async () => {
												setPending(true);
												setNotice("");
												setError("");
												try {
													await onMakeStarter(starter.pid, p.pid);
													setNotice(
														`${p.firstName} ${p.lastName} added to the starting five.`,
													);
												} catch {
													setError(
														"The starting five could not be updated. Try again.",
													);
												} finally {
													setPending(false);
												}
											}}
										>
											Make starter
											<span className="visually-hidden">
												: {p.firstName} {p.lastName}
											</span>
										</button>
									) : null}
								</div>
								<details className="depth-fit-report">
									<summary>Player & fit report</summary>
									<div className="depth-fit-report-body">
										<ContractSchedule p={p} />
										{profile ? (
											<>
												<p>
													Strengths:{" "}
													{profile.strengths.join(", ") ||
														"No standout scouted attributes for this role"}
													.
												</p>
												{profile.limitations.length > 0 ? (
													<p>Watch: {profile.limitations.join(", ")}.</p>
												) : null}
												<div className="position-fit-list">
													{profiles?.[p.pid]?.map((row) => (
														<span key={row.position}>
															{row.position}{" "}
															<strong>{FIT_LABELS[row.fit]}</strong>
														</span>
													))}
												</div>
											</>
										) : (
											<p>
												Listed positions are available. Scouted fit estimates
												are hidden.
											</p>
										)}
									</div>
								</details>
							</article>
						))}
						{candidates.length === 0 ? (
							<p className="depth-empty" role="status">
								No players match this search.
							</p>
						) : null}
					</div>
					{notice ? (
						<p role="status" className="depth-update-notice">
							{notice}
						</p>
					) : null}
					{error ? (
						<p role="alert" className="text-danger">
							{error}
						</p>
					) : null}
				</div>
			</div>
			{coachReport && !challengeNoRatings ? (
				<CoachReport report={coachReport} />
			) : null}
			<details className="position-method">
				<summary>How positional fit works</summary>
				<p>
					Listed roles include hybrid positions. Strong fit, Situational and
					Emergency are scouting estimates from handling, passing, shooting,
					size, mobility, defense and rebounding. Players can cover several
					roles with different strengths and limitations. These labels describe
					role suitability; they are not efficiency percentages. Game outcomes
					also depend on teammates, lineup balance, fatigue and injuries. Make
					starter changes the actual selected five; role placement on this board
					is a projection.
				</p>
			</details>
		</section>
	);
};

export default CourtView;
