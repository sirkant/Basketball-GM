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
	test("first apron accepts up to $1M additional salary without activating a hard cap", () => {
		expect(trade({ incoming: 20500 })).toEqual({});
		expect(trade({ incoming: 21000 })).toEqual({});
	});
	test("first apron rejects one dollar beyond tolerance and reports the adjustment", () => {
		expect(trade({ incoming: 21000.001 }).error).toContain("$1 more salary");
		expect(trade({ incoming: 22000 }).error).toContain(
			"$1,000,000 more salary",
		);
	});
	test("floating-point noise cannot reject the inclusive boundary", () => {
		expect(trade({ incoming: 21000.00000000001 })).toEqual({});
	});
	test("both above-apron teams can complete a trade with a $1M salary difference", () => {
		expect(trade({ outgoing: 20000, incoming: 21000 })).toEqual({});
		expect(
			trade({ outgoing: 21000, incoming: 20000, outgoingSalaries: [21000] }),
		).toEqual({});
	});
	test("tolerance also works above the second apron", () => {
		expect(trade({ payrollAfter: 230000, incoming: 21000 })).toEqual({});
	});
	test("second-apron matching shares one tolerance across independent slots", () => {
		expect(
			trade({
				payrollAfter: 230000,
				incoming: 21000,
				outgoingSalaries: [10000, 10000],
				incomingSalaries: [10500, 10500],
			}),
		).toEqual({});
		expect(
			trade({
				payrollAfter: 230000,
				incoming: 20000,
				outgoingSalaries: [15000, 5000],
				incomingSalaries: [14000, 6000],
			}),
		).toEqual({});
		// Net salary is neutral, but one slot requires $1,001,000 of tolerance.
		expect(
			trade({
				payrollAfter: 230000,
				incoming: 20000,
				outgoingSalaries: [15000, 5000],
				incomingSalaries: [13999, 6001],
			}).error,
		).toContain("combines outgoing salaries");
	});
	test("tolerance does not bypass an active first or second apron hard cap", () => {
		for (const hardCap of [1, 2] as const) {
			const limit = hardCap === 1 ? 209015 : 221686;
			expect(
				trade({ hardCap, payrollAfter: limit + 1, incoming: 20001 }).error,
			).toContain("hard cap");
		}
	});
	test("small differences below the apron do not activate expanded-matching hard caps", () => {
		expect(trade({ payrollAfter: 190000, incoming: 21000 })).toEqual({});
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
