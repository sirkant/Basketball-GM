/* global process, console, URL, window, localStorage, document, innerWidth */
// Disposable visual audit. Never attaches to the user's browser or saved leagues.
// Usage: node tools/qa/clubhouseGallery.mjs [output-directory] [base-url]
import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const routeSource = await fs.readFile(
	new URL("../../src/ui/util/routeInfos.ts", import.meta.url),
	"utf8",
);
const routeInfos = Object.fromEntries(
	[...routeSource.matchAll(/"(\/l\/:lid[^"]*)":\s*"([^"]+)"/g)].map((match) => [
		match[1],
		match[2],
	]),
);

const output = path.resolve(process.argv[2] ?? ".tools/clubhouse-gallery");
const origin = process.argv[3] ?? "http://localhost:3002";
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const captures = [];
const errors = [];
const mobileRoutes = new Set([
	"leagueDashboard",
	"inbox",
	"message",
	"roster",
	"player",
	"trade",
	"teamFinances",
	"historyAll",
	"settings",
]);
const escape = (value) =>
	String(value)
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll('"', "&quot;");
try {
	const context = await browser.newContext({
		viewport: { width: 1440, height: 1000 },
	});
	await context.addInitScript(() => {
		window.SharedWorker = undefined;
	});
	const page = await context.newPage();
	page.on("pageerror", (error) =>
		errors.push({ url: page.url(), message: error.message }),
	);
	await page.goto(origin);
	await page.evaluate(() => localStorage.setItem("theme", "dark"));
	await page.goto(`${origin}/new_league`);
	await page.getByRole("button", { name: /Create league/ }).click();
	await page.waitForURL(/\/l\/\d+/, { timeout: 60000 });
	await page.locator(".clubhouse-dashboard").waitFor();
	const base = page.url().match(/.*\/l\/\d+/)[0];
	console.log(
		"Created disposable league; simulating a season for real history and statistics...",
	);
	const fixture = await page
		.workers()
		.find((worker) => worker.url().includes("worker"))
		.evaluate(async () => {
			const { g, idb, league, phase, game, PHASE } = globalThis.bbgm;
			await league.setGameAttributes({ stopOnInjury: false, godMode: true });
			for (const message of await idb.cache.messages.getAll()) {
				message.read = true;
				await idb.cache.messages.put(message);
			}
			await phase.newPhase(PHASE.REGULAR_SEASON, {});
			for (let i = 0; i < 10 && g.get("phase") <= PHASE.PLAYOFFS; i++) {
				await game.play(200, {});
			}
			const previousSeason = g.get("season");
			await phase.newPhase(PHASE.PRESEASON, {});
			await phase.newPhase(PHASE.REGULAR_SEASON, {});
			await game.play(12, {});
			const players = (
				await idb.cache.players.indexGetAll("playersByTid", g.get("userTid"))
			).sort((a, b) => a.rosterOrder - b.rosterOrder);
			const messages = await idb.merged.messages.getAll();
			await idb.cache.flush();
			return {
				pid: players[0].pid,
				mid: messages.at(-1)?.mid,
				season: g.get("season"),
				previousSeason,
			};
		});
	console.log("Fixture ready", fixture);
	const skip = new Set([
		"newTeam",
		"liveGame",
		"eightyTwoZeroDraft",
		"fantasyDraft",
		"expansionDraft",
		"protectPlayers",
		"depth",
		"deleteOldData",
		"dangerZone",
	]);
	/** @type {{route: string; id: string; mode?: string}[]} */
	const routes = Object.entries(routeInfos)
		.filter(
			([route, id]) =>
				route.startsWith("/l/:lid") &&
				!route.replace("/l/:lid", "").includes(":") &&
				!skip.has(id),
		)
		.map(([route, id]) => ({ route: route.replace("/l/:lid", ""), id }));
	routes.splice(
		2,
		0,
		{ route: `/player/${fixture.pid}`, id: "player" },
		{ route: `/player_game_log/${fixture.pid}`, id: "playerGameLog" },
	);
	routes.push(
		{ route: "/roster", id: "rosterRotation", mode: "rotation" },
		{ route: "/roster", id: "rosterTable", mode: "table" },
		{ route: "/roster", id: "tableColumns", mode: "columns" },
		{ route: "/free_agents", id: "contractNegotiation", mode: "contract" },
		{ route: "", id: "commandSearch", mode: "search" },
	);
	const seen = new Set();
	for (const item of routes) {
		if (seen.has(item.id)) {
			continue;
		}
		seen.add(item.id);
		if (item.id === "message") {
			item.route = `/message/${fixture.mid}`;
		}
		if (
			item.id === "playoffs" ||
			item.id === "draftLottery" ||
			item.id === "history"
		) {
			item.route += `/${fixture.previousSeason}`;
		}
		const capture = { ...item, images: [], warnings: [] };
		try {
			await page.goto(base + item.route);
			await page.locator("#actual-actual-content").waitFor();
			await page.waitForFunction(
				() =>
					document.querySelector("#actual-actual-content")?.textContent.trim()
						.length > 0,
			);
			await page.evaluate(() => document.fonts.ready);
			if (item.mode === "rotation") {
				await page
					.getByRole("button", { name: "Rotation", exact: true })
					.click();
			}
			if (item.mode === "table" || item.mode === "columns") {
				await page
					.getByRole("button", { name: "Lineup & full table", exact: true })
					.click();
			}
			if (item.mode === "columns") {
				await page.locator('[id^="datatable-controls-"]').first().click();
				await page.getByText("Customize columns", { exact: true }).click();
				await page.getByRole("dialog").waitFor();
			}
			if (item.mode === "contract") {
				const buttons = await page
					.getByRole("button", { name: "Negotiate", exact: true })
					.all();
				for (const button of buttons) {
					if (await button.isEnabled()) {
						await button.click();
						break;
					}
				}
				await page.getByRole("dialog").waitFor();
			}
			if (item.mode === "search") {
				await page.locator(".clubhouse-search").click();
				await page.getByRole("dialog").waitFor();
			}
			await page.waitForTimeout(400);
			capture.title = await page.locator("h1").first().innerText();
			const body = await page.locator("#actual-actual-content").innerText();
			if (/an error occurred|something went wrong|page not found/i.test(body)) {
				capture.warnings.push("Error state: inspect screenshot");
			}
			for (const width of [1440, 390]) {
				await page.setViewportSize({ width, height: 1000 });
				await page.waitForTimeout(450);
				await page.evaluate(() => window.scrollTo(0, 0));
				const overflow = await page.evaluate(
					() => document.documentElement.scrollWidth > innerWidth + 1,
				);
				if (overflow) {
					capture.warnings.push(`Page overflow at ${width}px`);
				}
				if (width === 1440 || mobileRoutes.has(item.id)) {
					const file = `${item.id}-${width}.png`;
					await page.screenshot({
						path: path.join(output, file),
						fullPage: true,
						animations: "disabled",
					});
					capture.images.push(file);
				}
			}
			await page.setViewportSize({ width: 1440, height: 1000 });
		} catch (error) {
			capture.warnings.push(error.message);
		}
		captures.push(capture);
		console.log(
			capture.id,
			capture.warnings.length ? capture.warnings.join("; ") : "OK",
		);
	}
	const manifest = {
		created: new Date().toISOString(),
		fixture,
		viewport: "1440×1000; mobile 390×1000",
		note: "Disposable simulated league. God Mode enabled for tool coverage. Phase-specific screens retain their real availability messages. No user save accessed.",
		captures,
		errors,
	};
	await fs.writeFile(
		path.join(output, "manifest.json"),
		JSON.stringify(manifest, null, 2),
	);
	await fs.writeFile(
		path.join(output, "index.html"),
		`<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Clubhouse · Galería de pantallas</title><style>body{margin:0;background:#171b21;color:#e6ecf3;font:14px system-ui}header{padding:28px 4vw;border-bottom:1px solid #3b4350;position:sticky;top:0;background:#171b21f5;z-index:2}h1{font-size:24px;margin:0 0 8px}p{color:#acb8c8}input{padding:10px;background:#252c36;border:1px solid #596376;color:white;width:min(500px,85%)}main{padding:20px 4vw;display:grid;grid-template-columns:repeat(auto-fill,minmax(350px,1fr));gap:20px}article{border:1px solid #3b4350;border-radius:5px;background:#20262e;overflow:hidden}article h2{font-size:17px;margin:14px}article p{margin:14px;font-size:12px}img{display:block;width:100%;height:300px;object-fit:cover;object-position:top}a{color:#dec494}article nav{padding:12px;display:flex;gap:15px}article[hidden]{display:none}.warning{color:#efb878}</style><header><h1>Clubhouse · Galería de pantallas</h1><p>${captures.length} pantallas · Capturas del juego implementado · Liga simulada independiente de tus partidas</p><input type="search" placeholder="Buscar: roster, trade, finanzas, historial…" aria-label="Buscar pantalla"></header><main>${captures.map((c) => `<article data-search="${escape(c.id + " " + c.title)}"><h2>${escape(c.title ?? c.id)}</h2>${c.images[0] ? `<a href="${c.images[0]}"><img src="${c.images[0]}" loading="lazy" alt="${escape(c.title ?? c.id)}"></a>` : ""}<p>${escape(c.route || "Dashboard")}</p>${c.warnings.length ? `<p class="warning">${escape(c.warnings.join(" · "))}</p>` : ""}<nav>${c.images.map((file, i) => `<a href="${file}">${i ? "Móvil" : "Captura completa"}</a>`).join("")}</nav></article>`).join("")}</main><script>document.querySelector('input').addEventListener('input',e=>{for(const a of document.querySelectorAll('article'))a.hidden=!a.dataset.search.toLowerCase().includes(e.target.value.toLowerCase())})</script></html>`,
	);
	console.log(
		"Gallery ready:",
		output,
		`${captures.length} screens, ${errors.length} JS errors`,
	);
	if (errors.length || captures.some((c) => c.warnings.length)) {
		process.exitCode = 1;
	}
} finally {
	await browser.close();
}
