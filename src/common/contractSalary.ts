import type { PlayerContract } from "./types.ts";

export type ContractProfile = "flat" | "increasing" | "decreasing";

// All values are in thousands, matching raw contracts. No schedule means the
// legacy flat contract, so existing saves need no migration.
export const getContractSalary = (
	contract: Pick<PlayerContract, "amount" | "exp" | "schedule">,
	season: number,
) =>
	contract.schedule?.find((row) => row.season === season)?.amount ??
	contract.amount;

export const buildContractSchedule = (
	averageAmount: number,
	start: number,
	exp: number,
	profile: ContractProfile,
) => {
	const years = exp - start + 1;
	if (
		!Number.isInteger(years) ||
		years < 1 ||
		years > 100 ||
		!Number.isFinite(averageAmount) ||
		averageAmount < 0
	) {
		throw new Error("Invalid contract amount or duration.");
	}
	if (!["flat", "increasing", "decreasing"].includes(profile)) {
		throw new Error("Invalid contract salary profile.");
	}
	const rate =
		profile === "increasing" ? 0.05 : profile === "decreasing" ? -0.05 : 0;
	if (1 + rate * (years - 1) <= 0) {
		throw new Error(
			"This contract is too long for a decreasing salary profile.",
		);
	}
	const total = Math.round(averageAmount * years * 1000) / 1000;
	const first = total / (years + (rate * years * (years - 1)) / 2);
	let assigned = 0;
	return Array.from({ length: years }, (_, index) => {
		const amount =
			Math.round(
				(index === years - 1 ? total - assigned : first * (1 + rate * index)) *
					1000,
			) / 1000;
		assigned += amount;
		return { season: start + index, amount };
	});
};

export const getRemainingContractCost = (
	contract: PlayerContract,
	season: number,
	currentSeasonFraction = 1,
) => {
	let total = 0;
	for (let year = season; year <= contract.exp; year++) {
		total +=
			getContractSalary(contract, year) *
			(year === season ? currentSeasonFraction : 1);
	}
	return total;
};
