/* global console, window, document, innerWidth, URL */
// Disposable browser regression: node tools/qa/coachBriefings.mjs
// Uses localhost:3002 and writes test exports/screenshots to .tools/.
import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs";
const b = await chromium.launch({ headless: true });
try {
	const c = await b.newContext({ viewport: { width: 1440, height: 1050 } });
	await c.addInitScript(() => (window.SharedWorker = undefined));
	const p = await c.newPage();
	const errors = [];
	p.on("pageerror", (e) => {
		errors.push(e.message);
		console.log("JS", e.message);
	});
	await p.goto("http://localhost:3002/new_league");
	await p.getByRole("button", { name: /Create league/ }).click();
	await p.waitForURL(/\/l\/\d+/, { timeout: 60000 });
	await p.locator(".clubhouse-dashboard").waitFor();
	const base = p.url().match(/.*\/l\/\d+/)[0];
	const worker = () => p.workers().find((w) => w.url().includes("worker"));
	const f = await worker().evaluate(async () => {
		const { g, idb, lock } = globalThis.bbgm;
		const initial = await idb.merged.messages.getAll();
		const owner = initial.find((m) => !m.advisory);
		if (!owner) {
			throw Error("Missing owner letter");
		}
		if (!initial.some((m) => m.coach?.kind === "roster" && m.advisory)) {
			throw Error("Missing coach assessment");
		}
		if (!(await lock.unreadMessage())) {
			throw Error("Owner should block");
		}
		owner.read = true;
		await idb.cache.messages.put(owner);
		if (await lock.unreadMessage()) {
			throw Error("Coach should not block");
		}
		const teams = (await idb.cache.teams.getAll()).filter((t) => !t.disabled);
		const tid = g.get("userTid");
		const opp = teams.find((t) => t.tid !== tid).tid;
		const ps = await idb.cache.players.indexGetAll("playersByTid", [
			0,
			Infinity,
		]);
		for (const q of ps) {
			const r = q.ratings.at(-1);
			for (const k of [
				"hgt",
				"stre",
				"spd",
				"jmp",
				"endu",
				"ins",
				"dnk",
				"ft",
				"fg",
				"tp",
				"oiq",
				"diq",
				"drb",
				"pss",
				"reb",
			]) {
				r[k] = 60;
			}
			r.ovr = q.tid === tid ? 85 : 60;
			r.pot = r.ovr;
			r.fuzz = 0;
			if (q.tid === tid) {
				r.reb = 5;
			}
			if (q.tid === opp) {
				r.tp = 98;
			}
			q.injury = { type: "Healthy", gamesRemaining: 0 };
			await idb.cache.players.put(q);
		}
		await idb.cache.flush();
		return { tid, opp, owner: owner.mid, year: g.get("season") };
	});
	await p.goto(base + "/inbox");
	await p
		.getByRole("button", { name: "Ask coach for an assessment", exact: true })
		.click();
	await p.locator(".coach-message-context").waitFor();
	assert(
		(await p.locator(".clubhouse-message-reader").innerText()).includes(
			"Roster priority",
		) || (await p.locator("h1").filter({ hasText: "Roster priority" }).count()),
	);
	assert(
		(await p.locator(".clubhouse-message-reader").innerText()).includes(
			"rebounds",
		) ||
			(await p.locator(".clubhouse-message-reader").innerText()).includes(
				"rebounding",
			),
	);
	const mid = Number(p.url().split("/").at(-1));
	await p
		.getByRole("button", { name: "Make this a roster priority", exact: true })
		.click();
	await p
		.getByText("You made this a roster priority.", { exact: false })
		.waitFor();
	await p.reload();
	await p
		.getByText("You made this a roster priority.", { exact: false })
		.waitFor();
	await p.screenshot({
		path: ".tools/coach-roster-request.png",
		animations: "disabled",
	});
	const first = await worker().evaluate(async (mid) => {
		const { api, idb } = globalThis.bbgm;
		const count = (await idb.merged.messages.getAll()).length;
		const repeat = await api.main.requestCoachReport();
		const messages = await idb.merged.messages.getAll();
		return {
			count,
			after: messages.length,
			repeat,
			request: messages.find((m) => m.mid === mid).coach.request,
		};
	}, mid);
	assert.equal(first.after, first.count);
	assert.equal(first.repeat, mid);
	assert.equal(first.request.area, "reb");
	assert.equal(first.request.decision, "prioritize");
	await worker().evaluate(async () => {
		const { league, phase, PHASE, game, idb } = globalThis.bbgm;
		await league.setGameAttributes({ stopOnInjury: false, godMode: true });
		await phase.newPhase(PHASE.REGULAR_SEASON, {});
		await game.play(20, {});
		await idb.cache.flush();
	});
	const progress = await worker().evaluate(async (f) => {
		const { api, idb } = globalThis.bbgm;
		const all = await idb.merged.messages.getAll();
		const reports = all.filter((m) => m.coach?.kind === "roster");
		const q = reports.at(-1).coach.request;
		if (q.decision !== "prioritize") {
			throw Error("Priority did not carry forward");
		}
		for (const player of await idb.cache.players.indexGetAll(
			"playersByTid",
			f.tid,
		)) {
			player.ratings.at(-1).reb = 99;
			await idb.cache.players.put(player);
		}
		const refreshed = await api.main.requestCoachReport();
		await idb.cache.flush();
		return { reports: reports.length, refreshed, oldMid: reports.at(-1).mid };
	}, f);
	assert(progress.reports < 7);
	await p.goto(base + "/message/" + progress.refreshed);
	await p.locator(".clubhouse-message-reader").waitFor();
	assert(
		(await p.locator(".clubhouse-message-reader").innerText()).includes(
			"meets that target",
		),
	);
	await p.goto(base + "/message/" + progress.oldMid);
	await p
		.getByText("Target met in the latest staff review.", { exact: true })
		.waitFor();
	assert.equal(
		await p
			.getByRole("button", { name: "Make this a roster priority", exact: true })
			.count(),
		0,
	);
	await p
		.getByRole("link", { name: "Open the latest assessment →", exact: true })
		.click();
	await p.waitForURL(new RegExp("/message/" + progress.refreshed + "$"));
	const preview = await worker().evaluate(async (f) => {
		const { g, idb, league, api, PHASE } = globalThis.bbgm;
		await league.setGameAttributes({ phase: PHASE.PLAYOFFS });
		for (const game of await idb.cache.schedule.getAll()) {
			await idb.cache.schedule.delete(game.gid);
		}
		const regularSeason = { won: 50, lost: 32, tied: 0, otl: 0 };
		await idb.cache.playoffSeries.put({
			season: g.get("season"),
			currentRound: 0,
			series: [
				[
					{
						home: { tid: f.tid, seed: 1, won: 1, regularSeason },
						away: { tid: f.opp, seed: 8, won: 1, regularSeason },
					},
				],
				[],
				[],
				[],
			],
		});
		await idb.cache.schedule.put({
			gid: 99999,
			day: 100,
			homeTid: f.tid,
			awayTid: f.opp,
		});
		const mid = await api.main.requestCoachReport();
		const twice = await api.main.requestCoachReport();
		await idb.cache.flush();
		return { mid, twice };
	}, f);
	assert.equal(preview.mid, preview.twice);
	await p.goto(base + "/message/" + preview.mid);
	await p.locator(".coach-message-context").waitFor();
	const text = await p.locator(".clubhouse-message-reader").innerText();
	assert(text.includes("game 3"));
	assert(text.includes("Series: 1–1"));
	assert(text.includes("players rate stronger"));
	assert(text.includes("three-point shooting is a real scouting threat: #1"));
	await p.screenshot({
		path: ".tools/coach-playoff-preview.png",
		animations: "disabled",
	});
	const scheduled = await worker().evaluate(async (f) => {
		const { idb, season, g } = globalThis.bbgm;
		await idb.cache.schedule.delete(99999);
		const series = await idb.cache.playoffSeries.get(g.get("season"));
		series.series[0][0].home.won = 2;
		await idb.cache.playoffSeries.put(series);
		const before = (await idb.merged.messages.getAll()).filter(
			(m) => m.coach?.kind === "playoff",
		).length;
		await season.newSchedulePlayoffsDay();
		const messages = (await idb.merged.messages.getAll()).filter(
			(m) => m.coach?.kind === "playoff",
		);
		await idb.cache.flush();
		return {
			before,
			after: messages.length,
			mid: messages.at(-1).mid,
			text: messages.at(-1).text,
		};
	}, f);
	assert.equal(scheduled.after, scheduled.before + 1);
	assert(scheduled.text.includes("game 4"));
	await p.goto(base + "/inbox");
	await p.getByRole("button", { name: /^Coach / }).click();
	assert(
		(await p.locator(".clubhouse-message-list").innerText()).includes(
			"Head coach",
		),
	);
	for (const route of ["/inbox", "/message/" + scheduled.mid]) {
		await p.goto(base + route);
		await p
			.locator(".clubhouse-inbox-page,.clubhouse-message-reader")
			.first()
			.waitFor();
		for (const width of [1440, 1024, 390, 320]) {
			await p.setViewportSize({ width, height: 1050 });
			await p.waitForTimeout(350);
			assert(
				await p.evaluate(
					() => document.documentElement.scrollWidth <= innerWidth + 1,
				),
				"overflow " + route + width,
			);
		}
	}
	await worker().evaluate(async () => {
		const { league, idb } = globalThis.bbgm;
		await league.setGameAttributes({ challengeNoRatings: true });
		await idb.cache.flush();
	});
	await p.goto(base + "/message/" + scheduled.mid);
	await p
		.getByText(
			"Scouting briefs are unavailable while live ratings are hidden.",
			{ exact: true },
		)
		.first()
		.waitFor();
	assert.equal(await p.locator(".coach-message-context").count(), 0);
	await worker().evaluate(async (f) => {
		const { g, idb, lock } = globalThis.bbgm;
		const owner = await idb.merged.messages.get(f.owner);
		owner.read = false;
		await idb.cache.messages.put(owner);
		for (let i = 0; i < 15; i++) {
			await idb.cache.messages.add({
				from: "Head coach",
				year: g.get("season"),
				tid: f.tid,
				read: false,
				advisory: true,
				text: "Advisory",
				coach: { kind: "roster", key: "test:" + i, gamesPlayed: 20 },
			});
		}
		await idb.cache.flush();
		if (!(await lock.unreadMessage())) {
			throw Error("Buried owner message did not block");
		}
	}, f);
	await p.goto(base + "/message");
	await p.waitForURL(new RegExp("/message/" + f.owner + "$"));
	await p.locator(".clubhouse-message-reader").waitFor();
	assert.equal(
		await worker().evaluate(() => globalThis.bbgm.lock.unreadMessage()),
		false,
	);
	await p.setViewportSize({ width: 1440, height: 1050 });
	await p.goto(base + "/export_league");
	await p
		.getByRole("checkbox", { name: "Compress (gzip)", exact: true })
		.uncheck();
	await p.getByRole("checkbox", { name: /^Streaming download/ }).uncheck();
	const ready = p.waitForEvent("download");
	await p.getByRole("button", { name: "Download file", exact: false }).click();
	const download = await ready;
	await download.saveAs(".tools/coach-export.json");
	const exported = JSON.parse(
		fs.readFileSync(".tools/coach-export.json", "utf8"),
	);
	const letter = exported.messages.find((m) => m.mid === mid);
	assert.equal(letter.coach.request.decision, "prioritize");
	assert(letter.coach.request.supersededBy);
	await p.goto("http://localhost:3002/new_league");
	await p
		.locator("select")
		.filter({ has: p.locator('option[value="custom-rosters"]') })
		.selectOption("custom-rosters");
	await p.locator("input[type=file]").setInputFiles(".tools/coach-export.json");
	await p.getByRole("button", { name: /Create league/ }).click();
	await p.waitForURL(/\/l\/(?!1(?:\/|$))\d+/, { timeout: 60000 });
	await p.locator(".clubhouse-dashboard").waitFor();
	const imported = await worker().evaluate(
		async (key) =>
			(await globalThis.bbgm.idb.merged.messages.getAll()).find(
				(m) => m.coach?.key === key,
			).coach,
		letter.coach.key,
	);
	assert.deepEqual(imported, letter.coach);
	const importedLink = await worker().evaluate(async (key) => {
		const { idb, league } = globalThis.bbgm;
		await league.setGameAttributes({ challengeNoRatings: false });
		await idb.cache.flush();
		const messages = await idb.merged.messages.getAll();
		const original = messages.find((m) => m.coach?.key === key);
		return {
			mid: original.mid,
			followup: messages.find(
				(m) => m.coach?.key === original.coach.request.supersededBy,
			).mid,
		};
	}, letter.coach.key);
	const importedBase = p.url().match(/.*\/l\/\d+/)[0];
	await p.goto(importedBase + "/message/" + importedLink.mid);
	const followup = p.getByRole("link", {
		name: "Open the latest assessment →",
	});
	await followup.waitFor();
	assert.equal(
		await followup.getAttribute("href"),
		new URL(importedBase).pathname + "/message/" + importedLink.followup,
	);
	assert.deepEqual(errors, []);
	console.log(
		"PASS initial coach, nonblocking advisories, Power Rankings request, response/reload, dedupe, cadence, follow-up and resolution, stale-request links, real playoff series/game previews and next-game lifecycle, shooting threat despite talent edge, coach filter, hidden-rating redaction, mandatory owner beyond 10 advisories, mobile layouts, export/import decision persistence.",
	);
} finally {
	await b.close();
}
