import { isBlockingMessage } from "../../common/basketballBriefing.ts";
import { idb } from "../db/index.ts";
import { defineView } from "../util/defineView.ts";

export default defineView({
	id: "inbox",
	load: async () => {
		const { ensureCoachBriefings, visibleCoachMessage } =
			await import("../core/team/coachBriefings.ts");
		await ensureCoachBriefings();
		let anyUnread = false;
		const messages = (await idb.merged.messages.getAll())
			.reverse()
			.map(visibleCoachMessage)
			.map((message) => {
				if (isBlockingMessage(message)) {
					anyUnread = true;
				}

				return {
					...message,
					text: message.text.replaceAll("<p>", "").replaceAll("</p>", " "),
				};
			});

		return {
			anyUnread,
			messages,
		};
	},
});
