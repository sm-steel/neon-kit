import type { Palette } from "./palette.ts";
import { r3 } from "./util.ts";

export interface Region {
	width: number;
	height: number;
}

/** One glitch tear: a horizontal band [y, y+h) shown at `at`% of the cycle, shifted by dx px. */
export interface Tear {
	y: number;
	h: number;
	at: number;
	dx: number;
}

export interface GlitchSpec {
	/** id of the element the tears copy (via <use>). */
	target: string;
	tears: Tear[];
	/** Horizontal extent of each tear's clip box. */
	band: { x: number; width: number };
	/** Seconds per cycle, and delay before the first cycle. */
	period: number;
	start: number;
	/** Fills the torn band so the shifted copy doesn't show the original underneath. */
	background: string;
}

export const TEAR_SECONDS = 0.126;

const BEAM_HEIGHT = 40;

export function scanlineDefs(p: Palette): string {
	const color = p.dark ? "#000000" : p.text;
	const opacity = p.dark ? 0.28 : 0.05;
	return `<pattern id="nk-sl" width="3" height="3" patternUnits="userSpaceOnUse"><rect width="3" height="1" fill="${color}" fill-opacity="${opacity}"/></pattern>`;
}

export const scanlines = (r: Region): string =>
	`<rect width="${r3(r.width)}" height="${r3(r.height)}" fill="url(#nk-sl)" pointer-events="none"/>`;

export function beamDefs(p: Palette): string {
	const mid = p.dark ? 0.09 : 0.06;
	return `<linearGradient id="nk-bm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.accent}" stop-opacity="0"/><stop offset=".5" stop-color="${p.accent}" stop-opacity="${mid}"/><stop offset="1" stop-color="${p.accent}" stop-opacity="0"/></linearGradient>`;
}

export const beam = (r: Region): string =>
	`<rect class="nk-bm" width="${r3(r.width)}" height="${BEAM_HEIGHT}" fill="url(#nk-bm)" pointer-events="none"/>`;

export function beamCss(
	r: Region,
	o: { period: number; delay: number },
): string {
	return (
		`.nk-bm{opacity:0;animation:nk-bm ${o.period}s ${r3(o.delay)}s linear infinite}` +
		`@keyframes nk-bm{0%{opacity:1;transform:translateY(-${BEAM_HEIGHT}px)}100%{opacity:1;transform:translateY(${r3(r.height)}px)}}`
	);
}

export function tintDefs(p: Palette, r: Region): string {
	const region = `filterUnits="userSpaceOnUse" x="0" y="0" width="${r3(r.width)}" height="${r3(r.height)}"`;
	const tint = (id: string, color: string) =>
		`<filter id="${id}" ${region}><feFlood flood-color="${color}"/><feComposite in2="SourceGraphic" operator="in"/></filter>`;
	return tint("nk-ta", p.glitchA) + tint("nk-tb", p.glitchB);
}

/** Clipped copies of `target`, torn sideways with a red/cyan channel split, a few times per cycle. */
export function glitchLayer(g: GlitchSpec): {
	defs: string;
	css: string;
	svg: string;
} {
	const dur = (TEAR_SECONDS / g.period) * 100;
	let defs = "";
	let css = "";
	let svg = "";
	g.tears.forEach((t, i) => {
		const box = `x="${r3(g.band.x)}" y="${r3(t.y)}" width="${r3(g.band.width)}" height="${r3(t.h)}"`;
		defs += `<clipPath id="nk-k${i}"><rect ${box}/></clipPath>`;
		const at = (f: number) => r3(t.at + dur * f);
		css +=
			`.nk-gk${i}{opacity:0;animation:nk-gk${i} ${g.period}s ${r3(g.start)}s steps(1,end) infinite}` +
			`@keyframes nk-gk${i}{0%,${r3(t.at)}%{opacity:0;transform:none}` +
			`${at(0.056)}%{opacity:1;transform:translateX(${r3(t.dx)}px)}` +
			`${at(0.389)}%{opacity:1;transform:translateX(${r3(-t.dx / 2)}px)}` +
			`${at(0.722)}%{opacity:1;transform:translateX(${r3(t.dx / 3)}px)}` +
			`${at(1)}%,100%{opacity:0;transform:none}}`;
		svg +=
			`<g clip-path="url(#nk-k${i})"><g class="nk-gk${i}">` +
			`<rect ${box} fill="${g.background}"/>` +
			`<use href="#${g.target}" filter="url(#nk-ta)" x="-2" opacity=".85"/>` +
			`<use href="#${g.target}" filter="url(#nk-tb)" x="2" opacity=".85"/>` +
			`<use href="#${g.target}"/></g></g>`;
	});
	return { defs, css, svg };
}

/** CRT power-on flicker for the card body, and a fade-in for the brackets. */
export function bootCss(seconds: number): string {
	const s = r3(seconds);
	return (
		`.nk-boot{animation:nk-boot ${s}s ease-out both}` +
		"@keyframes nk-boot{0%{opacity:0}35%{opacity:1}50%{opacity:.15}65%{opacity:1}80%{opacity:.55}100%{opacity:1}}" +
		`.nk-brk{animation:nk-brk ${s}s ease-out both}` +
		"@keyframes nk-brk{0%{opacity:0}100%{opacity:1}}"
	);
}

export const CURSOR_CSS =
	".nk-cur{animation:nk-blink 1.1s steps(1,end) infinite}@keyframes nk-blink{50%{opacity:0}}";

/**
 * Turns every animation off for viewers who prefer reduced motion. `:root *` has the same
 * specificity as the kit's single-class animation rules, so it wins by order: emit it last.
 */
export const REDUCED_MOTION_CSS =
	"@media (prefers-reduced-motion:reduce){:root *{animation:none}}";
