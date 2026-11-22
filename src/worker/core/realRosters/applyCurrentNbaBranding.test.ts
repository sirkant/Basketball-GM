import { expect, test } from "vitest";
import { applyCurrentNbaBranding } from "./applyCurrentNbaBranding.ts";

test("uses NBA branding by franchise ID without changing the league abbreviation", () => {
	const team = {
		srID: "CHO",
		abbrev: "CHA",
		region: "Charlotte",
		name: "Queens",
		imgURLSmall: "/img/old.svg",
	};
	applyCurrentNbaBranding(team, 2027);
	expect(team).toMatchObject({
		abbrev: "CHA",
		name: "Hornets",
		imgURL: "https://cdn.nba.com/logos/nba/1610612766/primary/L/logo.svg",
	});
	expect(team.imgURLSmall).toBeUndefined();
});

test("leaves historical and unknown franchise identities alone", () => {
	const historical = { srID: "LAC", region: "San Diego", name: "Clippers" };
	const custom = { srID: "PIT", region: "Pittsburgh", name: "Rivers" };
	applyCurrentNbaBranding(historical, 1984);
	applyCurrentNbaBranding(custom, 2027);
	expect(historical.region).toBe("San Diego");
	expect(custom.name).toBe("Rivers");
});
