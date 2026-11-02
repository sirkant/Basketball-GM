import type { View } from "../../../common/types.ts";
import { useLocal } from "../../util/local.ts";

const ClubHeader = ({
	t,
	season,
	players,
	maxRosterSize,
}: Pick<View<"roster">, "t" | "season" | "players" | "maxRosterSize">) => {
	const { challengeNoRatings } = useLocal(["challengeNoRatings"]);
	return (
		<header className="basketball-clubbar">
			{t.seasonAttrs.imgURL ? <img src={t.seasonAttrs.imgURL} alt="" /> : null}
			<div className="basketball-clubbar-name">
				<span>Basketball operations / {season}</span>
				<h2>
					{t.seasonAttrs.region} <strong>{t.seasonAttrs.name}</strong>
				</h2>
			</div>
			<div className="basketball-clubbar-meta">
				<strong>
					{t.seasonAttrs.won}–{t.seasonAttrs.lost}
				</strong>
				<span>
					{players.length}/{maxRosterSize} players
				</span>
				{!challengeNoRatings ? (
					<span>
						Team OVR <strong>{t.ovrCurrent}</strong>
					</span>
				) : null}
			</div>
		</header>
	);
};

export default ClubHeader;
