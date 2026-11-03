import { useState } from "react";
import type { CSSProperties } from "react";
import type { MenuItemLink } from "../../../common/types.ts";
import {
	clubhouseGroups,
	getClubhouseLinks,
	menuPathKey,
} from "../../util/clubhouseNavigation.ts";
import { menuItems } from "../../util/menuItems.tsx";
import { getText, makeAnchorProps } from "../../util/menuLink.ts";
import { helpers } from "../../util/helpers.ts";
import { useLocal } from "../../util/local.ts";

const Icon = ({ name }: { name: string }) => (
	<span
		className="clubhouse-menu-icon"
		style={
			{ "--clubhouse-icon": `url(/ico/clubhouse/${name}.svg)` } as CSSProperties
		}
		aria-hidden="true"
	/>
);

const ClubhouseNavigation = ({
	pageID,
	pathname,
	onNavigate,
}: {
	pageID?: string;
	pathname?: string;
	onNavigate: () => void;
}) => {
	const { godMode, teamInfoCache, userTid, season } = useLocal([
		"godMode",
		"teamInfoCache",
		"userTid",
		"season",
	]);
	const t = teamInfoCache[userTid];
	const [opened, setOpened] = useState<Record<string, boolean>>({});
	const links = getClubhouseLinks(menuItems, godMode);
	const assigned = new Set(["", "schedule", "news"]);
	for (const group of clubhouseGroups) {
		for (const key of group.keys) {
			assigned.add(key);
		}
	}
	const tools = links.filter(
		(item) => !assigned.has(menuPathKey(item) ?? "action"),
	);
	const label = (item: MenuItemLink) => {
		const key = menuPathKey(item);
		return key === "team_finances"
			? "Team finances & owner"
			: key === "league_finances"
				? "League finances"
				: key === "team_history"
					? "Franchise history"
					: key === "history_all"
						? "League chronicle"
						: getText(item.text);
	};
	const renderLink = (item: MenuItemLink, index: number) => (
		<a
			key={index}
			{...makeAnchorProps(item, onNavigate)}
			className={`clubhouse-sub-link ${item.active?.(pageID, pathname) ? "active" : ""}`}
			aria-current={item.active?.(pageID, pathname) ? "page" : undefined}
		>
			{label(item)}
		</a>
	);
	const renderGroup = (name: string, icon: string, items: MenuItemLink[]) => {
		if (!items.length) {
			return null;
		}
		const active = items.some((item) => item.active?.(pageID, pathname));
		const open = opened[name] ?? active;
		return (
			<div className="clubhouse-nav-group" key={name}>
				<button
					type="button"
					className={`clubhouse-primary-link ${active ? "active" : ""}`}
					aria-expanded={open}
					onClick={() => setOpened((old) => ({ ...old, [name]: !open }))}
				>
					<Icon name={icon} />
					<span>{name}</span>
					<span className="clubhouse-expand" aria-hidden="true">
						{open ? "−" : "+"}
					</span>
				</button>
				{open ? (
					<div className="clubhouse-submenu" aria-label={name}>
						{items.map(renderLink)}
					</div>
				) : null}
			</div>
		);
	};
	return (
		<div className="clubhouse-navigation">
			<a
				className="clubhouse-brand"
				href={helpers.leagueUrl([])}
				onClick={onNavigate}
			>
				{t?.imgURLSmall || t?.imgURL ? (
					<img src={t.imgURLSmall ?? t.imgURL} alt="" />
				) : null}
				<div>
					<strong>{t?.region ?? "Basketball"}</strong>
					<span>{t?.name ?? "Front office"}</span>
					<small>BASKETBALL OPERATIONS · {season}</small>
				</div>
			</a>
			<div className="clubhouse-primary-nav">
				{[
					["", "Home", "house", "leagueDashboard"],
					["inbox", "Inbox", "inbox", "inbox"],
					["schedule", "Calendar", "calendar-days", "schedule"],
					["news", "News", "book-open", "news"],
				].map(([path, text, icon, id]) => (
					<a
						key={text}
						href={helpers.leagueUrl(path ? [path] : [])}
						onClick={onNavigate}
						className={`clubhouse-primary-link ${pageID === id || (path === "inbox" && pageID === "message") ? "active" : ""}`}
						aria-current={
							pageID === id || (path === "inbox" && pageID === "message")
								? "page"
								: undefined
						}
					>
						<Icon name={icon!} />
						<span>{text}</span>
					</a>
				))}
				<span className="clubhouse-nav-label">BASKETBALL</span>
				{clubhouseGroups.map((group) =>
					renderGroup(
						group.name,
						group.icon,
						links.filter((item) =>
							group.keys.includes(menuPathKey(item) ?? ""),
						),
					),
				)}
				<span className="clubhouse-nav-label">YOUR LEAGUE</span>
				{renderGroup("Settings & tools", "settings-2", tools)}
			</div>
		</div>
	);
};
export default ClubhouseNavigation;
