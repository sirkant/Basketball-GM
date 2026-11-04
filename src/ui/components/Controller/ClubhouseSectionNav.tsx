import {
	clubhouseGroups,
	getClubhouseLinks,
	menuPathKey,
} from "../../util/clubhouseNavigation.ts";
import { menuItems } from "../../util/menuItems.tsx";
import { getText, makeAnchorProps } from "../../util/menuLink.ts";
import { useLocal } from "../../util/local.ts";

export const ClubhouseSectionNav = ({ pageID }: { pageID?: string }) => {
	const { godMode, lid } = useLocal(["godMode", "lid"]);
	if (__SPORT !== "basketball" || lid === undefined) {
		return null;
	}
	const links = getClubhouseLinks(menuItems, godMode);
	const group = clubhouseGroups.find((g) =>
		links.some(
			(item) =>
				g.keys.includes(menuPathKey(item) ?? "") && item.active?.(pageID),
		),
	);
	if (!group) {
		return null;
	}
	return (
		<nav className="clubhouse-section-nav" aria-label={`${group.name} pages`}>
			{links
				.filter((item) => group.keys.includes(menuPathKey(item) ?? ""))
				.map((item, index) => (
					<a
						key={index}
						{...makeAnchorProps(item, () => {})}
						aria-current={item.active?.(pageID) ? "page" : undefined}
					>
						{getText(item.text)}
					</a>
				))}
		</nav>
	);
};
