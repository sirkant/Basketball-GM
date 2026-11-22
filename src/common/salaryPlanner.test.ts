import { describe, expect, test } from "vitest";
import { projectSalaries } from "./salaryPlanner.ts";

describe("projectSalaries", () => {
	const year = 2026;
	const contracts = [
		{ pid: 1, amount: 11_000, exp: 2026, released: false },
		{
			pid: 2,
			amount: 19_000,
			exp: 2028,
			released: false,
			schedule: [
				{ season: 2026, amount: 18_000 },
				{ season: 2027, amount: 19_000 },
				{ season: 2028, amount: 20_000 },
			],
		},
		{ pid: 1, amount: 2_000, exp: 2027, released: true },
		{ pid: 3, amount: 50_000, exp: 2025, released: false },
	];

	test("projects scheduled and legacy salaries, expirations, and signed distances", () => {
		const plan = projectSalaries(contracts, year, {
			cap: 25_000,
			firstApron: 30_000,
			secondApron: 35_000,
		});
		expect(plan.before).toEqual([
			{
				season: 2026,
				roster: 29_000,
				released: 2_000,
				total: 31_000,
				expiring: 11_000,
				cap: -6_000,
				firstApron: -1_000,
				secondApron: 4_000,
			},
			{
				season: 2027,
				roster: 19_000,
				released: 2_000,
				total: 21_000,
				expiring: 2_000,
				cap: 4_000,
				firstApron: 9_000,
				secondApron: 14_000,
			},
			{
				season: 2028,
				roster: 20_000,
				released: 0,
				total: 20_000,
				expiring: 20_000,
				cap: 5_000,
				firstApron: 10_000,
				secondApron: 15_000,
			},
		]);
	});

	test("compares the proposed roster and preserves dead salary and the original contracts", () => {
		const original = structuredClone(contracts);
		const plan = projectSalaries(
			contracts,
			year,
			{ cap: 31_000 },
			{
				outgoing: [1],
				incoming: [{ pid: 4, amount: 17_000, exp: 2027 }],
			},
		);
		expect(plan.before[0]?.cap).toBe(0);
		expect(plan.after?.map(({ total }) => total)).toEqual([
			37_000, 38_000, 20_000,
		]);
		expect(plan.after?.map(({ released }) => released)).toEqual([
			2_000, 2_000, 0,
		]);
		expect(plan.after?.[0]?.firstApron).toBeUndefined();
		expect(contracts).toEqual(original);
	});

	test("keeps a picks-only offer salary-neutral and omits disabled limits", () => {
		const plan = projectSalaries(
			contracts,
			year,
			{},
			{ outgoing: [], incoming: [] },
		);
		expect(plan.after).toEqual(plan.before);
		expect(plan.before[0]?.cap).toBeUndefined();
	});

	test("keeps a payroll made of fractional thousands exactly on the cap", () => {
		const contracts = [49_000.001, 48_000.003, 2_999.996].map(
			(amount, pid) => ({
				pid,
				amount,
				exp: year,
				released: false,
			}),
		);
		const { before } = projectSalaries(contracts, year, { cap: 100_000 });
		expect(before[0]?.total).toBe(100_000);
		expect(before[0]?.cap).toBe(0);
	});
});
