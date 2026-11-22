import clsx from "clsx";
import useTitleBar from "../hooks/useTitleBar.tsx";
import { helpers } from "../util/helpers.ts";
import type { View } from "../../common/types.ts";
import { ClubhouseMessages } from "../components/ClubhouseMessages.tsx";
import { AskCoach } from "../components/CoachInbox.tsx";

const Inbox = ({ anyUnread, messages }: View<"inbox">) => {
	useTitleBar({
		title: "Inbox",
	});
	if (__SPORT === "basketball") {
		return (
			<section className="clubhouse-inbox-page">
				<header>
					<h2>Your correspondence</h2>
					{anyUnread ? (
						<div className="clubhouse-required-mail">
							<strong>Read before continuing</strong>
							<a href={helpers.leagueUrl(["message"])}>Open required message</a>
						</div>
					) : null}
					<AskCoach />
				</header>
				<ClubhouseMessages messages={messages} />
			</section>
		);
	}
	return (
		<>
			{anyUnread ? (
				<p className="text-danger">
					You have a new message. Read it before continuing.
				</p>
			) : null}

			{messages.length === 0 ? (
				<p>No messages!</p>
			) : (
				<table
					className="table table-striped table-borderless table-sm"
					id="messages-table"
				>
					<tbody>
						{messages.map(({ from, mid, read, subject, text, year }) => {
							return (
								<tr
									key={mid}
									className={clsx({
										"fw-bold": !read,
									})}
								>
									<td className="year">
										<a href={helpers.leagueUrl(["message", mid])}>{year}</a>
									</td>
									<td className="from">
										<a href={helpers.leagueUrl(["message", mid])}>{from}</a>
									</td>
									<td className="text">
										<a href={helpers.leagueUrl(["message", mid])}>
											{subject ? (
												<>
													{subject} - {text}
												</>
											) : (
												text
											)}
										</a>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			)}
		</>
	);
};

export default Inbox;
