import { type CardOptions, card } from "./card.ts";
import { REDUCED_MOTION_CSS } from "./effects.ts";
import { type FontVariant, type FontWeight, fontFace } from "./font.ts";
import { esc, r3 } from "./util.ts";

export interface GridCell {
	/** Top-left of the card's outer frame inside the grid. */
	x: number;
	y: number;
	/** The card's options; `font` and `ns` are set by the grid. */
	options: Omit<CardOptions, "font" | "ns">;
	content: string;
}

export interface GridOptions {
	width: number;
	height: number;
	/** Accessible description of the whole image. */
	label: string;
	/** Embedded once for all cards. */
	font?: { variant: FontVariant; weights?: FontWeight[] };
}

/**
 * Several cards in one SVG: each is namespaced (`nk0-`, `nk1-`, …) so ids and animations
 * don't collide, keeps its own seeded glitch timing, and shares one embedded font.
 */
export function cardGrid(o: GridOptions, cells: GridCell[]): string {
	if (!(Number.isFinite(o.width) && o.width > 0))
		throw new Error(
			`cardGrid: width must be a positive number, got ${o.width}`,
		);
	if (!(Number.isFinite(o.height) && o.height > 0))
		throw new Error(
			`cardGrid: height must be a positive number, got ${o.height}`,
		);
	if (cells.length === 0) throw new Error("cardGrid: cells is empty");

	const cards = cells
		.map((c, i) =>
			card({ ...c.options, font: false, ns: `nk${i}` }, c.content).replace(
				'<svg xmlns="http://www.w3.org/2000/svg" ',
				`<svg x="${r3(c.x)}" y="${r3(c.y)}" `,
			),
		)
		.join("");
	const label = esc(o.label);
	const width = r3(o.width);
	const height = r3(o.height);
	return (
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${label}">` +
		`<title>${label}</title>` +
		(o.font
			? `<style>${fontFace(o.font.variant, o.font.weights)}</style>`
			: "") +
		cards +
		`<style>${REDUCED_MOTION_CSS}</style>` +
		`</svg>`
	);
}
