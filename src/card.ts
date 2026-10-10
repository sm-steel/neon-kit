import {
	beam,
	beamCss,
	beamDefs,
	bootCss,
	CURSOR_CSS,
	glitchLayer,
	REDUCED_MOTION_CSS,
	scanlineDefs,
	scanlines,
	type Tear,
	tintDefs,
} from "./effects.ts";
import { type FontVariant, type FontWeight, fontFace } from "./font.ts";
import { brackets, panel } from "./frame.ts";
import { hudTitle } from "./hud.ts";
import { PALETTE_KEYS, type Palette } from "./palette.ts";
import { esc, r3, seeded } from "./util.ts";

export interface CardOptions {
	/** Content box size in px; the frame adds padding (and a title row) around it. */
	width: number;
	height: number;
	palette: Palette;
	/** Picks this card's glitch tear position, shift and timing. */
	seed: string;
	/** Accessible description (aria-label and <title>). */
	label: string;
	/** Optional `// TITLE` header with a blinking cursor. */
	title?: string;
	/** Embedded font. Default: the "hud" variant when a title is set, otherwise none. */
	font?: { variant: FontVariant; weights?: FontWeight[] } | false;
	glitch?: boolean;
	beam?: boolean;
	boot?: boolean;
	scanlines?: boolean;
}

export const CARD = {
	pad: 16,
	titleRow: 22,
	bootSeconds: 0.5,
	beamPeriod: 6,
	glitchPeriod: 10,
} as const;

/** One seeded tear inside the content area. */
export function cardTears(
	seed: string,
	area: { y: number; height: number },
): Tear[] {
	const rand = seeded(`glitch:${seed}`);
	const h = r3(Math.min(area.height, 6 + rand() * 10));
	// floor (not round) so the tear never extends past the content's bottom edge
	const y = r3(area.y + Math.floor(rand() * (area.height - h) * 1000) / 1000);
	const at = r3(5 + rand() * 80);
	const dx = r3((rand() < 0.5 ? -1 : 1) * (3 + rand() * 3));
	return [{ y, h, at, dx }];
}

function validate(o: CardOptions, content: string): void {
	if (!(Number.isFinite(o.width) && o.width > 0))
		throw new Error(`card: width must be a positive number, got ${o.width}`);
	if (!(Number.isFinite(o.height) && o.height > 0))
		throw new Error(`card: height must be a positive number, got ${o.height}`);
	if (!content.trim()) throw new Error("card: content is empty");
	const missing = PALETTE_KEYS.filter((k) => o.palette[k] === undefined);
	if (missing.length)
		throw new Error(`card: palette is missing ${missing.join(", ")}`);
}

/** Wraps `content` (SVG markup drawn from 0,0) in the animated neon frame; returns a complete <svg>. */
export function card(o: CardOptions, content: string): string {
	validate(o, content);
	const p = o.palette;
	const { pad, titleRow } = CARD;
	const top = pad + (o.title ? titleRow : 0);
	const width = r3(o.width + 2 * pad);
	const height = r3(top + o.height + pad);
	const region = { width, height };

	const font =
		o.font === undefined
			? o.title
				? { variant: "hud" as const }
				: false
			: o.font;
	const glitch =
		o.glitch === false
			? { defs: "", css: "", svg: "" }
			: glitchLayer({
					target: "nk-content",
					tears: cardTears(o.seed, { y: top, height: o.height }),
					band: { x: pad - 8, width: o.width + 16 },
					period: CARD.glitchPeriod,
					start: CARD.bootSeconds,
					background: p.background,
				});
	const label = esc(o.label);

	const css =
		(font ? fontFace(font.variant, font.weights) : "") +
		(o.boot === false ? "" : bootCss(CARD.bootSeconds)) +
		(o.beam === false
			? ""
			: beamCss(region, {
					period: CARD.beamPeriod,
					delay: CARD.bootSeconds,
				})) +
		(o.title ? CURSOR_CSS : "") +
		glitch.css;
	const defs =
		(o.scanlines === false ? "" : scanlineDefs(p)) +
		(o.beam === false ? "" : beamDefs(p)) +
		(o.glitch === false ? "" : tintDefs(p, region)) +
		glitch.defs;

	return (
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${label}">` +
		`<title>${label}</title>` +
		`<style>${css}</style>` +
		(defs ? `<defs>${defs}</defs>` : "") +
		`<g class="nk-boot">` +
		panel(width, height, p) +
		(o.title ? hudTitle(o.title, pad, pad + 10, p) : "") +
		`<g id="nk-content" transform="translate(${pad} ${r3(top)})">${content}</g>` +
		`</g>` +
		glitch.svg +
		(o.scanlines === false ? "" : scanlines(region)) +
		(o.beam === false ? "" : beam(region)) +
		`<g class="nk-brk">${brackets(width, height, p)}</g>` +
		// last stylesheet in the document, so it also beats CSS that came in with `content`
		`<style>${REDUCED_MOTION_CSS}</style>` +
		`</svg>`
	);
}
