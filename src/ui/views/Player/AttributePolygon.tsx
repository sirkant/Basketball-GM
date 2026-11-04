import { useState } from "react";
import {
	basketballRadarPoints,
	getBasketballRadar,
	type RadarRatings,
} from "../../../common/basketballRadar.ts";

export const AttributePolygon = ({
	current,
	previous,
}: {
	current: RadarRatings & { season?: number };
	previous: RadarRatings & { season?: number };
}) => {
	const [compare, setCompare] = useState(false);
	const axes = getBasketballRadar(current);
	const previousAxes = getBasketballRadar(previous);
	const hasPrevious =
		previous.season !== undefined && previous.season !== current.season;
	const position = (index: number) => {
		const angle = (index * Math.PI) / 3 - Math.PI / 2;
		return { x: 140 + Math.cos(angle) * 109, y: 122 + Math.sin(angle) * 109 };
	};
	return (
		<figure className="dossier-radar">
			<figcaption>
				ATTRIBUTE PROFILE <span>{current.season}</span>
			</figcaption>
			<svg
				viewBox="0 0 280 258"
				role="img"
				aria-label="Player attribute polygon"
			>
				<title>
					{axes.map((axis) => `${axis.label}: ${axis.value}`).join("; ")}.
					Derived from displayed scouting attributes, on a 0–100 scale.
				</title>
				{[25, 50, 75, 100].map((value) => (
					<polygon
						key={value}
						className="dossier-radar-grid"
						points={basketballRadarPoints(axes.map(() => value))}
					/>
				))}
				{axes.map((axis, index) => (
					<line
						key={axis.label}
						className="dossier-radar-axis"
						x1="140"
						y1="122"
						x2={position(index).x}
						y2={position(index).y}
					/>
				))}
				{compare && hasPrevious ? (
					<polygon
						className="dossier-radar-previous"
						points={basketballRadarPoints(
							previousAxes.map((axis) => axis.value),
						)}
					/>
				) : null}
				<polygon
					className="dossier-radar-fill"
					points={basketballRadarPoints(axes.map((axis) => axis.value))}
				/>
				{axes.map((axis, index) => (
					<text
						key={axis.label}
						x={position(index).x}
						y={position(index).y}
						textAnchor="middle"
						dominantBaseline="middle"
					>
						{axis.label.toUpperCase()}
					</text>
				))}
			</svg>
			<dl className="dossier-radar-values">
				{axes.map((axis) => (
					<div key={axis.label} title={`Mean of ${axis.formula}`}>
						<dt>{axis.label}</dt>
						<dd>{axis.value}</dd>
					</div>
				))}
			</dl>
			{hasPrevious ? (
				<label className="dossier-radar-compare">
					<input
						type="checkbox"
						checked={compare}
						onChange={(event) => setCompare(event.target.checked)}
					/>{" "}
					Compare {previous.season}
				</label>
			) : (
				<span>0–100 · Displayed scouting attributes</span>
			)}
			{compare && hasPrevious ? (
				<span>
					Gold: {current.season} · Dashed: {previous.season}
				</span>
			) : null}
		</figure>
	);
};
