import { afterEach, expect, test } from "vitest";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { flushSync } from "react-dom";
import {
	getApronLevels,
	getOwnerExpectations,
} from "../../common/nbaAprons.ts";
import { ApronNotice, type FinancialStatus } from "./ApronNotice.tsx";

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

const fixture = (
	changes: Partial<NonNullable<FinancialStatus>> = {},
): NonNullable<FinancialStatus> => ({
	payroll: 150000,
	tax: 0,
	total: 150000,
	levels: getApronLevels(150000, 180000),
	state: undefined,
	owner: getOwnerExpectations("balanced", 150000),
	repeater: false,
	penalties: [],
	budget: true,
	userTeam: true,
	ownerEvaluation: true,
	...changes,
});

const render = (status: FinancialStatus, compact = false) => {
	host = document.createElement("div");
	document.body.append(host);
	root = createRoot(host);
	flushSync(() =>
		root!.render(createElement(ApronNotice, { status, compact })),
	);
	return host;
};

test("does not show NBA finances when aprons are disabled", () => {
	expect(render(undefined).textContent).toBe("");
});

test("distinguishes apron room from spending power and explains threshold boundaries", () => {
	const status = fixture();
	status.payroll = status.levels.first;
	const view = render(status);
	expect(view.innerText).toContain("Below first apron");
	expect(view.innerText).toContain("Apron room is not salary-cap space");
	flushSync(() =>
		root!.render(
			createElement(ApronNotice, {
				status: { ...status, payroll: status.payroll + 1 },
			}),
		),
	);
	expect(view.innerText).toContain(
		"Trade matching allows up to $1M more incoming salary",
	);
	expect(view.innerText).toContain("below the second apron");
});

test("keeps guaranteed dismissal visible outside collapsed rules, including compact dialogs", () => {
	const view = render(
		fixture({ payroll: 300000, tax: 200000, total: 500000 }),
		true,
	);
	expect(
		view.querySelector('[role="status"]')?.classList.contains("alert-danger"),
	).toBe(true);
	expect(view.innerText).toContain(
		"Dismissal guaranteed at the annual evaluation",
	);
	expect(view.innerText).toContain("over the owner's roster budget");
	expect(view.querySelector("details")?.open).toBe(false);
});

test("does not promise dismissal in exempt modes", () => {
	const view = render(
		fixture({
			payroll: 300000,
			tax: 200000,
			total: 500000,
			ownerEvaluation: false,
		}),
	);
	expect(view.innerText).not.toContain("Dismissal guaranteed");
	expect(view.innerText).toContain("Ownership dismissals are disabled");
	expect(view.innerText).toContain("cannot combine salaries");
});

test("keeps hard cap visible and exposes pick penalties in compact mode", () => {
	const view = render(
		fixture({
			state: { season: 2026, hardCap: 1 },
			penalties: [
				{
					season: 2033,
					triggerSeason: 2026,
					over: 2,
					under: 0,
					penalized: true,
				},
			],
		}),
		true,
	);
	expect(view.innerText).toContain(
		"All signings, including renewals and minimum contracts, must fit",
	);
	expect(view.innerText).toContain(
		"1 future first-round pick has apron restrictions",
	);
	view.querySelector("summary")!.click();
	expect(view.innerText).toContain(
		"2033 first-round pick: frozen and moved to the end",
	);
});

test("caps progress bar values while retaining actual over-apron amounts for assistive technology", () => {
	const status = fixture({ payroll: 300000 });
	const view = render(status);
	const bar = view.querySelector('[aria-label="Second apron payroll"]')!;
	expect(Number(bar.getAttribute("aria-valuenow"))).toBe(status.levels.second);
	expect(bar.getAttribute("aria-valuetext")).toContain("$300M payroll");
	expect(bar.getAttribute("aria-valuetext")).toContain(
		"above the second apron",
	);
});
