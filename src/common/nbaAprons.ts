// Dollar amounts throughout this module are in thousands, like player contracts.
// NBA/NBPA 2023 CBA, Article VII. System levels scale with the salary cap.
export const getApronLevels = (salaryCap: number, taxLevel: number) => ({
	first: taxLevel + salaryCap * (8587 / 164961),
	second: taxLevel + salaryCap * (21258 / 164961),
	nonTaxpayerMLE: salaryCap * (15044 / 164961),
	taxpayerMLE: salaryCap * (6064 / 164961),
	roomMLE: salaryCap * (9366 / 164961),
});

export const nbaLuxuryTax = (
	payroll: number,
	taxLevel: number,
	salaryCap: number,
	repeater = false,
) => {
	const bracket = (5000 * salaryCap) / 136021;
	if (bracket <= 0) {
		return 0;
	}
	let excess = Math.max(0, payroll - taxLevel);
	let tax = 0;
	for (let i = 0; excess > 0; i++) {
		const amount = Math.min(excess, bracket);
		const rate = [1, 1.25, 3.5, 4.75][i] ?? 5.25 + (i - 4) * 0.5;
		tax += amount * (rate + (repeater ? 2 : 0));
		excess -= amount;
	}
	return tax;
};

export type ApronState = {
	season: number;
	hardCap?: 1 | 2;
	mleUsed?: number;
	mleType?: "room" | "taxpayer" | "nonTaxpayer";
};

export type ApronPickPenalty = {
	season: number;
	triggerSeason: number;
	over: number;
	under: number;
	penalized?: boolean;
	unfrozen?: boolean;
};

// Gameplay allowance, not an NBA CBA rule. One shared allowance per team/trade,
// never an allowance per player, and never extra room under an active hard cap.
export const TRADE_SALARY_TOLERANCE = 1000;

export const getApronTradeRule = ({
	payrollAfter,
	outgoing,
	incoming,
	outgoingSalaries,
	incomingSalaries = [incoming],
	salaryCap,
	taxLevel,
	hardCap,
}: {
	payrollAfter: number;
	outgoing: number;
	incoming: number;
	outgoingSalaries: number[];
	incomingSalaries?: number[];
	salaryCap: number;
	taxLevel: number;
	hardCap?: 1 | 2;
}): { error?: string; hardCap?: 1 | 2 } => {
	const levels = getApronLevels(salaryCap, taxLevel);
	// Summaries pass through millions. Compare whole dollars to avoid rejecting
	// trades exactly on the boundary due to binary floating-point noise.
	const salaryIncrease = Math.round((incoming - outgoing) * 1000) / 1000;
	if (
		hardCap &&
		payrollAfter > (hardCap === 1 ? levels.first : levels.second)
	) {
		return {
			error: `This trade exceeds your hard cap at the ${hardCap === 1 ? "first" : "second"} apron. Reduce incoming salary.`,
		};
	}
	if (payrollAfter > levels.first && salaryIncrease > TRADE_SALARY_TOLERANCE) {
		return {
			error: `Above the first apron, incoming salary exceeds the game's $1M matching tolerance. Send at least $${Math.round((salaryIncrease - TRADE_SALARY_TOLERANCE) * 1000).toLocaleString("en-US")} more salary or reduce incoming salary.`,
		};
	}
	const payrollBefore = payrollAfter - incoming + outgoing;
	if (
		payrollAfter <= salaryCap ||
		(payrollBefore < salaryCap && payrollAfter <= salaryCap + 100)
	) {
		return {};
	}
	// Match incoming contracts to independent outgoing salary slots. Sending two
	// players is not aggregation when each incoming contract fits independently.
	const slots = [...outgoingSalaries].sort((a, b) => b - a);
	const incomingSorted = [...incomingSalaries]
		.filter((x) => x > 0)
		.sort((a, b) => b - a);
	const match = (index: number, remainingTolerance: number): boolean => {
		if (index === incomingSorted.length) {
			return true;
		}
		const seen = new Set<number>();
		for (let i = 0; i < slots.length; i++) {
			const slot = slots[i]!;
			const shortage = Math.max(
				0,
				Math.round((incomingSorted[index]! - slot) * 1000) / 1000,
			);
			if (seen.has(slot) || shortage > remainingTolerance) {
				continue;
			}
			seen.add(slot);
			slots[i] = Math.max(0, slot - incomingSorted[index]!);
			if (match(index + 1, remainingTolerance - shortage)) {
				return true;
			}
			slots[i] = slot;
		}
		return false;
	};
	const aggregated =
		outgoingSalaries.length > 1 && !match(0, TRADE_SALARY_TOLERANCE);
	if (payrollAfter > levels.second && aggregated) {
		return {
			error:
				"This trade combines outgoing salaries while leaving you above the second apron. Get below the second apron or match the incoming salary with one outgoing contract.",
		};
	}
	if (payrollAfter > salaryCap && salaryIncrease > TRADE_SALARY_TOLERANCE) {
		const scale = salaryCap / 136021;
		const matching =
			payrollAfter > taxLevel
				? 1.25 * outgoing + 250
				: outgoing <= 7500 * scale
					? 2 * outgoing + 250
					: outgoing <= 29000 * scale
						? outgoing + 7500 * scale
						: 1.25 * outgoing + 250;
		if (incoming > matching) {
			return {
				error:
					"Incoming salary exceeds the amount you can match. Send more salary or use cap space.",
			};
		}
		return { hardCap: 1 };
	}
	return aggregated ? { hardCap: 2 } : {};
};

export type OwnerPriority = "winning" | "profit" | "lowPayroll" | "balanced";

export const getOwnerExpectations = (
	priority: OwnerPriority,
	salaryCap: number,
) => {
	const profiles = {
		winning: {
			label: "Championship contender",
			winPct: 0.61,
			profit: 0,
			cost: 1.65,
			winsWeight: 1.6,
			moneyWeight: 0.8,
			text: "Build a contender and win playoff series. I will fund a competitive roster, but overspending and losing flexibility still count against you.",
		},
		profit: {
			label: "Profitable franchise",
			winPct: 0.5,
			profit: 0.18,
			cost: 1.3,
			winsWeight: 0.9,
			moneyWeight: 1.8,
			text: "Make a profit while keeping the team competitive. Salaries and luxury tax must be justified by revenue.",
		},
		lowPayroll: {
			label: "Efficient, affordable roster",
			winPct: 0.5,
			profit: 0.1,
			cost: 1.05,
			winsWeight: 1,
			moneyWeight: 1.5,
			text: "Build an affordable team that can compete. Stay within the roster budget and find value in the draft and the market.",
		},
		balanced: {
			label: "Sustainable contender",
			winPct: 0.55,
			profit: 0.09,
			cost: 1.45,
			winsWeight: 1.2,
			moneyWeight: 1.2,
			text: "Win games, earn a profit, and keep room to improve the roster. I expect a sustainable competitive team.",
		},
	};
	const p = profiles[priority];
	return {
		...p,
		priority,
		minProfit: p.profit * salaryCap,
		maxCost: p.cost * salaryCap,
	};
};
