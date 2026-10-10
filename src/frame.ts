import type { Palette } from "./palette.ts";
import { r3 } from "./util.ts";

export const BRACKET = { inset: 4, arm: 10 } as const;

/** Square panel with a crisp 1px border (the .5 offset aligns the stroke to pixels). */
export function panel(width: number, height: number, p: Palette): string {
	return `<rect x=".5" y=".5" width="${r3(width - 1)}" height="${r3(height - 1)}" fill="${p.background}" stroke="${p.border}"/>`;
}

/** The four L-shaped corner brackets. */
export function brackets(width: number, height: number, p: Palette): string {
	const w = r3(width);
	const h = r3(height);
	const { inset: i, arm: l } = BRACKET;
	const d = [
		`M${i} ${i + l}V${i}H${i + l}`,
		`M${r3(w - i - l)} ${i}H${r3(w - i)}V${i + l}`,
		`M${i} ${r3(h - i - l)}V${r3(h - i)}H${i + l}`,
		`M${r3(w - i - l)} ${r3(h - i)}H${r3(w - i)}V${r3(h - i - l)}`,
	].join("");
	return `<path d="${d}" fill="none" stroke="${p.accent}" stroke-width="1.5" stroke-opacity=".8"/>`;
}
