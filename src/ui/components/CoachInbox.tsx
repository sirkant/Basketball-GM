import { useState } from "react";
import type { Message } from "../../common/types.ts";
import { helpers } from "../util/helpers.ts";
import { useLocal } from "../util/local.ts";
import { toWorker } from "../util/toWorker.ts";
import { realtimeUpdate } from "../util/realtimeUpdate.ts";

export const AskCoach = () => {
	const { spectator, challengeNoRatings } = useLocal([
		"spectator",
		"challengeNoRatings",
	]);
	const [pending, setPending] = useState(false),
		[feedback, setFeedback] = useState("");
	return (
		<div className="coach-inbox-action">
			<button
				type="button"
				className="btn btn-primary btn-sm"
				disabled={pending || spectator || challengeNoRatings}
				onClick={async () => {
					setPending(true);
					setFeedback("");
					try {
						const mid = await toWorker("main", "requestCoachReport", undefined);
						if (mid === undefined) {
							setFeedback(
								"A coach assessment is not available for the current team or mode.",
							);
						} else {
							await realtimeUpdate(
								["firstRun"],
								helpers.leagueUrl(["message", mid]),
							);
						}
					} catch (error) {
						setFeedback(error.message);
					} finally {
						setPending(false);
					}
				}}
			>
				{pending ? "Preparing report…" : "Ask coach for an assessment"}
			</button>
			{feedback ? <span role="status">{feedback}</span> : null}
			{challengeNoRatings ? (
				<span>Scouting reports are hidden in this challenge.</span>
			) : null}
		</div>
	);
};

export const CoachMessageContext = ({
	message,
}: {
	message: Message & { coachFollowupMid?: number };
}) => {
	const { season, userTid, spectator } = useLocal([
		"season",
		"userTid",
		"spectator",
	]);
	const [pending, setPending] = useState(false),
		[feedback, setFeedback] = useState("");
	const memo = message.coach;
	if (!memo) {
		return null;
	}
	const request = memo.request;
	const current =
		message.year === season && message.tid === userTid && !spectator;
	const respond = async (decision: "prioritize" | "decline") => {
		setPending(true);
		setFeedback("");
		try {
			await toWorker("main", "respondCoachRequest", {
				mid: message.mid,
				decision,
			});
			await realtimeUpdate(["firstRun"]);
		} catch (error) {
			setFeedback(error.message);
		} finally {
			setPending(false);
		}
	};
	return (
		<aside className="coach-message-context" aria-label="Coach briefing">
			<div className="dossier-eyebrow">
				{memo.kind === "playoff"
					? "PLAYOFF GAME PREPARATION"
					: "ROSTER PLANNING"}{" "}
				· ADVISORY
			</div>
			<p>
				Prepared after {memo.gamesPlayed} regular-season games.{" "}
				{memo.kind === "playoff"
					? "This is the pregame scouting picture, not a prediction of the result."
					: "The coach's assessment uses the same current-roster grades as Power Rankings."}
			</p>
			{request ? (
				<>
					<div className="coach-request-target">
						<strong>{request.label}</strong>
						<span>
							Issued at #{request.baselineRank} · target #{request.targetRank}{" "}
							or better
							{request.reviewedRank !== undefined
								? ` · reviewed at #${request.reviewedRank}`
								: ""}
						</span>
					</div>
					<p className="coach-request-status">
						{request.resolved
							? "Target met in the latest staff review."
							: request.decision === "prioritize"
								? "You made this a roster priority. We will review coverage as the season develops."
								: request.decision === "decline"
									? "You chose to keep the current plan."
									: "The coach is asking you to consider this roster priority."}
					</p>
					{current &&
					!request.resolved &&
					request.supersededBy === undefined ? (
						<div className="d-flex flex-wrap gap-2">
							<button
								type="button"
								className="btn btn-primary btn-sm"
								disabled={pending || request.decision === "prioritize"}
								onClick={() => respond("prioritize")}
							>
								Make this a roster priority
							</button>
							<button
								type="button"
								className="btn btn-light-bordered btn-sm"
								disabled={pending || request.decision === "decline"}
								onClick={() => respond("decline")}
							>
								Keep current plan
							</button>
						</div>
					) : null}
					{request.supersededBy !== undefined ? (
						<p>
							<a
								href={helpers.leagueUrl(
									message.coachFollowupMid !== undefined
										? ["message", message.coachFollowupMid]
										: ["inbox"],
								)}
							>
								Open the latest assessment →
							</a>
						</p>
					) : null}
					<small>
						{current
							? "This records your priority. You decide which lineup or roster moves to make."
							: "Archived request: responses apply only to your current team and season."}
					</small>
				</>
			) : null}
			{feedback ? <p role="alert">{feedback}</p> : null}
		</aside>
	);
};
