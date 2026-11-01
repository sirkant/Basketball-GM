import { expect, test } from "vitest";
import {
	buildContractSchedule,
	getContractSalary,
	getRemainingContractCost,
} from "./contractSalary.ts";

test("all three profiles preserve the same guaranteed total", () => {
	for (const profile of ["flat", "increasing", "decreasing"] as const) {
		const schedule = buildContractSchedule(20000, 2027, 2030, profile);
		expect(schedule.reduce((sum, row) => sum + row.amount, 0)).toBeCloseTo(
			80000,
		);
		expect(schedule.map((row) => row.season)).toEqual([2027, 2028, 2029, 2030]);
	}
});

test("annual steps are based on initial salary rather than compound growth", () => {
	for (const profile of ["increasing", "decreasing"] as const) {
		const schedule = buildContractSchedule(20000, 2027, 2030, profile);
		const first = schedule[0]!.amount;
		for (let i = 1; i < schedule.length; i++) {
			expect(
				Math.abs(schedule[i]!.amount - schedule[i - 1]!.amount),
			).toBeCloseTo(first * 0.05, 2);
		}
		expect(schedule[3]!.amount > first).toBe(profile === "increasing");
	}
});

test("old contracts remain flat without a save migration", () => {
	const contract = { amount: 12000, exp: 2030 };
	expect(getContractSalary(contract, 2028)).toBe(12000);
	expect(getRemainingContractCost(contract, 2028, 0.5)).toBe(30000);
});

test("remaining obligations sum actual salaries and prorate only the current season", () => {
	const schedule = [
		{ season: 2027, amount: 20000 },
		{ season: 2028, amount: 21000 },
		{ season: 2029, amount: 22000 },
	];
	const contract = { amount: 20000, exp: 2029, schedule };
	expect(getRemainingContractCost(contract, 2027, 0.5)).toBe(53000);
	expect(getRemainingContractCost(contract, 2028)).toBe(43000);
	expect(getRemainingContractCost(contract, 2030)).toBe(0);
});

test("invalid profiles, money and durations cannot generate a schedule", () => {
	expect(() => buildContractSchedule(Number.NaN, 2027, 2030, "flat")).toThrow();
	expect(() => buildContractSchedule(-100, 2027, 2030, "increasing")).toThrow();
	expect(() => buildContractSchedule(100, 2027, 2026, "flat")).toThrow();
	expect(() => buildContractSchedule(100, 2027, 2050, "decreasing")).toThrow();
});
