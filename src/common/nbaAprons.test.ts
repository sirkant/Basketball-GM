import { describe, expect, test } from "vitest";
import { nbaLuxuryTax } from "./nbaAprons.ts";

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
