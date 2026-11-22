import { useRef, useState } from "react";
import FinancialDetails from "./FinancialDetails.tsx";
import { PHASE } from "../../../common/constants.ts";
import { tradeNegotiationKey } from "../../../common/tradeNegotiation.ts";
import type { TradeNegotiationFeedback } from "../../../worker/core/trade/makeItWorkTrade.ts";
import useTitleBar from "../../hooks/useTitleBar.tsx";
import { helpers } from "../../util/helpers.ts";
import { toWorker } from "../../util/toWorker.ts";
import { useLocal } from "../../util/local.ts";
import AssetSelector from "./AssetSelector.tsx";
import Buttons from "./Buttons.tsx";
import type { TradeClearType } from "./Buttons.tsx";
import NegotiationFeedback from "./NegotiationFeedback.tsx";
import Summary from "./Summary.tsx";
import type { TradeTeams, View } from "../../../common/types.ts";
import clsx from "clsx";
import { SaveTrade } from "../../components/SaveTrade.tsx";
import { showUndoNotification } from "../../components/UndoNotification.tsx";

export type HandleToggle = (
	userOrOther: "other" | "user",
	playerOrPick: "pick" | "player",
	includeOrExclude: "include" | "exclude",
	id: number,
) => Promise<void>;

const TradeSideText = ({
	boldNothing,
	numPicks,
	numPlayers,
}: {
	boldNothing?: boolean;
	numPicks: number;
	numPlayers: number;
}) => {
	if (numPlayers === 0 && numPicks === 0) {
		if (boldNothing) {
			return <b className="text-danger">nothing</b>;
		}
		return "nothing";
	}

	if (numPlayers === 0) {
		return `${numPicks} ${helpers.plural("pick", numPicks)}`;
	}

	if (numPicks === 0) {
		return `${numPlayers} ${helpers.plural("player", numPlayers)}`;
	}

	return `${numPlayers} ${helpers.plural("player", numPlayers)} and ${numPicks} ${helpers.plural("pick", numPicks)}`;
};

const Trade = (props: View<"trade">) => {
	const [state, setState] = useState({
		accepted: false,
		asking: false,
		feedback: null as TradeNegotiationFeedback | null,
		forceTrade: false,
		message: null as string | null,
	});
	const asking = useRef(false);

	const clearFeedback = () => {
		setState((prevState) => ({
			...prevState,
			accepted: false,
			feedback: null,
			message: null,
		}));
	};

	const handleChangeAsset: HandleToggle = async (
		userOrOther: "other" | "user",
		playerOrPick: "pick" | "player",
		includeOrExclude: "include" | "exclude",
		id: number,
	) => {
		if (asking.current) {
			return;
		}
		clearFeedback();
		const ids = {
			"user-pids": props.userPids,
			"user-pids-excluded": props.userPidsExcluded,
			"user-dpids": props.userDpids,
			"user-dpids-excluded": props.userDpidsExcluded,
			"other-pids": props.otherPids,
			"other-pids-excluded": props.otherPidsExcluded,
			"other-dpids": props.otherDpids,
			"other-dpids-excluded": props.otherDpidsExcluded,
		};
		const idType = playerOrPick === "player" ? "pids" : "dpids";
		const excluded = includeOrExclude === "exclude" ? "-excluded" : "";
		const key = `${userOrOther}-${idType}${excluded}` as keyof typeof ids;

		if (ids[key].includes(id)) {
			ids[key] = ids[key].filter((currId) => currId !== id);
		} else {
			ids[key] = [...ids[key], id];
		}

		const teams = [
			{
				tid: userTid,
				pids: ids["user-pids"],
				pidsExcluded: ids["user-pids-excluded"],
				dpids: ids["user-dpids"],
				dpidsExcluded: ids["user-dpids-excluded"],
			},
			{
				tid: props.otherTid,
				pids: ids["other-pids"],
				pidsExcluded: ids["other-pids-excluded"],
				dpids: ids["other-dpids"],
				dpidsExcluded: ids["other-dpids-excluded"],
			},
		] as TradeTeams;
		await toWorker("main", "updateTrade", teams);
	};

	const handleBulk = async (
		type: "check" | "clear",
		userOrOther: "other" | "user",
		playerOrPick: "pick" | "player",
		draftRoundOnly?: number,
	) => {
		if (asking.current) {
			return;
		}
		clearFeedback();

		const ids = {
			"user-pids": props.userPids,
			"user-pids-excluded": props.userPidsExcluded,
			"user-dpids": props.userDpids,
			"user-dpids-excluded": props.userDpidsExcluded,
			"other-pids": props.otherPids,
			"other-pids-excluded": props.otherPidsExcluded,
			"other-dpids": props.otherDpids,
			"other-dpids-excluded": props.otherDpidsExcluded,
		};
		const idType = playerOrPick === "player" ? "pids" : "dpids";
		const key = `${userOrOther}-${idType}-excluded` as keyof typeof ids;

		if (type === "clear") {
			ids[key] = [];
		} else if (playerOrPick === "player") {
			const players = userOrOther === "other" ? otherRoster : userRoster;
			ids[key] = players.map((p) => p.pid);
		} else {
			let picks = userOrOther === "other" ? otherPicks : userPicks;
			if (draftRoundOnly !== undefined) {
				picks = picks.filter((dp) => dp.round === draftRoundOnly);
			}
			ids[key] = Array.from(
				new Set([...ids[key], ...picks.map((dp) => dp.dpid)]),
			);
		}

		const teams: TradeTeams = [
			{
				tid: userTid,
				pids: ids["user-pids"],
				pidsExcluded: ids["user-pids-excluded"],
				dpids: ids["user-dpids"],
				dpidsExcluded: ids["user-dpids-excluded"],
			},
			{
				tid: props.otherTid,
				pids: ids["other-pids"],
				pidsExcluded: ids["other-pids-excluded"],
				dpids: ids["other-dpids"],
				dpidsExcluded: ids["other-dpids-excluded"],
			},
		];
		await toWorker("main", "updateTrade", teams);
	};

	const handleChangeTeam = async (tid: number) => {
		if (asking.current) {
			return;
		}
		clearFeedback();

		const teams: TradeTeams = [
			{
				tid: userTid,
				pids: props.userPids,
				pidsExcluded: props.userPidsExcluded,
				dpids: props.userDpids,
				dpidsExcluded: props.userDpidsExcluded,
			},
			{
				tid,
				pids: [],
				pidsExcluded: [],
				dpids: [],
				dpidsExcluded: [],
			},
		];

		await toWorker("main", "createTrade", teams);
	};

	const handleClickAsk = async () => {
		if (asking.current) {
			return;
		}
		asking.current = true;
		setState((prevState) => ({
			...prevState,
			accepted: false,
			asking: true,
			feedback: null,
			message: null,
		}));

		try {
			const result = await toWorker("main", "tradeCounterOffer", undefined);
			setState((prevState) => ({
				...prevState,
				feedback: result.status === "stale" ? null : result,
				message:
					result.status === "stale"
						? "The offer changed during the search. Ask again for the current offer."
						: null,
			}));
		} catch {
			setState((prevState) => ({
				...prevState,
				message: "GM feedback is unavailable. Try asking again.",
			}));
		} finally {
			asking.current = false;
			setState((prevState) => ({ ...prevState, asking: false }));
		}
	};

	const handleClickClear = async (type: TradeClearType) => {
		if (asking.current) {
			return;
		}
		clearFeedback();
		await toWorker("main", "clearTrade", type);
	};

	const handleClickForceTrade = () => {
		setState((prevState) => ({
			...prevState,
			forceTrade: !prevState.forceTrade,
		}));
	};

	const {
		otherTeamsWantToHire,
		lost,
		multiTeamMode,
		numDraftRounds,
		otherPicks,
		otherRoster,
		otherTid,
		otl,
		summary,
		stats,
		strategy,
		teams,
		tied,
		userPicks,
		userRoster,
		userTeamName,
		won,
		userDpids,
		userPids,
		otherDpids,
		otherPids,
		resetMessage,
	} = props;

	const handleClickPropose = async () => {
		if (asking.current) {
			return;
		}
		const { accepted, message, undoKey } = await toWorker(
			"main",
			"proposeTrade",
			state.forceTrade,
		);

		setState((prevState) => ({
			...prevState,
			accepted,
			feedback: null,
			message,
		}));

		if (undoKey !== undefined) {
			showUndoNotification({
				actionName: "trade",
				undoKey,
				title: (
					<>
						You traded{" "}
						<TradeSideText
							numPicks={userDpids.length}
							numPlayers={userPids.length}
						/>{" "}
						for{" "}
						<TradeSideText
							boldNothing
							numPicks={otherDpids.length}
							numPlayers={otherPids.length}
						/>
					</>
				),
			});
		}
	};

	useTitleBar({
		title: "Trade",
	});

	if (resetMessage && (state.message !== null || state.feedback !== null)) {
		clearFeedback();
	}

	const {
		challengeNoRatings,
		challengeNoTrades,
		gameOver,
		phase,
		spectator,
		userTid,
	} = useLocal([
		"challengeNoRatings",
		"challengeNoTrades",
		"gameOver",
		"phase",
		"spectator",
		"userTid",
	]);

	const noTradingAllowed =
		(phase >= PHASE.AFTER_TRADE_DEADLINE && phase <= PHASE.PLAYOFFS) ||
		phase === PHASE.FANTASY_DRAFT ||
		phase === PHASE.EXPANSION_DRAFT ||
		gameOver ||
		otherTeamsWantToHire ||
		spectator ||
		challengeNoTrades;

	const numAssets =
		summary.teams[0].picks.length +
		summary.teams[0].trade.length +
		summary.teams[1].picks.length +
		summary.teams[1].trade.length;

	const otherTeamIndex = teams.findIndex((t) => t.tid === otherTid);

	const otherTeam = teams[otherTeamIndex];
	const otherTeamName = otherTeam
		? `${otherTeam.region} ${otherTeam.name}`
		: "Other team";
	const teamNames = [otherTeamName, userTeamName] as [string, string];
	const currentOffer: TradeTeams = [
		{
			tid: userTid,
			pids: userPids,
			dpids: userDpids,
			pidsExcluded: props.userPidsExcluded,
			dpidsExcluded: props.userDpidsExcluded,
		},
		{
			tid: otherTid,
			pids: otherPids,
			dpids: otherDpids,
			pidsExcluded: props.otherPidsExcluded,
			dpidsExcluded: props.otherDpidsExcluded,
		},
	];
	const feedback =
		state.feedback?.offerKey === tradeNegotiationKey(currentOffer)
			? state.feedback
			: null;
	const previousTeams =
		feedback?.status === "counteroffer" ? feedback.previousTeams : undefined;
	const handleUndoCounteroffer = async () => {
		if (asking.current || !previousTeams) {
			return;
		}
		await toWorker("main", "updateTrade", previousTeams);
		clearFeedback();
	};

	return (
		<>
			<div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
				<div className="btn-group">
					<button
						className="btn btn-light-bordered btn-xs"
						disabled={state.asking || otherTeamIndex <= 0}
						onClick={() => {
							handleChangeTeam(teams[otherTeamIndex - 1]!.tid);
						}}
						title="Previous"
					>
						<span className="glyphicon glyphicon-menu-left" />
					</button>
					<button
						className="btn btn-light-bordered btn-xs"
						disabled={state.asking || otherTeamIndex >= teams.length - 1}
						onClick={() => {
							handleChangeTeam(teams[otherTeamIndex + 1]!.tid);
						}}
						title="Next"
					>
						<span className="glyphicon glyphicon-menu-right" />
					</button>
				</div>
				<select
					aria-label="Trading partner"
					className="form-select select-team flex-shrink-1"
					disabled={state.asking}
					value={otherTid}
					onChange={(event) => {
						handleChangeTeam(Number.parseInt(event.currentTarget.value));
					}}
				>
					{teams.map((t) => (
						<option key={t.tid} value={t.tid}>
							{t.region} {t.name}
						</option>
					))}
				</select>
				<div className="small text-body-secondary">
					{won}-{lost}
					{otl > 0 ? <>-{otl}</> : null}
					{tied > 0 ? <>-{tied}</> : null}, {strategy}
				</div>
				<SaveTrade
					className="ms-auto"
					tradeTeams={[
						{
							pids: userPids,
							dpids: userDpids,
							tid: userTid,
						},
						{
							pids: otherPids,
							dpids: otherDpids,
							tid: otherTid,
						},
					]}
				/>
			</div>
			<section
				id="trade-proposal"
				className="card mb-4"
				aria-label="Trade proposal"
				style={{ scrollMarginTop: 70 }}
			>
				<div className="card-body">
					<div className="d-flex flex-wrap justify-content-between gap-2 mb-3">
						<h2 className="h4 mb-0">Proposed exchange</h2>
						<span className="small text-body-secondary">
							{numAssets} assets selected
						</span>
					</div>
					<fieldset disabled={state.asking}>
						<Summary
							handleToggle={handleChangeAsset}
							prevTeams={previousTeams}
							summary={summary}
						/>
					</fieldset>
					{summary.ownerImpact && !state.accepted ? (
						<details className="owner-trade-view">
							<summary
								className={
									summary.ownerImpact.concerns.length
										? "text-warning-emphasis"
										: undefined
								}
							>
								Owner:{" "}
								{summary.ownerImpact.concerns.length
									? `${summary.ownerImpact.concerns.length} conflict(s) with the ${summary.ownerImpact.mode === "rebuild" ? "rebuilding" : "compete-now"} mandate`
									: "no explicit instruction breached"}
							</summary>
							<ul>
								{[
									...summary.ownerImpact.concerns,
									...summary.ownerImpact.positives,
								].map((text) => (
									<li key={text}>{text}</li>
								))}
							</ul>
							<a href={helpers.leagueUrl(["team_finances"]) + "#ownership"}>
								Read the mandate & decision journal
							</a>
						</details>
					) : null}
					{summary.warning ? (
						<div className="alert alert-danger py-2 mb-2 small" role="alert">
							<strong>Cannot propose:</strong> {summary.warning}
						</div>
					) : null}
					{feedback ? (
						<NegotiationFeedback
							feedback={feedback}
							hasExclusions={currentOffer.some(
								(offer) =>
									offer.pidsExcluded.length > 0 ||
									offer.dpidsExcluded.length > 0,
							)}
							onUndo={handleUndoCounteroffer}
							otherTeamName={otherTeamName}
							otherPicks={otherPicks}
							otherRoster={otherRoster}
							userPicks={userPicks}
							userRoster={userRoster}
						/>
					) : null}
					{state.message ? (
						<div
							className={clsx(
								"alert mb-0",
								state.accepted ? "alert-success" : "alert-info",
								{
									"mt-2": summary.warning,
								},
							)}
							role="status"
						>
							{state.message}
						</div>
					) : null}

					<div
						className={clsx({
							"trade-extra-margin-bottom": multiTeamMode,
							"mt-3": summary.warning || state.message || feedback,
						})}
					>
						{!noTradingAllowed ? (
							<div className="text-center">
								<Buttons
									asking={state.asking}
									enablePropose={summary.enablePropose}
									forceTrade={state.forceTrade}
									handleClickAsk={handleClickAsk}
									handleClickClear={handleClickClear}
									handleClickForceTrade={handleClickForceTrade}
									handleClickPropose={handleClickPropose}
									numAssets={numAssets}
									teamNames={teamNames}
								/>
							</div>
						) : challengeNoTrades ? (
							<p className="alert alert-danger">
								<b>Challenge Mode:</b> You're not allowed to make trades.
							</p>
						) : spectator ? (
							<p className="alert alert-danger">
								You're not allowed to make trades in spectator mode.
							</p>
						) : otherTeamsWantToHire ? (
							<p className="alert alert-danger">
								You're not allowed to make trades while you have{" "}
								<a href={helpers.leagueUrl(["new_team"])}>
									open job offers from other teams
								</a>
								.
							</p>
						) : (
							<p className="alert alert-danger">
								You're not allowed to make trades{" "}
								{phase === PHASE.AFTER_TRADE_DEADLINE
									? "after the trade deadline"
									: "now"}
								.
							</p>
						)}
					</div>
					{numAssets > 0 ? (
						<FinancialDetails summary={summary} />
					) : (
						<p className="small text-body-secondary mb-0 mt-3">
							Choose players or draft picks below to build your offer.
						</p>
					)}
				</div>
			</section>
			<div className="row gx-3 gy-4">
				<section className="col-12 col-xl-6" aria-label="Your trade assets">
					<h2 className="h4">Send from {userTeamName}</h2>
					<a href="#trade-proposal" className="small d-inline-block mb-2">
						Review offer ({numAssets} assets)
					</a>
					<fieldset disabled={state.asking}>
						<AssetSelector
							challengeNoRatings={challengeNoRatings}
							handleBulk={handleBulk}
							handleToggle={handleChangeAsset}
							numDraftRounds={numDraftRounds}
							picks={userPicks}
							roster={userRoster}
							stats={stats}
							userOrOther="user"
						/>
					</fieldset>
				</section>
				<section
					className="col-12 col-xl-6"
					aria-label="Partner trade assets"
					key={otherTid}
				>
					<h2 className="h4">Request from {otherTeamName}</h2>
					<a href="#trade-proposal" className="small d-inline-block mb-2">
						Review offer ({numAssets} assets)
					</a>
					<fieldset disabled={state.asking}>
						<AssetSelector
							challengeNoRatings={challengeNoRatings}
							handleBulk={handleBulk}
							handleToggle={handleChangeAsset}
							numDraftRounds={numDraftRounds}
							picks={otherPicks}
							roster={otherRoster}
							stats={stats}
							userOrOther="other"
						/>
					</fieldset>
				</section>
			</div>
		</>
	);
};

export default Trade;
