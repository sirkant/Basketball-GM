import { useState } from "react";
import { helpers } from "../util/helpers.ts";
import { messagePreview } from "../util/messagePreview.ts";

type MessageSummary = {
	mid: number;
	from: string;
	year: number;
	read: boolean;
	subject?: string;
	text: string;
	advisory?: boolean;
};

export const ClubhouseMessages = ({
	messages,
	activeMid,
	compact = false,
}: {
	messages: MessageSummary[];
	activeMid?: number;
	compact?: boolean;
}) => {
	const [filter, setFilter] = useState<"all" | "unread" | "coach">("all");
	const unread = messages.filter((m) => !m.read).length;
	const visible =
		filter === "unread"
			? messages.filter((m) => !m.read)
			: filter === "coach"
				? messages.filter((m) => m.advisory)
				: messages;
	return (
		<div className={`clubhouse-messages ${compact ? "is-compact" : ""}`}>
			<div
				className="clubhouse-message-filters"
				role="group"
				aria-label="Message filters"
			>
				<button
					type="button"
					aria-pressed={filter === "all"}
					onClick={() => setFilter("all")}
				>
					All <span>{messages.length}</span>
				</button>
				<button
					type="button"
					aria-pressed={filter === "unread"}
					onClick={() => setFilter("unread")}
				>
					Unread <span>{unread}</span>
				</button>
				<button
					type="button"
					aria-pressed={filter === "coach"}
					onClick={() => setFilter("coach")}
				>
					Coach <span>{messages.filter((m) => m.advisory).length}</span>
				</button>
			</div>
			<div className="clubhouse-message-list">
				{visible.length === 0 ? (
					<p className="clubhouse-empty">
						{filter === "unread"
							? "You're up to date. No unread messages."
							: filter === "coach"
								? "Coach requests and matchup previews will appear here."
								: "Your correspondence will appear here as the season develops."}
					</p>
				) : (
					visible.map((m) => (
						<a
							className={`clubhouse-message ${!m.read ? "is-unread" : ""} ${activeMid === m.mid ? "is-selected" : ""}`}
							href={helpers.leagueUrl(["message", m.mid])}
							key={m.mid}
							aria-current={activeMid === m.mid ? "page" : undefined}
						>
							<span className="clubhouse-message-meta">
								<span>{m.from}</span>
								<span>
									{m.year}
									{m.advisory ? " · COACH" : ""}
								</span>
							</span>
							<strong>{m.subject || "Message from " + m.from}</strong>
							<span className="clubhouse-message-preview">
								{messagePreview(m.text)}
							</span>
						</a>
					))
				)}
			</div>
		</div>
	);
};
