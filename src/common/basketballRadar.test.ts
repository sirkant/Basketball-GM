import { expect, test } from "vitest";
import {
	basketballRadarPoints,
	getBasketballRadar,
	type RadarRatings,
} from "./basketballRadar.ts";
const ratings = (value: number): RadarRatings => ({
	ft: value,
	fg: value,
	tp: value,
	ins: value,
	dnk: value,
	oiq: value,
	drb: value,
	pss: value,
	diq: value,
	reb: value,
	stre: value,
	spd: value,
	jmp: value,
	endu: value,
});
test("the polygon responds to each player's actual attributes rather than a fixed shape", () => {
	const a = getBasketballRadar(ratings(50));
	const b = getBasketballRadar({ ...ratings(50), tp: 95, diq: 10 });
	expect(a.map((axis) => axis.value)).toEqual([50, 50, 50, 50, 50, 50]);
	expect(b.map((axis) => axis.value)).toEqual([65, 50, 50, 10, 50, 50]);
	expect(basketballRadarPoints(a.map((axis) => axis.value))).not.toBe(
		basketballRadarPoints(b.map((axis) => axis.value)),
	);
});
test("custom roster extremes and invalid numbers stay inside the 0–100 plot", () => {
	expect(
		getBasketballRadar({ ...ratings(150), diq: NaN, reb: -20 }).map(
			(axis) => axis.value,
		),
	).toEqual([100, 100, 100, 0, 0, 100]);
	expect(basketballRadarPoints([0, 0, 0])).toBe("140,122 140,122 140,122");
	expect(
		basketballRadarPoints([100, 100, 100, 100, 100, 100]).split(" ")[0],
	).toBe("140,40");
});
