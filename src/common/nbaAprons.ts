// All monetary amounts are in thousands of dollars. NBA/NBPA CBA, Article VII.
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
