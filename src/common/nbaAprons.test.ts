import { describe, expect, test } from "vitest";
import {
	getApronLevels,
	getApronTradeRule,
	nbaLuxuryTax,
} from "./nbaAprons.ts";

const base = { salaryCap: 164961, taxLevel: 200428 };
const trade = (changes: Partial<Parameters<typeof getApronTradeRule>[0]>) =>
	getApronTradeRule({
		...base,
		payrollAfter: 210000,
		outgoing: 20000,
		incoming: 20000,
		outgoingSalaries: [20000],
		...changes,
	});

test("2026-27 NBA apron levels", () => {
	expect(getApronLevels(base.salaryCap, base.taxLevel).first).toBe(209015);
	expect(getApronLevels(base.salaryCap, base.taxLevel).second).toBe(221686);
});

describe("progressive luxury tax", () => {
	test("no tax at or below the threshold", () => {
		expect(nbaLuxuryTax(200428, 200428, 164961)).toBe(0);
	});
	test("CBA example: 15M excess with 6M brackets costs 24M", () => {
		expect(nbaLuxuryTax(215000, 200000, (136021 * 6) / 5)).toBeCloseTo(24000);
	});
	test("CBA repeater example: 15M excess, 6.5M brackets", () => {
		expect(nbaLuxuryTax(215000, 200000, (136021 * 6.5) / 5, true)).toBeCloseTo(
			51625,
		);
	});
	test("higher brackets apply only to the marginal excess", () => {
		expect(nbaLuxuryTax(230000, 200000, 136021)).toBe(107500);
	});
});

describe("trade restrictions", () => {
	test("first apron forbids taking additional salary", () => {
		expect(trade({ incoming: 20001 }).error).toContain("first apron");
	});
	test("matching salary remains legal above second apron", () => {
		expect(trade({ payrollAfter: 230000 })).toEqual({});
	});
	test("aggregation cannot leave the team above the second apron", () => {
		expect(
			trade({ payrollAfter: 230000, outgoingSalaries: [10000, 10000] }).error,
		).toContain("combines outgoing salaries");
	});
	test("aggregation is legal when the trade gets below the second apron", () => {
		expect(
			trade({
				payrollAfter: 220000,
				outgoing: 30000,
				outgoingSalaries: [15000, 15000],
			}),
		).toEqual({ hardCap: 2 });
	});
	test("multiple independently matched contracts do not require aggregation", () => {
		expect(
			trade({
				payrollAfter: 230000,
				outgoingSalaries: [10000, 10000],
				incomingSalaries: [10000, 10000],
			}),
		).toEqual({});
	});
	test("matching cannot reuse the same outgoing contract twice", () => {
		expect(
			trade({
				payrollAfter: 230000,
				outgoingSalaries: [15000, 5000],
				incomingSalaries: [10000, 10000],
			}).error,
		).toBeDefined();
	});
	test("hard cap survives a subsequent salary-neutral transaction", () => {
		expect(trade({ hardCap: 1, payrollAfter: 210000 }).error).toContain(
			"hard cap",
		);
	});
	test("expanded matching activates the first-apron hard cap", () => {
		expect(
			trade({
				payrollAfter: 190000,
				outgoing: 10000,
				incoming: 15000,
				outgoingSalaries: [10000],
			}),
		).toEqual({ hardCap: 1 });
	});
	test("cap-space trade does not activate an apron hard cap", () => {
		expect(
			trade({
				payrollAfter: 160000,
				outgoing: 10000,
				incoming: 30000,
				outgoingSalaries: [10000],
			}),
		).toEqual({});
	});
});
