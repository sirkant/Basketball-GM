import { afterEach, expect, test } from "vitest";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { flushSync } from "react-dom";
import {
	getApronLevels,
	getOwnerExpectations,
} from "../../../common/nbaAprons.ts";
import type { View } from "../../../common/types.ts";
import FinancialDetails from "./FinancialDetails.tsx";

let root: Root | undefined;
let host: HTMLDivElement | undefined;
afterEach(() => {
	if (root) {
		flushSync(() => root!.unmount());
	}
	host?.remove();
	root = undefined;
	host = undefined;
});

const summaryTeam = (other: 0 | 1) => ({
	name: `Team ${other}`,
	ovrBefore: 50,
	ovrAfter: 50,
	payrollBeforeTrade: 200,
	payrollAfterTrade: 200,
	total: 20,
	trade: [],
	picks: [],
	other,
});

const fixture = (): View<"trade">["summary"] => ({
	enablePropose: true,
	warning: null,
	warningAmount: undefined,
	apronHardCap: undefined,
	teams: [summaryTeam(1), summaryTeam(0)],
	financialStatus: {
		payroll: 200000,
		tax: 0,
		total: 200000,
		levels: getApronLevels(164961, 200428),
		state: undefined,
		owner: getOwnerExpectations("balanced", 164961),
		repeater: false,
		penalties: [],
		budget: true,
		userTeam: true,
		ownerEvaluation: true,
	},
});

const render = (summary: View<"trade">["summary"]) => {
	host = document.createElement("div");
	document.body.append(host);
	root = createRoot(host);
	flushSync(() => root!.render(createElement(FinancialDetails, { summary })));
	return host;
};

test("keeps the financial report collapsed until requested", () => {
	const view = render(fixture());
	expect(view.querySelector("details")?.open).toBe(false);
	expect(view.innerText).toContain("$1M salary matching tolerance per team");
	expect(view.innerText).not.toContain("Owner targets");
	expect(view.querySelector('[role="status"]')?.checkVisibility()).toBe(false);
	view.querySelector("summary")!.click();
	expect(view.querySelector('[role="status"]')?.checkVisibility()).toBe(true);
});

test("guaranteed dismissal remains visible outside the collapsed report", () => {
	const summary = fixture();
	Object.assign(summary.financialStatus!, {
		payroll: 300000,
		tax: 200000,
		total: 500000,
	});
	const view = render(summary);
	expect(view.querySelector('[role="alert"]')?.checkVisibility()).toBe(true);
	expect(view.innerText).toContain("guaranteed dismissal");
	expect(view.querySelector("details")?.open).toBe(false);
});

test("shows the strictest hard cap without expanding financial details", () => {
	const summary = fixture();
	summary.financialStatus!.state = { season: 2026, hardCap: 1 };
	summary.apronHardCap = 2;
	expect(render(summary).innerText).toContain(
		"Hard cap after trade: first apron",
	);
});

test("does not show NBA financial rules for other cap modes", () => {
	const summary = fixture();
	summary.financialStatus = undefined;
	expect(render(summary).textContent).toBe("");
});
