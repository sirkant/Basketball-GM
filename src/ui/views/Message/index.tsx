import OwnerMoodsChart from "./OwnerMoodsChart.tsx";
import { SafeHtml } from "../../components/SafeHtml.tsx";
import useTitleBar from "../../hooks/useTitleBar.tsx";
import { helpers } from "../../util/helpers.ts";
import type { View } from "../../../common/types.ts";
import { ClubhouseMessages } from "../../components/ClubhouseMessages.tsx";
import { CoachMessageContext } from "../../components/CoachInbox.tsx";

const Message = ({ message, messageSummaries }: View<"message">) => {
	const title = message?.subject ?? "Message";
	useTitleBar({
		title,
	});

	if (!message) {
		return (
			<>
				<h2>Error</h2>
				<p>Message not found.</p>
			</>
		);
	}

	const body = (
		<article
			className={
				__SPORT === "basketball" ? "clubhouse-message-reader" : undefined
			}
		>
			<p>
				<b>From: {message.from}</b>, {message.year}
			</p>

			<SafeHtml dirty={message.text} />
			{__SPORT === "basketball" ? (
				<CoachMessageContext message={message} />
			) : null}

			{message.ownerMoods && message.ownerMoods.length > 2 ? (
				<OwnerMoodsChart ownerMoods={message.ownerMoods} />
			) : null}

			<div className="mt-3">
				<button
					type="button"
					className="btn btn-link p-0 border-0 align-baseline"
					onClick={() => window.history.back()}
				>
					Previous page
				</button>{" "}
				· <a href={helpers.leagueUrl(["inbox"])}>Inbox</a>
			</div>
		</article>
	);
	return __SPORT === "basketball" ? (
		<div className="clubhouse-correspondence">
			<aside>
				<header>
					<h2>Correspondence</h2>
					<a href={helpers.leagueUrl(["inbox"])}>Full inbox ↗</a>
				</header>
				<ClubhouseMessages
					messages={messageSummaries}
					activeMid={message.mid}
					compact
				/>
			</aside>
			{body}
		</div>
	) : (
		body
	);
};

export default Message;
