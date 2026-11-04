import { useState } from "react";
import { Modal } from "../Modal.tsx";
import type { CSSProperties } from "react";
import type { MenuItemLink } from "../../../common/types.ts";
import {
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
	const [directoryOpen, setDirectoryOpen] = useState(false);
	const [search, setSearch] = useState("");
	const links = getClubhouseLinks(menuItems, godMode);
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
			<div className="clubhouse-primary-nav clubhouse-flat-nav">
				{[
					["", "Home", "house", "leagueDashboard"],
					["inbox", "Inbox", "inbox", "inbox"],
					["schedule", "Calendar", "calendar-days", "schedule"],
					["news", "News", "book-open", "news"],
					["roster", "Squad", "users", "roster"],
					["trade", "Trades", "arrow-left-right", "trade"],
					["free_agents", "Free agents", "users", "freeAgents"],
					["draft_scouting", "Scouting", "scan-search", "draftScouting"],
					["draft", "Draft", "scan-search", "draft"],
					[
						"power_rankings",
						"Power Rankings",
						"chart-no-axes-combined",
						"powerRankings",
					],
					["standings", "Standings", "trophy", "standings"],
					["playoffs", "Playoffs", "trophy", "playoffs"],
					["team_finances", "Finances & owner", "landmark", "teamFinances"],
					[
						"player_stats",
						"Statistics",
						"chart-no-axes-combined",
						"playerStats",
					],
					["history_all", "History", "book-open", "historyAll"],
					["settings", "Settings", "settings-2", "settings"],
				].map(([path, text, icon, id]) => {
					const active =
						pageID === id || (path === "inbox" && pageID === "message");
					return (
						<a
							key={text}
							href={helpers.leagueUrl(path ? [path] : [])}
							onClick={onNavigate}
							className={`clubhouse-primary-link ${active ? "active" : ""}`}
							aria-current={active ? "page" : undefined}
						>
							<Icon name={icon!} />
							<span>{text}</span>
						</a>
					);
				})}
				<button
					type="button"
					className="clubhouse-primary-link"
					onClick={() => setDirectoryOpen(true)}
				>
					<Icon name="settings-2" />
					<span>All screens & tools</span>
				</button>
			</div>
			<Modal
				show={directoryOpen}
				onHide={() => setDirectoryOpen(false)}
				size="lg"
			>
				<Modal.Header closeButton>
					<Modal.Title>All screens & tools</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<input
						type="search"
						className="form-control mb-3"
						aria-label="Find a screen"
						placeholder="Find a screen or tool…"
						value={search}
						onChange={(event) => setSearch(event.target.value)}
					/>
					<div className="clubhouse-screen-directory">
						{links
							.filter((item) =>
								`${String(label(item))} ${menuPathKey(item) ?? ""}`
									.toLowerCase()
									.includes(search.toLowerCase()),
							)
							.map((item, index) => (
								<a
									key={index}
									{...makeAnchorProps(item, () => {
										setDirectoryOpen(false);
										onNavigate();
									})}
									className="clubhouse-directory-link"
								>
									{label(item)}
								</a>
							))}
					</div>
				</Modal.Body>
			</Modal>
		</div>
	);
};
export default ClubhouseNavigation;
