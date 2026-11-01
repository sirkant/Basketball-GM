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
	if (
		hardCap &&
		payrollAfter > (hardCap === 1 ? levels.first : levels.second)
	) {
		return {
			error: `This trade exceeds your hard cap at the ${hardCap === 1 ? "first" : "second"} apron. Reduce incoming salary.`,
		};
	}
	if (payrollAfter > levels.first && incoming > outgoing) {
		return {
			error:
				"Above the first apron, you cannot receive more salary than you send out. Reduce incoming salary to complete this trade.",
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
	const match = (index: number): boolean => {
		if (index === incomingSorted.length) {
			return true;
		}
		const seen = new Set<number>();
		for (let i = 0; i < slots.length; i++) {
			const slot = slots[i]!;
			if (seen.has(slot) || slot < incomingSorted[index]!) {
				continue;
			}
			seen.add(slot);
			slots[i] = slot - incomingSorted[index]!;
			if (match(index + 1)) {
				return true;
			}
			slots[i] = slot;
		}
		return false;
	};
	const aggregated = outgoingSalaries.length > 1 && !match(0);
	if (payrollAfter > levels.second && aggregated) {
		return {
			error:
				"This trade combines outgoing salaries while leaving you above the second apron. Get below the second apron or match the incoming salary with one outgoing contract.",
		};
	}
	if (payrollAfter > salaryCap && incoming > outgoing) {
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
