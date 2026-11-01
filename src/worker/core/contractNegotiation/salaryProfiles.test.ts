import { beforeEach, expect, test } from "vitest";
import { mockIDBLeague, resetCache, resetG } from "../../../test/helpers.ts";
import { contractNegotiation, player, team } from "../index.ts";
import { idb } from "../../db/index.ts";
import { g, helpers } from "../../util/index.ts";
import { DEFAULT_LEVEL } from "../../../common/budgetLevels.ts";
import {
	PHASE,
	PLAYER,
	LEAGUE_DATABASE_VERSION,
} from "../../../common/constants.ts";
import { updateAnnualSalaries } from "../finances/updateAnnualSalaries.ts";
import { getContractSalary } from "../../../common/contractSalary.ts";

beforeEach(async () => {
	resetG();
	g.setWithoutSavingToDB("phase", PHASE.REGULAR_SEASON);
	const teams = helpers.getTeamsDefault().slice(0, 2).map(team.generate);
	const p = player.generate(
		PLAYER.FREE_AGENT,
		28,
		g.get("season") - 4,
		true,
		DEFAULT_LEVEL,
	);
	p.contract = { amount: g.get("minContract"), exp: g.get("season") + 2 };
	await resetCache({
		players: [{ ...p, pid: 0 }],
		teams,
		teamSeasons: teams.map((t) => team.genSeasonRow(t)),
	});
	idb.league = mockIDBLeague();
});

const negotiation = async () => {
	const value = await contractNegotiation.create(0, false);
	if (typeof value === "string") {
		throw new Error(value);
	}
	return value;
};

test("signing stores each salary and undo restores the old demand and history", async () => {
	const before = helpers.deepCopy((await idb.cache.players.get(0))!);
	const undo = await contractNegotiation.accept({
		negotiation: await negotiation(),
		amount: 3000,
		exp: g.get("season") + 2,
		profile: "increasing",
		dryRun: false,
	});
	expect(typeof undo).toBe("function");
	const signed = (await idb.cache.players.get(0))!;
	expect(signed.contract.schedule).toHaveLength(3);
	expect(signed.salaries).toEqual(signed.contract.schedule);
	expect(await team.getPayroll(0)).toBe(signed.contract.schedule![0]!.amount);
	if (typeof undo !== "function") {
		throw new Error("Signing failed");
	}
	expect(await undo()).toBe(true);
	const restored = (await idb.cache.players.get(0))!;
	expect(restored.contract).toEqual(before.contract);
	expect(restored.salaries).toEqual(before.salaries);
	expect(restored.tid).toBe(PLAYER.FREE_AGENT);
});

test("annual salaries update after a trade and released guarantees remain separate", async () => {
	await contractNegotiation.accept({
		negotiation: await negotiation(),
		amount: 3000,
		exp: g.get("season") + 2,
		profile: "decreasing",
		dryRun: false,
	});
	const signed = (await idb.cache.players.get(0))!;
	const schedule = helpers.deepCopy(signed.contract.schedule!);
	// A trade moves the whole contract, not just its first-year salary.
	signed.tid = 1;
	await idb.cache.players.put(signed);
	const next = g.get("season") + 1;
	g.setWithoutSavingToDB("season", next);
	await updateAnnualSalaries(next);
	expect(await team.getPayroll(0)).toBe(0);
	expect(await team.getPayroll(1)).toBe(schedule[1]!.amount);
	await player.release((await idb.cache.players.get(0))!, false);
	expect((await idb.cache.players.get(0))!.contract.schedule).toBeUndefined();
	expect(
		(await idb.cache.releasedPlayers.getAll())[0]!.contract.schedule,
	).toEqual(schedule);
	g.setWithoutSavingToDB("season", next + 1);
	await updateAnnualSalaries(next + 1);
	expect(await team.getPayroll(1)).toBe(schedule[2]!.amount);
	expect((await team.getContracts(1))[0]!.schedule).toEqual(schedule);
});

test("first-year exception legality can differ from average salary", async () => {
	const rosterPlayer = player.generate(
		0,
		28,
		g.get("season") - 4,
		true,
		DEFAULT_LEVEL,
	);
	rosterPlayer.contract = { amount: 175000, exp: g.get("season") + 2 };
	await idb.cache.players.add(rosterPlayer);
	const n = await negotiation();
	expect(
		await contractNegotiation.accept({
			negotiation: n,
			amount: 14000,
			exp: g.get("season") + 2,
			profile: "flat",
			dryRun: true,
		}),
	).toContain("mid-level");
	expect(
		await contractNegotiation.accept({
			negotiation: n,
			amount: 14000,
			exp: g.get("season") + 2,
			profile: "increasing",
			dryRun: true,
		}),
	).toBeUndefined();
	expect(
		await contractNegotiation.accept({
			negotiation: n,
			amount: 14000,
			exp: g.get("season") + 2,
			profile: "decreasing",
			dryRun: true,
		}),
	).toContain("mid-level");
});

test("annual minimum and maximum cannot be bypassed with a cheaper average", async () => {
	const n = await negotiation();
	expect(
		await contractNegotiation.accept({
			negotiation: n,
			amount: g.get("minContract"),
			exp: g.get("season") + 2,
			profile: "increasing",
			dryRun: true,
		}),
	).toContain("minimum and maximum");
	expect(
		await contractNegotiation.accept({
			negotiation: n,
			amount: g.get("maxContract"),
			exp: g.get("season") + 2,
			profile: "decreasing",
			dryRun: true,
		}),
	).toContain("minimum and maximum");
});

test("minimum exception cannot hide a future above-minimum salary", async () => {
	expect(
		await contractNegotiation.accept({
			negotiation: await negotiation(),
			amount: g.get("minContract") * 1.025,
			exp: g.get("season") + 1,
			profile: "increasing",
			dryRun: true,
		}),
	).toContain("minimum-salary exception");
});

test("formatted contracts use millions consistently for every scheduled salary", async () => {
	await contractNegotiation.accept({
		negotiation: await negotiation(),
		amount: 3000,
		exp: g.get("season") + 2,
		profile: "increasing",
		dryRun: false,
	});
	const p = (await idb.cache.players.get(0))!;
	const formatted = await player.format(p, {
		attrs: ["contract", "cashOwed"],
		season: g.get("season"),
		numGamesRemaining: g.get("numGames") / 2,
	});
	if (!formatted) {
		throw new Error("Signed player was not formatted.");
	}
	expect(formatted.contract.schedule![1]!.amount).toBe(
		getContractSalary(p.contract, g.get("season") + 1) / 1000,
	);
	expect(formatted.cashOwed).toBeCloseTo((9000 - p.contract.amount / 2) / 1000);
});

test("exported annual contracts survive player import without rounding their active salary", async () => {
	await contractNegotiation.accept({
		negotiation: await negotiation(),
		amount: 3000,
		exp: g.get("season") + 2,
		profile: "increasing",
		dryRun: false,
	});
	const p = (await idb.cache.players.get(0))!;
	const serialized = JSON.stringify(p);
	const imported = await player.augmentPartialPlayer(
		JSON.parse(serialized),
		DEFAULT_LEVEL,
		LEAGUE_DATABASE_VERSION,
	);
	expect(imported.contract).toEqual(p.contract);
	expect(imported.salaries).toEqual(p.salaries);
});

test("import rejects incomplete annual salary schedules", async () => {
	const p = (await idb.cache.players.get(0))!;
	p.contract = {
		amount: 3000,
		exp: g.get("season") + 2,
		schedule: [
			{ season: g.get("season"), amount: 3000 },
			{ season: g.get("season") + 2, amount: 3300 },
		],
	};
	await expect(
		player.augmentPartialPlayer(p, DEFAULT_LEVEL, LEAGUE_DATABASE_VERSION),
	).rejects.toThrow("Invalid annual contract salary schedule");
});
