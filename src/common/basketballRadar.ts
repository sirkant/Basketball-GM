const definitions = [
	{ label: "Shooting", keys: ["ft", "fg", "tp"] },
	{ label: "Finishing", keys: ["ins", "dnk"] },
	{ label: "Creation", keys: ["oiq", "drb", "pss"] },
	{ label: "Defense", keys: ["diq"] },
	{ label: "Rebounding", keys: ["reb"] },
	{ label: "Athleticism", keys: ["stre", "spd", "jmp", "endu"] },
] as const;
type Attribute = (typeof definitions)[number]["keys"][number];
export type RadarRatings = Record<Attribute, number>;
const bounded = (value: number) =>
	Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
export const getBasketballRadar = (ratings: RadarRatings) =>
	definitions.map((axis) => ({
		label: axis.label,
		value: Math.round(
			axis.keys.reduce((sum, key) => sum + bounded(ratings[key]), 0) /
				axis.keys.length,
		),
		formula: axis.keys.join(" + "),
	}));
export const basketballRadarPoints = (values: number[], radius = 82) =>
	values
		.map((value, index) => {
			const angle = (index * Math.PI * 2) / values.length - Math.PI / 2;
			const r = (radius * bounded(value)) / 100;
			return `${140 + Math.cos(angle) * r},${122 + Math.sin(angle) * r}`;
		})
		.join(" ");
