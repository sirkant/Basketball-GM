import { PHASE } from "../../../common/constants.ts";
import { idb } from "../../db/index.ts";
import g from "../../util/g.ts";
import logEvent from "../../util/logEvent.ts";
import getPayroll from "../team/getPayroll.ts";
import type { Player, Team } from "../../../common/types.ts";
import {
	getApronLevels,
	getOwnerExpectations,
	nbaLuxuryTax,
	type OwnerPriority,
	type ApronState,
} from "../../../common/nbaAprons.ts";

export const apronsEnabled = () =>
	__SPORT === "basketball" && g.get("salaryCapType") === "soft";

// The game keeps the completed season number throughout the offseason.
export const salaryYear = () =>
	g.get("season") + (g.get("phase") > PHASE.PLAYOFFS ? 1 : 0);
export const currentApronState = (t: Team | undefined) =>
	t?.apronState?.season === salaryYear() ? t.apronState : undefined;

export const ownerExpectations = (
	t: Pick<Team, "tid" | "ownerPriority" | "ownerMandate">,
) => {
	const priorities: OwnerPriority[] = [
		"balanced",
		"winning",
		"profit",
		"lowPayroll",
	];
	const profile = getOwnerExpectations(
		t.ownerPriority ??
			priorities[
				(((t.tid * 7) % priorities.length) + priorities.length) %
					priorities.length
			]!,
		g.get("salaryCap"),
	);
	const mandate = t.ownerMandate;
	if (
		mandate?.season === salaryYear() &&
		Number.isFinite(mandate.targets?.maxCost) &&
		Number.isFinite(mandate.targets?.minProfit)
	) {
		return {
			...profile,
			winPct: mandate.targets.winPct,
			minProfit: mandate.targets.minProfit,
			maxCost: mandate.targets.maxCost,
		};
	}
	return profile;
};

export const isRepeater = async (tid: number) => {
	const year = salaryYear();
	const rows = await idb.merged.teamSeasons.getAll({
		tid,
		seasons: [year - 4, year - 1],
	});
	return rows.filter((ts) => ts.expenses.luxuryTax > 0).length >= 3;
};

export const projectedTax = async (tid: number, payroll: number) =>
	apronsEnabled()
		? nbaLuxuryTax(
				payroll,
				g.get("luxuryPayroll"),
				g.get("salaryCap"),
				await isRepeater(tid),
			)
		: g.get("salaryCapType") !== "hard"
			? Math.max(0, payroll - g.get("luxuryPayroll")) * g.get("luxuryTax")
			: 0;

export const getFinancialStatus = async (tid: number, payroll?: number) => {
	if (!apronsEnabled()) {
		return undefined;
	}
	const t = await idb.cache.teams.get(tid);
	if (!t) {
		return undefined;
	}
	payroll ??= await getPayroll(tid);
	const repeater = await isRepeater(tid);
	const tax = nbaLuxuryTax(
		payroll,
		g.get("luxuryPayroll"),
		g.get("salaryCap"),
		repeater,
	);
	const levels = getApronLevels(g.get("salaryCap"), g.get("luxuryPayroll"));
	return {
		payroll,
		tax,
		total: payroll + tax,
		levels,
		state: currentApronState(t),
		owner: ownerExpectations(t),
		repeater,
		penalties:
			t.apronPickPenalties?.filter(
				(p) => !p.unfrozen && p.season >= salaryYear(),
			) ?? [],
		budget: g.get("budget"),
		userTeam: tid === g.get("userTid"),
		ownerEvaluation:
			tid === g.get("userTid") &&
			!g.get("godMode") &&
			!g.get("spectator") &&
			g.get("userTids").length === 1,
	};
};

export const saveApronState = async (
	tid: number,
	changes: Partial<ApronState>,
) => {
	const t = await idb.cache.teams.get(tid);
	if (!t) {
		return;
	}
	const old = currentApronState(t);
	t.apronState = { ...old, ...changes, season: salaryYear() };
	if (old?.hardCap) {
		t.apronState.hardCap = changes.hardCap
			? (Math.min(old.hardCap, changes.hardCap) as 1 | 2)
			: old.hardCap;
	}
	await idb.cache.teams.put(t);
};

// All callers (including AI) use the same legality checks. Own-player and
// minimum exceptions do not create a hard cap, but cannot breach an existing one.
export const checkApronSigning = async (
	tid: number,
	p: Pick<Player, "contract" | "releasedSalary">,
	amount: number,
	exp: number,
	resigning: boolean,
	payroll: number,
) => {
	if (!apronsEnabled()) {
		return {};
	}
	const t = await idb.cache.teams.get(tid);
	const state = currentApronState(t);
	const levels = getApronLevels(g.get("salaryCap"), g.get("luxuryPayroll"));
	const after = payroll + amount;
	if (
		state?.hardCap &&
		after > (state.hardCap === 1 ? levels.first : levels.second)
	) {
		return {
			error: `This contract would exceed your hard cap at the ${state.hardCap === 1 ? "first" : "second"} apron. Free up salary first.`,
		};
	}
	if (
		p.releasedSalary?.season === salaryYear() &&
		after > levels.first &&
		p.releasedSalary.amount > levels.nonTaxpayerMLE
	) {
		return {
			error:
				"Above the first apron, you cannot sign a player waived during this season whose previous salary exceeded the non-taxpayer mid-level exception.",
		};
	}
	if (resigning) {
		return {};
	}
	if (after <= g.get("salaryCap")) {
		return { state: { mleType: "room" as const } };
	}
	const used = state?.mleUsed ?? 0;
	const years = exp - salaryYear() + 1;
	if (amount <= g.get("minContract")) {
		return years <= 2
			? {}
			: {
					error:
						"The minimum-salary exception permits contracts of at most two years. Shorten the contract or use another available exception.",
				};
	}
	const type =
		state?.mleType ??
		(payroll < g.get("salaryCap")
			? "room"
			: amount <= levels.taxpayerMLE && years <= 2
				? "taxpayer"
				: "nonTaxpayer");
	const limit =
		type === "room"
			? levels.roomMLE
			: type === "nonTaxpayer"
				? levels.nonTaxpayerMLE
				: levels.taxpayerMLE;
	const hardCap =
		type === "nonTaxpayer"
			? (1 as const)
			: type === "taxpayer"
				? (2 as const)
				: undefined;
	if (
		after > levels.second ||
		(hardCap === 1 && after > levels.first) ||
		used + amount > limit ||
		years > (type === "nonTaxpayer" ? 4 : type === "taxpayer" ? 2 : 3)
	) {
		return {
			error:
				"You do not have enough cap space or an available mid-level exception for this contract. Reduce the salary or duration, or free up payroll.",
		};
	}
	return { state: { mleUsed: used + amount, mleType: type, hardCap } };
};

export const recordApronSeason = async () => {
	if (!apronsEnabled()) {
		return;
	}
	for (const t of await idb.cache.teams.getAll()) {
		if (t.disabled) {
			continue;
		}
		const ts = await idb.cache.teamSeasons.indexGet("teamSeasonsByTidSeason", [
			t.tid,
			g.get("season"),
		]);
		if (!ts || ts.nbaFinancials) {
			continue;
		}
		const payroll = await getPayroll(t.tid);
		const levels = getApronLevels(g.get("salaryCap"), g.get("luxuryPayroll"));
		const secondApron = payroll > levels.second;
		ts.nbaFinancials = {
			salaryCap: g.get("salaryCap"),
			taxLevel: g.get("luxuryPayroll"),
			apronSalary: payroll,
			secondApron,
		};
		await idb.cache.teamSeasons.put(ts);
		for (const p of t.apronPickPenalties ?? []) {
			if (
				p.unfrozen ||
				p.penalized ||
				g.get("season") <= p.triggerSeason ||
				g.get("season") > p.triggerSeason + 4
			) {
				continue;
			}
			if (secondApron) {
				p.over += 1;
			} else {
				p.under += 1;
			}
			if (p.over >= 2) {
				p.penalized = true;
			}
			if (p.under >= 3) {
				p.unfrozen = true;
			}
		}
		if (secondApron) {
			t.apronPickPenalties ??= [];
			t.apronPickPenalties.push({
				season: g.get("season") + 7,
				triggerSeason: g.get("season"),
				over: 0,
				under: 0,
			});
			logEvent({
				type: "luxuryTax",
				text: `The ${t.region} ${t.name} finished the regular season above the second apron. Their ${g.get("season") + 7} first-round pick is frozen. Two more second-apron seasons in the next four years move it to the end of the first round; three seasons below unfreeze it.`,
				tids: [t.tid],
				showNotification: g.get("userTids").includes(t.tid),
				score: 10,
			});
		}
		await idb.cache.teams.put(t);
	}
};
