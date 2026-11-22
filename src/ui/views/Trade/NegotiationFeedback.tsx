import type { View } from "../../../common/types.ts";
import type { TradeNegotiationFeedback } from "../../../worker/core/trade/makeItWorkTrade.ts";
import { SafeHtml } from "../../components/SafeHtml.tsx";

const NegotiationFeedback = ({
	feedback,
	hasExclusions,
	onUndo,
	otherPicks,
	otherRoster,
	otherTeamName,
	userPicks,
	userRoster,
}: Pick<
	View<"trade">,
	"otherPicks" | "otherRoster" | "userPicks" | "userRoster"
> & {
	feedback: TradeNegotiationFeedback;
	hasExclusions: boolean;
	onUndo: () => Promise<void>;
	otherTeamName: string;
}) => {
	return (
		<section className="alert alert-info mb-0" aria-label="GM feedback">
			<div role="status">
				<p className="fw-semibold mb-1">{otherTeamName} GM</p>
				{feedback.status === "counteroffer" ? (
					<>
						<p className="mb-1">Suggested changes to the offer</p>
						<ul className="mb-2">
							{feedback.changes.map(({ action, id, side, type }) => {
								const roster = side === 0 ? userRoster : otherRoster;
								const picks = side === 0 ? userPicks : otherPicks;
								const player =
									type === "player" && roster.find((p) => p.pid === id);
								const pick =
									type === "pick" && picks.find((dp) => dp.dpid === id);
								return (
									<li key={`${side}-${type}-${id}`}>
										{action === "added" ? "Added" : "Removed"}{" "}
										{player ? (
											`${player.firstName} ${player.lastName}`
										) : pick ? (
											<SafeHtml dirty={pick.desc} />
										) : (
											`a ${type === "pick" ? "draft pick" : "player"}`
										)}{" "}
										{action === "added" ? "to" : "from"}{" "}
										{side === 0 ? "what you send" : "what you receive"}.
									</li>
								);
							})}
						</ul>
					</>
				) : feedback.status === "unchanged" ? (
					<p className="mb-0">The current package meets the GM’s valuation.</p>
				) : (
					<>
						<p className="mb-1">
							No counteroffer found. The GM’s valuation is unclear.
						</p>
						{!feedback.warning ? (
							<p className="mb-0">
								{hasExclusions
									? "Try asking for less or make an excluded asset available, then ask again."
									: "Try asking for fewer assets or add a player or pick you can part with, then ask again."}
							</p>
						) : null}
					</>
				)}
				{feedback.warning ? (
					<p className="mb-0">
						{feedback.status === "noDeal"
							? "Address the trade rule above, then ask again."
							: "The package still breaks a trade rule. Address the warning above before proposing it."}
					</p>
				) : null}
			</div>
			{feedback.status === "counteroffer" ? (
				<div className="mt-2 text-end">
					<button
						type="button"
						className="btn btn-secondary btn-sm"
						onClick={onUndo}
					>
						Undo counteroffer
					</button>
				</div>
			) : null}
		</section>
	);
};

export default NegotiationFeedback;
