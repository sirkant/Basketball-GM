import type { View } from "../../../common/types.ts";
import { helpers } from "../../util/helpers.ts";
import { useLocal } from "../../util/local.ts";

const ClubHeader = ({
	t,
	season,
	players,
	maxRosterSize,
}: Pick<View<"roster">, "t" | "season" | "players" | "maxRosterSize">) => {
	const { challengeNoRatings } = useLocal(["challengeNoRatings"]);
	return (
		<header className="club-header">
			<div className="club-header-identity">
				{t.seasonAttrs.imgURL ? (
					<img className="club-crest" src={t.seasonAttrs.imgURL} alt="" />
				) : null}
				<div>
					<div className="franchise-eyebrow">
						Basketball operations / {season}
					</div>
					<p className="club-region">{t.seasonAttrs.region}</p>
					<h2 className="club-name">{t.seasonAttrs.name}</h2>
					<div className="club-record">
						{t.seasonAttrs.won}–{t.seasonAttrs.lost}{" "}
						<span>
							season record
							{t.rank !== undefined
								? ` · ${helpers.ordinal(t.rank)} in standings`
								: ""}
						</span>
					</div>
				</div>
			</div>
			<div className="club-header-facts">
				{!challengeNoRatings ? (
					<div>
						<span>Team rating</span>
						<strong>
							{t.ovrCurrent}
							<small>/100</small>
						</strong>
					</div>
				) : null}
				<div>
					<span>Roster</span>
					<strong>
						{players.length}
						<small>/{maxRosterSize}</small>
					</strong>
				</div>
				<div>
					<span>Expiring</span>
					<strong>
						{players.filter((p) => p.contract.exp <= season).length}
						<small> players</small>
					</strong>
				</div>
			</div>
		</header>
	);
};

export default ClubHeader;
