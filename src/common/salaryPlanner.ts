import { getContractSalary } from "./contractSalary.ts";
import type { ContractInfo } from "./types.ts";

type SalaryCommitment = Pick<
	ContractInfo,
	"pid" | "amount" | "exp" | "schedule" | "released"
>;

type Limits = { cap?: number; firstApron?: number; secondApron?: number };

type TradeScenario = {
	outgoing: readonly number[];
	incoming: readonly Omit<SalaryCommitment, "released">[];
};

// All amounts are in thousands. A positive distance is below the limit.
export const projectSalaries = (
	contracts: readonly SalaryCommitment[],
	firstSeason: number,
	limits: Limits,
	scenario?: TradeScenario,
) => {
	const project = (commitments: readonly SalaryCommitment[]) =>
		Array.from({ length: 3 }, (_, index) => {
			const season = firstSeason + index;
			let roster = 0;
			let released = 0;
			let expiring = 0;
			for (const contract of commitments) {
				if (contract.exp < season) {
					continue;
				}
				const amount = Math.round(getContractSalary(contract, season) * 1000);
				if (contract.released) {
					released += amount;
				} else {
					roster += amount;
				}
				if (contract.exp === season) {
					expiring += amount;
				}
			}

			const total = roster + released;
			const distance = (limit: number | undefined) =>
				limit === undefined
					? undefined
					: (Math.round(limit * 1000) - total) / 1000;
			return {
				season,
				roster: roster / 1000,
				released: released / 1000,
				total: total / 1000,
				expiring: expiring / 1000,
				cap: distance(limits.cap),
				firstApron: distance(limits.firstApron),
				secondApron: distance(limits.secondApron),
			};
		});

	return {
		before: project(contracts),
		after: scenario
			? project([
					...contracts.filter(
						(contract) =>
							contract.released || !scenario.outgoing.includes(contract.pid),
					),
					...scenario.incoming.map((contract) => ({
						...contract,
						released: false,
					})),
				])
			: undefined,
	};
};

export type SalaryPlan = ReturnType<typeof projectSalaries>;
